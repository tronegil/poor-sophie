// Departure-window scoring, tested against a fake THREDDS server so it runs
// offline: `node --test` in backend/.
const test = require('node:test');
const assert = require('node:assert/strict');

process.env.DATABASE_URL ||= 'postgres://test@localhost/test'; // pool is created lazily, never queried here

const HOUR = 3600;
const T0 = Date.UTC(2026, 9, 3, 6) / 1000; // first model step
const NT = 60;                              // hourly steps in the fake model
const RLAT = [58, 58.5, 59, 59.5, 60];
const RLON = [5, 5.5, 6, 6.5, 7];

// Hs rises through the day: calm early, rough later. Column 0 is land.
const hsAt = n => 0.5 + n * 0.05;
const VARS = ['hs', 'tp', 'tmp', 'Hmax_N', 'thq', 'hs_sea', 'tp_sea', 'thq_sea', 'hs_swell', 'tp_swell', 'thq_swell', 'ff', 'dd', 'Current', 'Currentdir'];
function value(v, n, j) {
  if (j === 0) return -9999999;
  switch (v) {
    case 'hs': case 'hs_sea': return hsAt(n);
    case 'tp': case 'tp_sea': return 4 + n * 0.02;
    case 'hs_swell': return 0.1;
    case 'tp_swell': return 9;
    case 'ff': return 6;
    case 'Current': return 0.2;
    default: return 180; // directions, tmp, Hmax
  }
}

function fakeThredds(url) {
  if (url.endsWith('.das')) return 'grid_north_pole_longitude 180\n grid_north_pole_latitude 90\n';
  if (url.endsWith('.dds')) return `time = ${NT};\n`;
  const q = decodeURIComponent(url.split('?')[1]);
  if (q.startsWith('rlat,rlon')) {
    const times = Array.from({ length: NT }, (_, n) => T0 + n * HOUR);
    return `Dataset\nrlat[5]\n${RLAT.join(', ')}\n\nrlon[5]\n${RLON.join(', ')}\n\ntime[${NT}]\n${times.join(', ')}\n`;
  }
  // hs.hs[a:1:b][i0:1:i1][j0:1:j1],...
  let out = 'Dataset\n';
  for (const part of q.split(',')) {
    const m = part.match(/^(\w+)\.\w+\[(\d+):1:(\d+)\]\[(\d+):1:(\d+)\]\[(\d+):1:(\d+)\]$/);
    const [, v, a, b, i0, i1, j0, j1] = m.map((x, k) => (k > 1 ? Number(x) : x));
    out += `\n${v}[${b - a + 1}][${i1 - i0 + 1}][${j1 - j0 + 1}]\n`;
    for (let n = a; n <= b; n++) for (let i = i0; i <= i1; i++) {
      const row = []; for (let j = j0; j <= j1; j++) row.push(value(v, n, j));
      out += `[${n - a}][${i - i0}], ${row.join(', ')}\n`;
    }
    out += '\n';
  }
  return out;
}

global.fetch = async url => ({ ok: true, status: 200, text: async () => fakeThredds(String(url)) });

const { getWaveSeries, getWavePoint } = require('../src/services/waves');
const { scoreWindow, scoreDepartures, buildSamples } = require('../src/routes/passage');
const { normalizeBoat } = require('../src/services/seasickness');

test('getWaveSeries returns one step per model hour from the nearest sea cell', async () => {
  const from = new Date((T0 + 10 * HOUR) * 1000), to = new Date((T0 + 20 * HOUR) * 1000);
  const series = await getWaveSeries(59, 5.1, from, to); // nearest column is land → falls back to column 1
  assert.ok(series.length >= 11);
  const at15 = series.find(w => w.validTime === new Date((T0 + 15 * HOUR) * 1000).toISOString());
  assert.equal(at15.hs, hsAt(15));
  assert.equal(at15.source, 'met-mywavewam800');
});

test('getWavePoint still reads a single time', async () => {
  const w = await getWavePoint(59, 6, new Date((T0 + 5 * HOUR) * 1000));
  assert.equal(w.hs, hsAt(5));
});

test('scoreDepartures prefers the calm early departure and drops uncovered ones', () => {
  const start = new Date((T0 + 2 * HOUR) * 1000);
  const { samples } = buildSamples([{ lat: 59, lon: 6 }, { lat: 59.3, lon: 6.4 }], start, 5);
  const series = samples.map(() => Array.from({ length: 30 }, (_, n) => ({
    validTime: new Date((T0 + n * HOUR) * 1000).toISOString(),
    hs: hsAt(n) * 2, tp: 4, waveFrom: 0, sea: { hs: hsAt(n) * 2, tp: 4, from: 0 }, swell: { hs: 0, tp: null, from: null }, windSpeed: 6, currentSpeed: 0,
  })));
  const deps = scoreDepartures(samples, series, normalizeBoat({}), 5, start, 48, 3);
  assert.equal(deps.length, 17);
  const scored = deps.filter(d => d.score != null);
  assert.ok(scored.length > 3 && scored.length < 17, 'series ends, so late departures have no data');
  assert.ok(scored[0].score < scored[scored.length - 1].score, 'rougher later');
  assert.equal(deps[deps.length - 1].score, null);
});

test('scoreWindow end to end against the fake model', async () => {
  const start = new Date((T0 + 1 * HOUR) * 1000);
  const { status, body } = await scoreWindow(
    { waypoints: [{ lat: 59, lon: 6 }, { lat: 59.4, lon: 6.5 }], speed: 5.5 },
    { loa_m: 10, displacement_kg: 5000, hull_type: 'monohull', keel_type: 'fin' },
    { start, hours: 24, stepH: 3 },
  );
  assert.equal(status, 200);
  assert.equal(body.departures.length, 9);
  assert.equal(body.best, start.toISOString()); // calmest is the first
  assert.ok(body.departures.every(d => d.score != null && d.band));
});
