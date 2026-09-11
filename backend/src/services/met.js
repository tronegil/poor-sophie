// MET Norway api.met.no clients — used as fallback when a position is outside
// the 800 m wave model (open sea, Danish/Swedish waters) and for tides context.
// Terms of use: identifying User-Agent, cache responses, ≤4 decimals in coords.

const UA = 'poor-sophie/1.0 github.com/tronegil/poor-sophie';
const TTL_MS = 30 * 60 * 1000;
const cache = new Map();

async function cachedJson(url) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`MET ${res.status} for ${url}`);
  const data = await res.json();
  cache.set(url, { data, at: Date.now() });
  return data;
}

function round(x) { return Math.round(x * 100) / 100; } // 0.01° ≈ 1 km, good cache hit rate

function nearestSeries(timeseries, date) {
  const t = date.getTime();
  let best = null, bestD = Infinity;
  for (const ts of timeseries) {
    const d = Math.abs(new Date(ts.time).getTime() - t);
    if (d < bestD) { bestD = d; best = ts; }
  }
  return bestD <= 3 * 3600 * 1000 ? best : null;
}

async function getWind(lat, lon, date) {
  const data = await cachedJson(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${round(lat)}&lon=${round(lon)}`);
  const ts = nearestSeries(data.properties.timeseries, date);
  if (!ts) return null;
  const d = ts.data.instant.details;
  return {
    windSpeed: d.wind_speed ?? null,
    windGust: d.wind_speed_of_gust ?? null,
    windFrom: d.wind_from_direction ?? null,
    airTemp: d.air_temperature ?? null,
  };
}

// Oceanforecast has no wave period, so Tp is estimated from Hs using the
// wind-sea rule of thumb Tp ≈ 4·√Hs. Marked in `source` so the UI can say so.
async function getOceanFallback(lat, lon, date) {
  const data = await cachedJson(`https://api.met.no/weatherapi/oceanforecast/2.0/complete?lat=${round(lat)}&lon=${round(lon)}`);
  const ts = nearestSeries(data.properties.timeseries, date);
  if (!ts) return null;
  const d = ts.data.instant.details;
  if (d.sea_surface_wave_height == null) return null;
  const hs = d.sea_surface_wave_height;
  const tp = Math.min(12, Math.max(3, 4 * Math.sqrt(hs)));
  const wind = await getWind(lat, lon, date).catch(() => null);
  return {
    source: 'met-oceanforecast-estimated-period',
    validTime: ts.time,
    hs,
    tp,
    tm: tp * 0.85,
    hmax: hs * 1.8,
    waveFrom: d.sea_surface_wave_from_direction ?? null,
    sea:   { hs, tp, from: d.sea_surface_wave_from_direction ?? null },
    swell: { hs: 0, tp: null, from: null },
    windSpeed: wind?.windSpeed ?? null,
    windFrom: wind?.windFrom ?? null,
    windGust: wind?.windGust ?? null,
    currentSpeed: d.sea_water_speed ?? null,
    currentTo: d.sea_water_to_direction ?? null,
  };
}

module.exports = { getWind, getOceanFallback };
