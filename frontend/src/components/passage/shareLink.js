import { BOAT_PRESETS, CUSTOM_ID } from './boatPresets';

// A shared trip lives in the landing page's query string, so anyone can open
// it without an account:
//   /?r=59.0123,5.6789;59.1,5.8&t=2026-10-03T06:00:00.000Z&s=5.5&b=bavaria32
// A boat that isn't a preset carries its hull data instead of `b`:
//   …&b=custom&loa=10.4&disp=5200&hull=monohull&keel=long&n=Poor%20Sophie

const HULLS = ['monohull', 'catamaran', 'trimaran'];
const KEELS = ['fin', 'long', 'bilge', 'lifting', 'centerboard'];
const MAX_WAYPOINTS = 12;

const r4 = x => Math.round(x * 1e4) / 1e4; // ≈ 10 m, plenty for a route

// Preset id for a boat whose hull data matches one exactly, else null.
function presetFor(boat) {
  if (boat.presetId && boat.presetId !== CUSTOM_ID && BOAT_PRESETS.some(p => p.id === boat.presetId)) return boat.presetId;
  const p = BOAT_PRESETS.find(b => Number(b.loa_m) === Number(boat.loa_m) && Number(b.displacement_kg) === Number(boat.displacement_kg)
    && b.hull_type === boat.hull_type && b.keel_type === boat.keel_type);
  return p?.id ?? null;
}

/**
 * @param {{waypoints:{lat:number,lon:number}[], departure:string|Date, speed:number|string, boat:object}} trip
 * @param {string} [origin] defaults to the current site
 */
export function buildShareUrl({ waypoints, departure, speed, boat }, origin = window.location.origin) {
  const q = new URLSearchParams();
  q.set('r', waypoints.map(w => `${r4(w.lat)},${r4(w.lon)}`).join(';'));
  q.set('t', new Date(departure).toISOString());
  q.set('s', String(Number(speed)));
  const preset = boat && presetFor(boat);
  if (preset) {
    q.set('b', preset);
  } else if (boat) {
    q.set('b', CUSTOM_ID);
    if (boat.loa_m) q.set('loa', String(Number(boat.loa_m)));
    if (boat.displacement_kg) q.set('disp', String(Number(boat.displacement_kg)));
    if (boat.hull_type) q.set('hull', boat.hull_type);
    if (boat.keel_type) q.set('keel', boat.keel_type);
    if (boat.name) q.set('n', String(boat.name).slice(0, 60));
  }
  // Commas and semicolons are safe in a query and keep the route readable.
  return `${origin}/?${q.toString().replace(/%2C/g, ',').replace(/%3B/g, ';').replace(/%3A/g, ':')}`;
}

/**
 * Reads a shared trip from a query string. Returns null when there is none or
 * it doesn't hold a usable route; bad optional parts fall back to defaults.
 * @returns {null|{waypoints, departure:Date|null, speed:number|null, boat:object|null}}
 */
export function parseShareParams(search) {
  const q = new URLSearchParams(search);
  const r = q.get('r');
  if (!r) return null;
  const waypoints = r.split(';').slice(0, MAX_WAYPOINTS).map(p => {
    const [lat, lon] = p.split(',').map(Number);
    return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon } : null;
  });
  if (waypoints.length < 2 || waypoints.some(w => !w)) return null;

  const t = q.get('t') ? new Date(q.get('t')) : null;
  const departure = t && !Number.isNaN(t.getTime()) ? t : null;
  const s = Number(q.get('s'));
  const speed = s >= 1 && s <= 30 ? s : null;

  let boat = null;
  const b = q.get('b');
  const preset = BOAT_PRESETS.find(p => p.id === b);
  if (preset) {
    boat = { presetId: preset.id, name: preset.name, loa_m: preset.loa_m, displacement_kg: preset.displacement_kg, hull_type: preset.hull_type, keel_type: preset.keel_type };
  } else if (b === CUSTOM_ID) {
    const loa = Number(q.get('loa')), disp = Number(q.get('disp'));
    boat = {
      presetId: CUSTOM_ID,
      name: q.get('n')?.slice(0, 60) || null,
      loa_m: loa >= 3 && loa <= 60 ? loa : null,
      displacement_kg: disp >= 200 && disp <= 200000 ? disp : null,
      hull_type: HULLS.includes(q.get('hull')) ? q.get('hull') : 'monohull',
      keel_type: KEELS.includes(q.get('keel')) ? q.get('keel') : 'fin',
    };
  }
  return { waypoints, departure, speed, boat };
}
