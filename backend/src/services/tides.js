// Kartverket tidal API (vannstand.kartverket.no). Returns hourly water level
// for the nearest station and derives tidal phase at any instant. Used for
// context (rising/falling, range) — tidal *current* direction is location
// specific and not derivable generically, so it is not scored directly.

const TTL_MS = 60 * 60 * 1000;
const cache = new Map();

function fmt(d) {
  // API wants local time without seconds; tzone=0 makes it UTC.
  return d.toISOString().slice(0, 16);
}

async function getWaterLevels(lat, lon, from, to) {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)},${fmt(from)},${fmt(to)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;

  const url = `https://vannstand.kartverket.no/tideapi.php?tide_request=locationdata&lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`
    + `&fromtime=${encodeURIComponent(fmt(from))}&totime=${encodeURIComponent(fmt(to))}`
    + `&datatype=all&refcode=cd&lang=nb&interval=10&tzone=0`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Kartverket ${res.status}`);
  const xml = await res.text();

  const station = xml.match(/<location name="([^"]*)"/)?.[1] ?? null;
  // Prefer forecast (includes weather surge), fall back to prediction.
  const pick = type => {
    const block = xml.split(`<data type="${type}"`)[1]?.split('</data>')[0];
    if (!block) return [];
    return [...block.matchAll(/<waterlevel value="([-\d.]+)" time="([^"]+)"/g)]
      .map(m => ({ t: new Date(m[2]).getTime(), cm: Number(m[1]) }));
  };
  let series = pick('forecast');
  if (series.length < 3) series = pick('prediction');

  const data = { station, series };
  cache.set(key, { data, at: Date.now() });
  return data;
}

// Phase at an instant: level, trend and hours to the next turn of the tide.
function phaseAt(series, date) {
  if (!series.length) return null;
  const t = date.getTime();
  let k = series.findIndex(p => p.t >= t);
  if (k <= 0) k = 1;
  if (k >= series.length) k = series.length - 1;
  const slope = series[k].cm - series[k - 1].cm;
  const trend = Math.abs(slope) < 0.3 ? 'slack' : slope > 0 ? 'rising' : 'falling';

  let turnAt = null;
  for (let m = k; m < series.length - 1; m++) {
    const s2 = series[m + 1].cm - series[m].cm;
    if (Math.sign(s2) !== Math.sign(slope) && s2 !== 0) { turnAt = series[m].t; break; }
  }
  const levels = series.map(p => p.cm);
  return {
    levelCm: series[k].cm,
    trend,
    hoursToTurn: turnAt ? Math.round((turnAt - t) / 36e4) / 10 : null,
    rangeCm: Math.round(Math.max(...levels) - Math.min(...levels)),
  };
}

module.exports = { getWaterLevels, phaseAt };
