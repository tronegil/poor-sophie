const router = require('express').Router();
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const HULL_TYPES = ['monohull', 'catamaran', 'trimaran'];
const KEEL_TYPES = ['fin', 'long', 'bilge', 'lifting', 'centerboard'];

// Optional hull fields for the passage motion model; invalid values become null.
function hullFields(body) {
  const num = (v, min, max) => (Number.isFinite(Number(v)) && Number(v) >= min && Number(v) <= max ? Number(v) : null);
  return {
    loa_m: num(body.loa_m, 3, 60),
    displacement_kg: body.displacement_kg == null || body.displacement_kg === '' ? null : Math.round(num(body.displacement_kg, 200, 200000) ?? NaN) || null,
    hull_type: HULL_TYPES.includes(body.hull_type) ? body.hull_type : null,
    keel_type: KEEL_TYPES.includes(body.keel_type) ? body.keel_type : null,
  };
}

router.get('/', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM boats WHERE user_id = $1 ORDER BY created_at ASC',
    [req.user.id]
  );
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM boats WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Boat not found' });

  const boat = rows[0];
  if (!boat.is_public) {
    const token = req.cookies?.token;
    if (!token) return res.status(403).json({ error: 'Private boat' });
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      if (user.id !== boat.user_id) return res.status(403).json({ error: 'Private boat' });
    } catch {
      return res.status(403).json({ error: 'Private boat' });
    }
  }

  res.json(boat);
});

router.post('/', authenticate, async (req, res) => {
  const { name, type, year, description, photo_url, is_public } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Boat name is required' });

  const h = hullFields(req.body);
  const { rows } = await pool.query(
    `INSERT INTO boats (user_id, name, type, year, description, photo_url, is_public, loa_m, displacement_kg, hull_type, keel_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [req.user.id, name.trim(), type || null, year || null, description || null, photo_url || null, is_public ?? false,
     h.loa_m, h.displacement_kg, h.hull_type, h.keel_type]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', authenticate, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM boats WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Boat not found' });
  if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { name, type, year, description, photo_url, is_public } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Boat name is required' });

  const h = hullFields(req.body);
  const { rows: updated } = await pool.query(
    `UPDATE boats
     SET name = $1, type = $2, year = $3, description = $4, photo_url = $5, is_public = $6,
         loa_m = $7, displacement_kg = $8, hull_type = $9, keel_type = $10, updated_at = NOW()
     WHERE id = $11 RETURNING *`,
    [name.trim(), type || null, year || null, description || null, photo_url || null, is_public ?? false,
     h.loa_m, h.displacement_kg, h.hull_type, h.keel_type, req.params.id]
  );
  res.json(updated[0]);
});

router.delete('/:id', authenticate, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM boats WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Boat not found' });
  if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  await pool.query('DELETE FROM boats WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
