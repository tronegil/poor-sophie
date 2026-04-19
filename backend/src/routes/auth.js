const router = require('express').Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, name: req.user.name },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.cookie('token', token, COOKIE_OPTS);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

router.get('/me', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, email, name, avatar_url, language FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token', { ...COOKIE_OPTS, maxAge: 0 });
  res.json({ ok: true });
});

module.exports = router;
