// MET Norway wave models, read point-wise over OPeNDAP from thredds.met.no.
//
// Datasets are tried in order:
//   1. MyWaveWAM 800 m coastal domains (*_curr_be — includes wave–current
//      interaction and surface current). Covers the Norwegian coastal strip.
//   2. WAVEWATCH III 4 km (ww3_4km_agg) — whole Nordic seas incl. Skagerrak,
//      North Sea, Baltic approaches. No current field.
// The older mywavewam800{s,m,n}_be datasets stopped updating in October 2025
// but still answer requests — never use those.
//
// Grid metadata is cached in memory; each sample point is one OPeNDAP request
// (~0.5 s). MET asks that OPeNDAP access is not heavily parallelised.

const THREDDS = 'https://thredds.met.no/thredds/dodsC';
const FILL = -9999999;
const META_TTL_MS = 60 * 60 * 1000;

// Canonical field -> dataset variable. `dir` says whether direction fields are
// "to" (oceanographic) or "from" (meteorological) in that dataset.
const WAM_VARS = {
  hs: 'hs', tp: 'tp', tm: 'tmp', hmax: 'Hmax_N', waveDir: 'thq',
  seaHs: 'hs_sea', seaTp: 'tp_sea', seaDir: 'thq_sea',
  swellHs: 'hs_swell', swellTp: 'tp_swell', swellDir: 'thq_swell',
  windSpeed: 'ff', windDir: 'dd', currentSpeed: 'Current', currentDir: 'Currentdir',
};
const WW3_VARS = {
  hs: 'hs', tp: 'tp', tm: 't01', hmax: 'hmaxe', waveDir: 'dir',
  seaHs: 'phs0', seaTp: 'ptp0', seaDir: 'pdir0',
  swellHs: 'phs1', swellTp: 'ptp1', swellDir: 'pdir1',
  windSpeed: 'ff', windDir: 'dd',
};

const DATASETS = [
  ...['s', 'v', 'm', 'n', 'f'].map(d => ({
    id: 'met-mywavewam800', path: `fou-hi/mywavewam800${d}_curr_be`, vars: WAM_VARS, waveDir: 'to', windDir: 'to', currentDir: 'to',
  })),
  { id: 'met-ww3-4km', path: 'ww3_4km_agg', vars: WW3_VARS, waveDir: 'from', windDir: 'from' },
];

const metaCache = new Map(); // path -> { rlat, rlon, time, pole, fetchedAt }

function encodeConstraint(q) {
  return q.replace(/\[/g, '%5B').replace(/\]/g, '%5D');
}

async function fetchText(url, timeoutMs = 20000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`THREDDS ${res.status} for ${url}`);
  return res.text();
}

function parseArray(text, name) {
  const m = text.match(new RegExp(`(?:^|\\n)${name}\\[\\d+\\]\\n([^\\n]+)`));
  if (!m) throw new Error(`Axis ${name} missing in OPeNDAP response`);
  return m[1].split(',').map(Number);
}

async function getMeta(ds) {
  const cached = metaCache.get(ds.path);
  if (cached && Date.now() - cached.fetchedAt < META_TTL_MS) return cached;

  const das = await fetchText(`${THREDDS}/${ds.path}.das`);
  const plon = Number(das.match(/grid_north_pole_longitude ([\d.-]+)/)?.[1] ?? 140);
  const plat = Number(das.match(/grid_north_pole_latitude ([\d.-]+)/)?.[1] ?? 22);

  const text = await fetchText(`${THREDDS}/${ds.path}.ascii?rlat,rlon,time`, 40000);
  const meta = {
    rlat: parseArray(text, 'rlat'),
    rlon: parseArray(text, 'rlon'),
    time: parseArray(text, 'time'), // seconds since epoch, not contiguous
    pole: { plon, plat },
    fetchedAt: Date.now(),
  };
  metaCache.set(ds.path, meta);
  return meta;
}

// Geographic lat/lon -> CF rotated_latitude_longitude coordinates.
function toRotated(lat, lon, { plon, plat }) {
  const la = lat * Math.PI / 180, lo = lon * Math.PI / 180;
  const th = (90 - plat) * Math.PI / 180;
  const ph = (plon + 180) * Math.PI / 180;
  const x = Math.cos(la) * Math.cos(lo - ph);
  const y = Math.cos(la) * Math.sin(lo - ph);
  const z = Math.sin(la);
  const rlat = Math.asin(-Math.sin(th) * x + Math.cos(th) * z);
  const rlon = Math.atan2(y, Math.cos(th) * x + Math.sin(th) * z);
  return { rlat: rlat * 180 / Math.PI, rlon: rlon * 180 / Math.PI };
}

function nearestIndex(axis, value) {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < axis.length; i++) {
    const d = Math.abs(axis[i] - value);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

function inside(axis, value) {
  const step = Math.abs(axis[1] - axis[0]);
  const lo = Math.min(axis[0], axis[axis.length - 1]) - step;
  const hi = Math.max(axis[0], axis[axis.length - 1]) + step;
  return value >= lo && value <= hi;
}

// Parses "name[1][5][5]\n[0][0], v, v, ...\n[0][1], ..." into a flat array.
function parseSlab(text, name) {
  const start = text.indexOf(`\n${name}[`);
  if (start < 0) return null;
  const block = text.slice(start + 1).split('\n\n')[0];
  const values = [];
  for (const line of block.split('\n').slice(1)) {
    const m = line.match(/^\[\d+\]\[\d+\], (.+)$/);
    if (m) values.push(...m[1].split(',').map(Number));
  }
  return values;
}

const valid = v => v != null && v !== FILL && Number.isFinite(v);

async function readDataset(ds, lat, lon, date) {
  const meta = await getMeta(ds);
  const r = toRotated(lat, lon, meta.pole);
  if (!inside(meta.rlat, r.rlat) || !inside(meta.rlon, r.rlon)) return null;

  const t = date.getTime() / 1000;
  const ti = nearestIndex(meta.time, t);
  if (Math.abs(meta.time[ti] - t) > 3 * 3600) return null; // outside horizon

  // 5×5 neighbourhood so positions a few hundred metres inshore still resolve.
  const i = nearestIndex(meta.rlat, r.rlat);
  const j = nearestIndex(meta.rlon, r.rlon);
  const R = 2;
  const i0 = Math.max(0, i - R), i1 = Math.min(meta.rlat.length - 1, i + R);
  const j0 = Math.max(0, j - R), j1 = Math.min(meta.rlon.length - 1, j + R);
  const names = [...new Set(Object.values(ds.vars))];
  const constraint = names.map(v => `${v}.${v}[${ti}:1:${ti}][${i0}:1:${i1}][${j0}:1:${j1}]`).join(',');
  const text = await fetchText(`${THREDDS}/${ds.path}.ascii?${encodeConstraint(constraint)}`);

  const nj = j1 - j0 + 1, ni = i1 - i0 + 1;
  const slabs = {};
  for (const v of names) slabs[v] = parseSlab(text, v);
  const hsSlab = slabs[ds.vars.hs];
  if (!hsSlab) throw new Error(`Unexpected OPeNDAP response shape from ${ds.path}`);

  let bestK = -1, bestD = Infinity;
  for (let k = 0; k < ni * nj; k++) {
    if (!valid(hsSlab[k])) continue;
    const di = Math.floor(k / nj) + i0 - i, dj = (k % nj) + j0 - j;
    const d = di * di + dj * dj;
    if (d < bestD) { bestD = d; bestK = k; }
  }
  if (bestK < 0) return null; // all land

  const get = f => { const v = ds.vars[f]; const x = v && slabs[v] ? slabs[v][bestK] : null; return valid(x) ? x : null; };
  const from = (f, conv) => { const d = get(f); return d == null ? null : conv === 'to' ? (d + 180) % 360 : d; };
  const to = (f, conv) => { const d = get(f); return d == null ? null : conv === 'from' ? (d + 180) % 360 : d; };

  return {
    source: ds.id,
    dataset: ds.path,
    validTime: new Date(meta.time[ti] * 1000).toISOString(),
    hs: get('hs'),
    tp: get('tp'),
    tm: get('tm'),
    hmax: get('hmax'),
    waveFrom: from('waveDir', ds.waveDir),
    sea:   { hs: get('seaHs'),   tp: get('seaTp'),   from: from('seaDir', ds.waveDir) },
    swell: { hs: get('swellHs'), tp: get('swellTp'), from: from('swellDir', ds.waveDir) },
    windSpeed: get('windSpeed'),
    windFrom: from('windDir', ds.windDir),
    currentSpeed: get('currentSpeed'),
    currentTo: ds.vars.currentDir ? to('currentDir', ds.currentDir) : null,
  };
}

// Warm all grid metadata at once (six small requests) instead of paying for
// each dataset lazily during the first passage after a cold start.
let warmPromise = null;
function warmMeta() {
  if (!warmPromise) {
    warmPromise = Promise.allSettled(DATASETS.map(getMeta)).then(() => { warmPromise = null; });
  }
  return warmPromise;
}

/**
 * Wave conditions at a position and time from the best available MET model.
 * @returns {Promise<null|object>} null when no model covers the point/time.
 */
async function getWavePoint(lat, lon, date) {
  for (const ds of DATASETS) {
    try {
      const hit = await readDataset(ds, lat, lon, date);
      if (hit && hit.hs != null && hit.tp != null) return hit;
    } catch (err) {
      console.error(`Wave read failed (${ds.path}):`, err.message);
    }
  }
  return null;
}

module.exports = { getWavePoint, warmMeta, toRotated };
