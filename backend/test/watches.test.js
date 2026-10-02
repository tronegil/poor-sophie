// Calm-passage alerts: the decision, the message, the runner and the run
// endpoint's secret — all offline with fakes.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { decide, message, runWatches } = require('../src/services/watches');
const { parseSubscription } = require('../src/routes/push');

const NOW = new Date('2026-10-03T06:00:00Z');
const at = h => new Date(NOW.getTime() + h * 3600e3).toISOString();
const dep = (h, score, band = 'comfortable') => ({ departure: at(h), score, band });

test('decide picks the calmest qualifying departure at least an hour away', () => {
  const deps = [dep(0, 1.0, 'flat'), dep(3, 3.5), dep(6, 2.1), dep(9, 2.1), dep(12, 5.0, 'uncomfortable'), dep(15, null)];
  const d = decide(deps, 4, NOW, null);
  assert.equal(d.notify, true);
  assert.equal(d.departure.departure, at(6)); // 0 h is too soon; 6 h beats 9 h on the tie
  assert.equal(decide(deps, 2, NOW, null).notify, false);
  assert.equal(decide([], 4, NOW, null).reason, 'none-calm');
});

test('decide does not repeat a departure it already announced', () => {
  const deps = [dep(6, 2.1)];
  assert.equal(decide(deps, 4, NOW, at(5)).reason, 'already-told');   // same window
  assert.equal(decide(deps, 4, NOW, at(20)).notify, true);            // a different one
  assert.equal(decide(deps, 4, NOW, at(-30)).notify, true);           // the old one has passed
});

test('message is in the owner’s language with a decimal comma in Norwegian', () => {
  const m = message({ tripName: 'Hjem → Tau', departure: dep(6, 2.1), lang: 'no', url: '/boats/b1/passage?trip=t1' });
  assert.equal(m.title, 'Rolig avgang: Hjem → Tau');
  assert.match(m.body, /2,1 Behagelig/);
  assert.match(m.body, /14:00/); // 12:00 UTC = 14:00 Oslo summer time
  assert.equal(m.url, '/boats/b1/passage?trip=t1');
  assert.match(message({ tripName: 'X', departure: dep(6, 2.1), lang: 'en', url: '/' }).body, /2\.1 Comfortable/);
});

test('parseSubscription accepts only https endpoints with keys', () => {
  assert.ok(parseSubscription({ endpoint: 'https://push.example/abc', keys: { p256dh: 'p', auth: 'a' } }));
  assert.equal(parseSubscription({ endpoint: 'http://x', keys: { p256dh: 'p', auth: 'a' } }), null);
  assert.equal(parseSubscription({ endpoint: 'https://x' }), null);
});

function fakePool(trips, subs) {
  const log = [];
  return {
    log,
    async query(sql, p = []) {
      log.push(sql.trim().split(/\s+/).slice(0, 2).join(' '));
      if (sql.includes('FROM trips t JOIN boats')) return { rows: trips };
      if (sql.startsWith('SELECT id, endpoint')) return { rows: subs.filter(s => s.user_id === p[0]) };
      if (sql.startsWith('DELETE FROM push_subscriptions')) { const i = subs.findIndex(s => s.id === p[0]); subs.splice(i, 1); return { rowCount: 1 }; }
      if (sql.startsWith('UPDATE trips SET watch_notified_at')) { Object.assign(trips.find(t => t.id === p[0]), { notified: p[1] }); return { rowCount: 1 }; }
      if (sql.startsWith('UPDATE trips SET watch_checked_at')) { trips.find(t => t.id === p[0]).checked = true; return { rowCount: 1 }; }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };
}
const trip = (id, extra = {}) => ({ id, name: `Trip ${id}`, boat_id: 'b1', user_id: 'u1', waypoints: [{ lat: 59, lon: 5.6 }, { lat: 59.1, lon: 5.8 }], speed_kn: '5.5', watch_threshold: '4.0', watch_notified_departure: null, language: 'no', ...extra });

test('runWatches notifies, drops dead subscriptions and records what it told', async () => {
  const trips = [trip('t1'), trip('t2', { watch_threshold: '2.0' })];
  const subs = [{ id: 's1', user_id: 'u1', endpoint: 'https://a' }, { id: 's2', user_id: 'u1', endpoint: 'https://gone' }];
  const pool = fakePool(trips, subs);
  const sent = [];
  const scoreWindow = async () => ({ status: 200, body: { departures: [dep(3, 3.2), dep(6, 2.8)] } });
  const sendTo = async (sub, payload) => { sent.push([sub.id, payload.title]); return sub.endpoint === 'https://gone' ? 'gone' : 'sent'; };

  const summary = await runWatches({ pool, scoreWindow, sendTo, now: NOW });
  assert.deepEqual(summary, { checked: 2, notified: 1, noData: 0, outOfTime: 0 });
  assert.deepEqual(sent.map(s => s[1]), ['Rolig avgang: Trip t1', 'Rolig avgang: Trip t1']); // t2's threshold 2 isn't met
  assert.equal(trips[0].notified, at(6));
  assert.ok(trips[0].checked && trips[1].checked);
  assert.deepEqual(subs.map(s => s.id), ['s1']);
});

test('runWatches counts missing forecasts and stops at the time budget', async () => {
  const trips = [trip('t1'), trip('t2'), trip('t3')];
  const pool = fakePool(trips, []);
  let calls = 0;
  const scoreWindow = async () => { calls++; await new Promise(r => setTimeout(r, 30)); return { status: 422, body: {} }; };
  const summary = await runWatches({ pool, scoreWindow, sendTo: async () => 'sent', now: NOW, budgetMs: 40 });
  assert.equal(summary.noData, summary.checked);
  assert.ok(summary.outOfTime >= 1 && calls < 3);
});

test('the run endpoint needs the secret', async () => {
  process.env.DATABASE_URL ||= 'postgres://test@localhost/test';
  require.cache[path.resolve(__dirname, '../src/config/db.js')] = { exports: fakePool([], []), loaded: true, id: 'db' };
  const express = require('express');
  const app = express();
  app.use('/watches', require('../src/routes/watches'));
  const server = app.listen(0);
  await new Promise(r => server.on('listening', r));
  const url = `http://127.0.0.1:${server.address().port}/watches/run`;
  try {
    delete process.env.WATCH_CRON_SECRET; delete process.env.CRON_SECRET;
    assert.equal((await fetch(url, { method: 'POST' })).status, 503);
    process.env.WATCH_CRON_SECRET = 's3cret';
    assert.equal((await fetch(url, { method: 'POST' })).status, 401);
    assert.equal((await fetch(url, { method: 'POST', headers: { authorization: 'Bearer nope' } })).status, 401);
    const ok = await fetch(url, { method: 'POST', headers: { authorization: 'Bearer s3cret' } });
    assert.equal(ok.status, 200);
    assert.deepEqual(await ok.json(), { checked: 0, notified: 0, noData: 0, outOfTime: 0 });
  } finally {
    server.close();
  }
});
