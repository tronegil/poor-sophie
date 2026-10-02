const router = require('express').Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const push = require('../services/push');

// The browser needs the VAPID public key to subscribe. 503 = alerts are not
// set up on this server, which the UI explains instead of offering the bell.
router.get('/public-key', (_req, res) => {
  const key = push.publicKey();
  if (!key) return res.status(503).json({ error: 'Push is not configured', code: 'NOT_CONFIGURED' });
  res.json({ key });
});

function parseSubscription(body) {
  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh, auth = body?.keys?.auth;
  if (typeof endpoint !== 'string' || !/^https:\/\//.test(endpoint) || endpoint.length > 1000) return null;
  if (typeof p256dh !== 'string' || typeof auth !== 'string' || p256dh.length > 200 || auth.length > 100) return null;
  return { endpoint, p256dh, auth };
}

// One row per device; re-subscribing the same device moves it to this user.
router.post('/subscriptions', authenticate, async (req, res) => {
  const sub = parseSubscription(req.body);
  if (!sub) return res.status(400).json({ error: 'Invalid subscription' });
  await pool.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
    [req.user.id, sub.endpoint, sub.p256dh, sub.auth]
  );
  res.status(201).json({ ok: true });
});

router.delete('/subscriptions', authenticate, async (req, res) => {
  const endpoint = req.body?.endpoint;
  if (typeof endpoint !== 'string') return res.status(400).json({ error: 'endpoint required' });
  await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2', [endpoint, req.user.id]);
  res.status(204).end();
});

module.exports = router;
module.exports.parseSubscription = parseSubscription;
