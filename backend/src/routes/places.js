const router = require('express').Router();

// Place-name search for the passage map, backed by Kartverket's open place
// name register (Sentralt stedsnavnregister via ws.geonorge.no). Public; the
// browser never talks to Geonorge directly, so we can cache and rate limit.
const GEONORGE = 'https://ws.geonorge.no/stedsnavn/v1/sted';
const UA = 'poor-sophie/1.0 github.com/tronegil/poor-sophie';
const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE = 2000;
const cache = new Map(); // normalised query -> { at, places }

const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 40; // typing fires a request per pause; this is generous
const hits = new Map();

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return (typeof fwd === 'string' ? fwd.split(',')[0].trim() : null) || req.ip || 'unknown';
}

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < WINDOW_MS)) hits.delete(k);
  return recent.length > MAX_PER_WINDOW;
}

/**
 * Turns a Geonorge response into [{ name, type, municipality, lat, lon }].
 * Tolerates both the /sted shape (names under `stedsnavn[]`) and the older
 * flat /navn shape (`skrivemåte` on the hit itself).
 */
function parsePlaces(json) {
  const hits = Array.isArray(json?.navn) ? json.navn : [];
  const seen = new Set();
  const out = [];
  for (const h of hits) {
    const names = Array.isArray(h.stedsnavn) ? h.stedsnavn : [];
    const main = names.find(n => n?.navnestatus === 'hovednavn') ?? names[0];
    const name = main?.skrivemåte ?? h.skrivemåte;
    const p = h.representasjonspunkt ?? {};
    const lat = Number(p.nord), lon = Number(p['øst'] ?? p.ost);
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    const municipality = h.kommuner?.[0]?.kommunenavn ?? h.kommunenavn ?? null;
    const key = `${name}|${municipality}|${lat.toFixed(3)}|${lon.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, type: h.navneobjekttype ?? null, municipality, lat, lon });
  }
  return out;
}

async function searchPlaces(q) {
  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.places;
  const url = `${GEONORGE}?sok=${encodeURIComponent(q)}&fuzzy=true&utkoordsys=4258&treffPerSide=8&side=1`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Geonorge ${res.status}`);
  const places = parsePlaces(await res.json());
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
  cache.set(key, { at: Date.now(), places });
  return places;
}

router.get('/', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 60) : '';
  if (q.length < 2) return res.json([]);
  if (rateLimited(clientIp(req))) return res.status(429).json({ error: 'Too many searches', code: 'RATE_LIMITED' });
  try {
    res.json(await searchPlaces(q));
  } catch (err) {
    console.error('Place search failed:', err.message);
    res.status(502).json({ error: 'Place search is unavailable', code: 'UPSTREAM' });
  }
});

module.exports = router;
module.exports.parsePlaces = parsePlaces;
module.exports.searchPlaces = searchPlaces;
