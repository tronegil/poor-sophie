const router = require('express').Router({ mergeParams: true });
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { getWavePoint, warmMeta } = require('../services/waves');
const { getOceanFallback } = require('../services/met');
const { getWaterLevels, phaseAt } = require('../services/tides');
const { scoreSample, accumulate, topFactors, normalizeBoat, band } = require('../services/seasickness');

const MAX_WAYPOINTS = 12;
const MAX_SAMPLES = 14;        // OPeNDAP reads are ~0.5 s each
const WAVE_CONCURRENCY = 2;    // MET asks for gentle OPeNDAP use
const SAMPLE_SPACING_NM = 5;
const EARTH_NM = 3440.065;

async function requireBoatOwner(req, res) {
  const { rows } = await pool.query(
    'SELECT id, user_id, name, type, year, loa_m, displacement_kg, hull_type, keel_type FROM boats WHERE id = $1',
    [req.params.boatId]
  );
  if (!rows.length) { res.status(404).json({ error: 'Boat not found' }); return null; }
  if (rows[0].user_id !== req.user.id) { res.status(403).json({ error: 'Forbidden' }); return null; }
  return rows[0];
}

const rad = d => d * Math.PI / 180;
const deg = r => r * 180 / Math.PI;

function distanceNm(a, b) {
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_NM * Math.asin(Math.sqrt(h));
}

function bearing(a, b) {
  const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

function interpolate(a, b, f) {
  return { lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f };
}

// Split the route into legs and legs into sample segments, each carrying the
// position/time of its midpoint and its duration. Total samples are capped so
// long routes get coarser sampling rather than slower responses.
function buildSamples(waypoints, departure, speedKn) {
  const legs = [];
  let totalNm = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const nm = distanceNm(waypoints[i], waypoints[i + 1]);
    legs.push({ index: i, from: waypoints[i], to: waypoints[i + 1], nm, bearing: bearing(waypoints[i], waypoints[i + 1]) });
    totalNm += nm;
  }
  const spacing = Math.max(SAMPLE_SPACING_NM, totalNm / MAX_SAMPLES);

  const samples = [];
  let elapsedH = 0;
  for (const leg of legs) {
    const n = Math.max(1, Math.round(leg.nm / spacing));
    const segNm = leg.nm / n;
    const segH = segNm / speedKn;
    for (let s = 0; s < n; s++) {
      const mid = interpolate(leg.from, leg.to, (s + 0.5) / n);
      samples.push({
        leg: leg.index,
        lat: mid.lat, lon: mid.lon,
        heading: leg.bearing,
        time: new Date(departure.getTime() + (elapsedH + segH / 2) * 3600e3),
        durationH: segH,
        nm: segNm,
      });
      elapsedH += segH;
    }
  }
  return { legs, samples, totalNm, totalH: elapsedH };
}

// Validates the shared request shape. Returns { error } or the parsed input.
function parseScoreRequest(body) {
  const { waypoints, departure, speedKn } = body || {};
  if (!Array.isArray(waypoints) || waypoints.length < 2) return { error: 'At least two waypoints are required' };
  if (waypoints.length > MAX_WAYPOINTS) return { error: `Max ${MAX_WAYPOINTS} waypoints` };
  if (!waypoints.every(w => Number.isFinite(w?.lat) && Number.isFinite(w?.lon) && Math.abs(w.lat) <= 90 && Math.abs(w.lon) <= 180)) return { error: 'Invalid waypoint' };
  const dep = new Date(departure);
  if (Number.isNaN(dep.getTime())) return { error: 'Invalid departure time' };
  const speed = Number(speedKn);
  if (!(speed >= 1 && speed <= 30)) return { error: 'Speed must be 1–30 knots' };
  return { waypoints: waypoints.map(w => ({ lat: Number(w.lat), lon: Number(w.lon) })), dep, speed };
}

/**
 * Score a passage. Shared by the per-boat route and the public endpoint.
 * @param {{waypoints:{lat:number,lon:number}[], dep:Date, speed:number}} input
 * @param {object} boatRow  hull fields (+ optional name); normalised here
 * @returns {Promise<{status:number, body:object}>}
 */
async function scorePassage(input, boatRow) {
  const { waypoints, dep, speed } = input;
  const boat = normalizeBoat(boatRow);
  const boatComplete = !!(boatRow.loa_m && boatRow.displacement_kg && boatRow.hull_type && boatRow.keel_type);
  const { legs, samples, totalNm, totalH } = buildSamples(waypoints, dep, speed);

  // Tides once, for the route midpoint, spanning the passage.
  const midSample = samples[Math.floor(samples.length / 2)];
  const tidePromise = getWaterLevels(midSample.lat, midSample.lon, new Date(dep.getTime() - 3600e3), new Date(dep.getTime() + (totalH + 2) * 3600e3))
    .catch(err => { console.error('Tide fetch failed:', err.message); return null; });

  await warmMeta();

  async function fetchWave(s) {
    let wave = null;
    try { wave = await getWavePoint(s.lat, s.lon, s.time); }
    catch (err) { console.error('Wave model read failed:', err.message); }
    if (!wave) {
      try { wave = await getOceanFallback(s.lat, s.lon, s.time); }
      catch (err) { console.error('Oceanforecast fallback failed:', err.message); }
    }
    return wave;
  }

  // Small worker pool: samples are fetched WAVE_CONCURRENCY at a time, in order.
  const waves = new Array(samples.length);
  let next = 0;
  await Promise.all(Array.from({ length: WAVE_CONCURRENCY }, async () => {
    while (next < samples.length) {
      const k = next++;
      waves[k] = await fetchWave(samples[k]);
    }
  }));

  const scored = samples.map((s, k) => {
    const wave = waves[k];
    if (!wave) return { ...s, time: s.time.toISOString(), wave: null, aw: 0, score: null, band: null, factors: [], dominant: null, noData: true };
    return { ...s, time: s.time.toISOString(), wave, ...scoreSample(wave, boat, s.heading, speed) };
  });

  const withData = scored.filter(s => !s.noData);
  if (!withData.length) return { status: 422, body: { error: 'No forecast data for this route/time', code: 'NO_DATA' } };

  const tide = await tidePromise;
  const tideAt = tide ? scored.map(s => phaseAt(tide.series, new Date(s.time))) : null;

  const perLeg = legs.map(leg => {
    const ss = withData.filter(s => s.leg === leg.index);
    const score = ss.length ? Math.round(ss.reduce((a, s) => a + s.score, 0) / ss.length * 10) / 10 : null;
    return { ...leg, nm: Math.round(leg.nm * 10) / 10, bearing: Math.round(leg.bearing), score, band: score == null ? null : band(score) };
  });

  return {
    status: 200,
    body: {
      boat: { ...boat, name: boatRow.name ?? null, complete: boatComplete },
      departure: dep.toISOString(),
      speedKn: speed,
      totalNm: Math.round(totalNm * 10) / 10,
      totalHours: Math.round(totalH * 10) / 10,
      total: accumulate(withData),
      factors: topFactors(withData),
      legs: perLeg,
      samples: scored.map((s, i) => ({ ...s, tide: tideAt?.[i] ?? null })),
      tideStation: tide?.station ?? null,
      sources: [...new Set(withData.map(s => s.wave.source))],
    },
  };
}

// Per-boat: hull data comes from the owner's boat profile.
router.post('/score', authenticate, async (req, res) => {
  const boatRow = await requireBoatOwner(req, res);
  if (!boatRow) return;
  const input = parseScoreRequest(req.body);
  if (input.error) return res.status(400).json({ error: input.error });
  const { status, body } = await scorePassage(input, boatRow);
  res.status(status).json(body);
});

module.exports = router;
module.exports.buildSamples = buildSamples;
module.exports.parseScoreRequest = parseScoreRequest;
module.exports.scorePassage = scorePassage;
