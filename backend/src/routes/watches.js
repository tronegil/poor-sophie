const router = require('express').Router();
const crypto = require('node:crypto');
const pool = require('../config/db');
const { scoreWindow } = require('./passage');
const { sendTo } = require('../services/push');
const { runWatches } = require('../services/watches');

// Called on a schedule (GitHub Actions, or Vercel Cron which sends GET with
// `Authorization: Bearer $CRON_SECRET`). Never public: no secret, no run.
function authorized(req) {
  const secret = process.env.WATCH_CRON_SECRET || process.env.CRON_SECRET;
  if (!secret) return null;
  const given = String(req.headers.authorization || '').replace(/^Bearer /, '');
  const a = Buffer.from(given), b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function run(req, res) {
  const ok = authorized(req);
  if (ok === null) return res.status(503).json({ error: 'Watch runner is not configured' });
  if (!ok) return res.status(401).json({ error: 'Unauthorized' });
  try {
    res.json(await runWatches({ pool, scoreWindow, sendTo }));
  } catch (err) {
    console.error('Watch run failed:', err);
    res.status(500).json({ error: 'Watch run failed' });
  }
}

router.post('/run', run);
router.get('/run', run);

module.exports = router;
