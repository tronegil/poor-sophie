const router = require('express').Router({ mergeParams: true });
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

// Saved passages for one boat. Owner only; nothing here is public.
const MAX_TRIPS_PER_BOAT = 50;
const MAX_WAYPOINTS = 12;
const CREWS = ['seasoned', 'mixed', 'novice'];
const COLUMNS = 'id, name, waypoints, speed_kn, crew, created_at, updated_at';

/**
 * Validates a trip body. Returns { error } or the clean fields.
 * Coordinates are rounded to ~10 m; that is all a route needs.
 */
function parseTrip(body) {
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 80) : '';
  if (!name) return { error: 'Name is required' };
  const wps = body.waypoints;
  if (!Array.isArray(wps) || wps.length < 2 || wps.length > MAX_WAYPOINTS) return { error: `2–${MAX_WAYPOINTS} waypoints are required` };
  const waypoints = [];
  for (const w of wps) {
    const lat = Number(w?.lat), lon = Number(w?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return { error: 'Invalid waypoint' };
    waypoints.push({ lat: Math.round(lat * 1e4) / 1e4, lon: Math.round(lon * 1e4) / 1e4 });
  }
  const speed = Number(body.speedKn);
  if (!(speed >= 1 && speed <= 30)) return { error: 'Speed must be 1–30 knots' };
  const crew = CREWS.includes(body.crew) ? body.crew : 'mixed';
  return { name, waypoints, speedKn: Math.round(speed * 10) / 10, crew };
}

const toJson = row => ({ ...row, speed_kn: Number(row.speed_kn) });

async function requireBoatOwner(req, res) {
  const { rows } = await pool.query('SELECT id, user_id FROM boats WHERE id = $1', [req.params.boatId]);
  if (!rows.length) { res.status(404).json({ error: 'Boat not found' }); return false; }
  if (rows[0].user_id !== req.user.id) { res.status(403).json({ error: 'Forbidden' }); return false; }
  return true;
}

router.get('/', authenticate, async (req, res) => {
  if (!(await requireBoatOwner(req, res))) return;
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM trips WHERE boat_id = $1 ORDER BY updated_at DESC`, [req.params.boatId]);
  res.json(rows.map(toJson));
});

router.post('/', authenticate, async (req, res) => {
  if (!(await requireBoatOwner(req, res))) return;
  const t = parseTrip(req.body);
  if (t.error) return res.status(400).json({ error: t.error });
  const { rows: [{ n }] } = await pool.query('SELECT COUNT(*)::int AS n FROM trips WHERE boat_id = $1', [req.params.boatId]);
  if (n >= MAX_TRIPS_PER_BOAT) return res.status(409).json({ error: `Max ${MAX_TRIPS_PER_BOAT} saved passages per boat`, code: 'TOO_MANY' });
  const { rows } = await pool.query(
    `INSERT INTO trips (boat_id, user_id, name, waypoints, speed_kn, crew) VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLUMNS}`,
    [req.params.boatId, req.user.id, t.name, JSON.stringify(t.waypoints), t.speedKn, t.crew]
  );
  res.status(201).json(toJson(rows[0]));
});

router.put('/:tripId', authenticate, async (req, res) => {
  if (!(await requireBoatOwner(req, res))) return;
  const t = parseTrip(req.body);
  if (t.error) return res.status(400).json({ error: t.error });
  const { rows } = await pool.query(
    `UPDATE trips SET name = $1, waypoints = $2, speed_kn = $3, crew = $4, updated_at = NOW()
     WHERE id = $5 AND boat_id = $6 RETURNING ${COLUMNS}`,
    [t.name, JSON.stringify(t.waypoints), t.speedKn, t.crew, req.params.tripId, req.params.boatId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Trip not found' });
  res.json(toJson(rows[0]));
});

router.delete('/:tripId', authenticate, async (req, res) => {
  if (!(await requireBoatOwner(req, res))) return;
  const { rowCount } = await pool.query('DELETE FROM trips WHERE id = $1 AND boat_id = $2', [req.params.tripId, req.params.boatId]);
  if (!rowCount) return res.status(404).json({ error: 'Trip not found' });
  res.status(204).end();
});

module.exports = router;
module.exports.parseTrip = parseTrip;
