// Saved trips: validation, ownership and CRUD over HTTP, against an in-memory
// stand-in for the pg pool (no database needed).
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');

process.env.JWT_SECRET = 'test-secret';

// --- fake pool: just the queries routes/trips.js issues ---------------------
const boats = [{ id: 'b1', user_id: 'u1' }, { id: 'b2', user_id: 'u2' }];
let trips = [];
const fakePool = {
  async query(sql, p = []) {
    if (sql.startsWith('SELECT id, user_id FROM boats')) return { rows: boats.filter(b => b.id === p[0]) };
    if (sql.startsWith('SELECT COUNT(*)')) return { rows: [{ n: trips.filter(t => t.boat_id === p[0]).length }] };
    if (sql.includes('FROM trips WHERE boat_id')) return { rows: trips.filter(t => t.boat_id === p[0]).sort((a, b) => b.updated_at - a.updated_at) };
    if (sql.startsWith('INSERT INTO trips')) {
      const row = { id: crypto.randomUUID(), boat_id: p[0], user_id: p[1], name: p[2], waypoints: JSON.parse(p[3]), speed_kn: String(p[4]), crew: p[5], created_at: new Date(), updated_at: new Date() };
      trips.push(row); return { rows: [row] };
    }
    if (sql.startsWith('UPDATE trips')) {
      const row = trips.find(t => t.id === p[4] && t.boat_id === p[5]);
      if (!row) return { rows: [] };
      Object.assign(row, { name: p[0], waypoints: JSON.parse(p[1]), speed_kn: String(p[2]), crew: p[3], updated_at: new Date() });
      return { rows: [row] };
    }
    if (sql.startsWith('DELETE FROM trips')) {
      const before = trips.length; trips = trips.filter(t => !(t.id === p[0] && t.boat_id === p[1]));
      return { rowCount: before - trips.length };
    }
    throw new Error(`Unexpected query: ${sql}`);
  },
};
require.cache[path.resolve(__dirname, '../src/config/db.js')] = { exports: fakePool, loaded: true, id: 'db' };

const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const tripRoutes = require('../src/routes/trips');
const { parseTrip } = tripRoutes;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/boats/:boatId/trips', tripRoutes);

let base;
const server = app.listen(0);
test.before(() => new Promise(r => server.on('listening', () => { base = `http://127.0.0.1:${server.address().port}`; r(); })));
test.after(() => server.close());

const cookie = uid => `token=${jwt.sign({ id: uid }, process.env.JWT_SECRET)}`;
const call = (method, url, { user = 'u1', body } = {}) => fetch(base + url, {
  method, headers: { 'content-type': 'application/json', ...(user ? { cookie: cookie(user) } : {}) }, body: body && JSON.stringify(body),
});
const TRIP = { name: 'Stavanger → Tau', waypoints: [{ lat: 58.97561, lon: 5.73 }, { lat: 59.0646, lon: 5.9167 }], speedKn: 5.55, crew: 'novice' };

test('parseTrip validates and normalises', () => {
  assert.deepEqual(parseTrip(TRIP), { name: 'Stavanger → Tau', waypoints: [{ lat: 58.9756, lon: 5.73 }, { lat: 59.0646, lon: 5.9167 }], speedKn: 5.6, crew: 'novice' });
  assert.equal(parseTrip({ ...TRIP, name: '  ' }).error, 'Name is required');
  assert.ok(parseTrip({ ...TRIP, waypoints: [TRIP.waypoints[0]] }).error);
  assert.ok(parseTrip({ ...TRIP, waypoints: [{ lat: 95, lon: 5 }, { lat: 59, lon: 5 }] }).error);
  assert.ok(parseTrip({ ...TRIP, speedKn: 40 }).error);
  assert.equal(parseTrip({ ...TRIP, crew: 'pirates' }).crew, 'mixed');
});

test('owner can create, list, rename and delete a trip', async () => {
  trips = [];
  let res = await call('POST', '/boats/b1/trips', { body: TRIP });
  assert.equal(res.status, 201);
  const created = await res.json();
  assert.equal(created.speed_kn, 5.6);
  assert.equal(created.crew, 'novice');

  res = await call('GET', '/boats/b1/trips');
  assert.deepEqual((await res.json()).map(t => t.name), ['Stavanger → Tau']);

  res = await call('PUT', `/boats/b1/trips/${created.id}`, { body: { ...TRIP, name: 'Hjem' } });
  assert.equal((await res.json()).name, 'Hjem');

  res = await call('DELETE', `/boats/b1/trips/${created.id}`);
  assert.equal(res.status, 204);
  res = await call('DELETE', `/boats/b1/trips/${created.id}`);
  assert.equal(res.status, 404);
});

test('others cannot see or touch the trips', async () => {
  trips = [];
  assert.equal((await call('GET', '/boats/b1/trips', { user: null })).status, 401);
  assert.equal((await call('GET', '/boats/b1/trips', { user: 'u2' })).status, 403);
  assert.equal((await call('POST', '/boats/b1/trips', { user: 'u2', body: TRIP })).status, 403);
  assert.equal((await call('GET', '/boats/nope/trips')).status, 404);
  assert.equal((await call('POST', '/boats/b1/trips', { body: { ...TRIP, speedKn: 0 } })).status, 400);
});

test('a boat holds at most 50 trips', async () => {
  trips = Array.from({ length: 50 }, (_, i) => ({ id: String(i), boat_id: 'b1', updated_at: new Date() }));
  const res = await call('POST', '/boats/b1/trips', { body: TRIP });
  assert.equal(res.status, 409);
  assert.equal((await res.json()).code, 'TOO_MANY');
});
