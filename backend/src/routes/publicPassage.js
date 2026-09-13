const router = require('express').Router();
const { parseScoreRequest, scorePassage } = require('./passage');

// Public, unauthenticated scoring for the landing page. Hull data comes in
// the request body (from the boat-type picker); anything invalid falls back
// to defaults inside normalizeBoat. Rate limited per IP since every call
// costs a handful of upstream MET requests.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 30;
const hits = new Map(); // ip -> [timestamps]

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return (typeof fwd === 'string' ? fwd.split(',')[0].trim() : null) || req.ip || 'unknown';
}

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) { hits.set(ip, recent); return true; }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) { // keep the map bounded on long-lived instances
    for (const [k, v] of hits) if (!v.some(t => now - t < WINDOW_MS)) hits.delete(k);
  }
  return false;
}

router.post('/score', async (req, res) => {
  if (rateLimited(clientIp(req))) return res.status(429).json({ error: 'Too many requests — try again in a few minutes', code: 'RATE_LIMITED' });
  const input = parseScoreRequest(req.body);
  if (input.error) return res.status(400).json({ error: input.error });
  const b = req.body.boat || {};
  const boatRow = {
    name: typeof b.name === 'string' ? b.name.slice(0, 80) : null,
    loa_m: b.loa_m, displacement_kg: b.displacement_kg, hull_type: b.hull_type, keel_type: b.keel_type,
  };
  try {
    const { status, body } = await scorePassage(input, boatRow);
    res.status(status).json(body);
  } catch (err) {
    console.error('Public passage score failed:', err);
    res.status(500).json({ error: 'Scoring failed' });
  }
});

module.exports = router;
