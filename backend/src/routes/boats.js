const router = require('express').Router();
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

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

  const { rows } = await pool.query(
    `INSERT INTO boats (user_id, name, type, year, description, photo_url, is_public)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [req.user.id, name.trim(), type || null, year || null, description || null, photo_url || null, is_public ?? false]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', authenticate, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM boats WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Boat not found' });
  if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { name, type, year, description, photo_url, is_public } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Boat name is required' });

  const { rows: updated } = await pool.query(
    `UPDATE boats
     SET name = $1, type = $2, year = $3, description = $4, photo_url = $5, is_public = $6, updated_at = NOW()
     WHERE id = $7 RETURNING *`,
    [name.trim(), type || null, year || null, description || null, photo_url || null, is_public ?? false, req.params.id]
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
