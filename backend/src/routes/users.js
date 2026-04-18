const router = require('express').Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.put('/language', authenticate, async (req, res) => {
  const { language } = req.body;
  if (!['en', 'no'].includes(language)) return res.status(400).json({ error: 'Invalid language' });

  await pool.query('UPDATE users SET language = $1 WHERE id = $2', [language, req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
