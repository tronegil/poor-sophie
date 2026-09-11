// Seasickness model — pure functions, no I/O.
//
// Grounded in ISO 2631-1: motion sickness is driven by frequency-weighted
// vertical acceleration in the 0.1–0.3 Hz band, accumulated over exposure
// time (MSDV = a_w · √T). What the crew feels is therefore not wave height
// alone but the *encounter* frequency (wave period shifted by boat speed and
// heading), how much the hull follows the surface (length vs wavelength),
// how it rolls (keel type), and for how long.
//
// Everything below is an engineering approximation calibrated for small
// cruising yachts, not a seakeeping simulation. Coefficients are named so
// they can be tuned in one place.

const G = 9.81;
const KN_TO_MS = 0.514444;

const C = {
  msPeakHz: 0.17,          // ISO 2631-1 W_f peak
  msWidth: 0.75,           // log-frequency width of the weighting bell
  raoLengthFactor: 1.5,    // heave attenuation when hull length approaches wavelength
  rollGain: 0.5,           // roll contribution to felt vertical acceleration at the rail
  steepnessOnset: 0.03,    // Hs/λ above which seas feel "short and steep"
  steepnessGain: 6,
  crossSeaAngle: 60,       // deg between wind sea and swell to count as cross sea
  crossSeaGain: 0.15,
  windAgainstCurrentGain: 0.15,
  headSeaFactor: 1.15,     // pitch adds to heave when bow-on
  followingSeaFactor: 0.85,
  instantScale: 0.5,       // m/s² rms at which instantaneous score reaches ~6.3
  totalScale: 50,          // MSDV at which total score reaches ~6.3
  isoKm: 1 / 3,            // ISO 2631-1: MSI% ≈ Km · MSDV
};

const KEEL_ROLL = { long: 0.7, bilge: 0.85, fin: 1.0, lifting: 1.1, centerboard: 1.1 };
const HULL_ROLL = { monohull: 1.0, catamaran: 0.4, trimaran: 0.45 };
const HULL_HEAVE = { monohull: 1.0, catamaran: 1.1, trimaran: 1.1 };

const DEFAULT_BOAT = { loa_m: 9, displacement_kg: 3500, hull_type: 'monohull', keel_type: 'fin' };

function angleDiff(a, b) {
  const d = Math.abs(((a - b) % 360 + 540) % 360 - 180);
  return d; // 0..180
}

// ISO 2631-1 W_f approximated by a log-normal bell around 0.17 Hz.
function msWeight(f) {
  if (!(f > 0)) return 0;
  const x = Math.log(f / C.msPeakHz);
  return Math.exp(-(x * x) / (2 * C.msWidth * C.msWidth));
}

// Displacement/length ratio (imperial, as sailors quote it) → response factor.
// Heavy boats have longer natural periods and more damping.
function displacementFactor(loaM, dispKg) {
  const lwlFt = (loaM * 0.9) / 0.3048;
  const dlr = (dispKg / 1016) / Math.pow(lwlFt / 100, 3);
  return Math.min(1.15, Math.max(0.85, 1 - (dlr - 220) / 1000));
}

// Relative heading: 180 = head sea, 90 = beam, 0 = following.
// Heading equal to the wave's "from" direction means sailing straight into it.
function relativeAngle(headingDeg, waveFromDeg) {
  return 180 - angleDiff(headingDeg, waveFromDeg);
}

function encounter(tp, speedMs, headingDeg, waveFromDeg) {
  const omega = 2 * Math.PI / tp;
  const k = omega * omega / G;
  const rel = relativeAngle(headingDeg, waveFromDeg); // 0 following … 180 head
  // μ = angle between heading and wave travel direction equals rel:
  // head sea μ=180 → cos=-1 → ω_e = ω + kU; following → ω − kU.
  const cosMu = Math.cos(rel * Math.PI / 180);
  const omegaE = Math.abs(omega - k * speedMs * cosMu);
  return { rel, omegaE, fE: omegaE / (2 * Math.PI), lambda: 2 * Math.PI / k };
}

function headingFactor(rel) {
  if (rel >= 135) return C.headSeaFactor;
  if (rel <= 45) return C.followingSeaFactor;
  return 1;
}

function seaState(rel) {
  if (rel >= 150) return 'head';
  if (rel >= 110) return 'bow';
  if (rel >= 70) return 'beam';
  if (rel >= 30) return 'quartering';
  return 'following';
}

// Frequency-weighted rms vertical acceleration from one wave component.
function componentAccel(comp, boat, speedMs, headingDeg) {
  if (!comp || !(comp.hs > 0.05) || !(comp.tp > 0)) return null;
  const { rel, fE, omegaE, lambda } = encounter(comp.tp, speedMs, headingDeg, comp.from);
  const L = boat.loa_m;
  const rao = HULL_HEAVE[boat.hull_type] / (1 + Math.pow(C.raoLengthFactor * L / lambda, 2));
  const zetaRms = comp.hs / 4;
  const heave = rao * zetaRms * omegaE * omegaE * headingFactor(rel);
  const sinRel = Math.sin(rel * Math.PI / 180);
  const roll = C.rollGain * zetaRms * omegaE * omegaE * sinRel * sinRel
    * (KEEL_ROLL[boat.keel_type] ?? 1) * (HULL_ROLL[boat.hull_type] ?? 1);
  const steepness = comp.hs / lambda;
  const steepFactor = 1 + C.steepnessGain * Math.max(0, steepness - C.steepnessOnset);
  const w = msWeight(fE);
  const aw = Math.sqrt(heave * heave + roll * roll) * w * steepFactor * displacementFactor(boat.loa_m, boat.displacement_kg);
  return { aw, rel, fE, encounterPeriod: fE > 0 ? 1 / fE : null, steepness, state: seaState(rel), w, roll, heave };
}

function toScore(x, scale) {
  return Math.round(10 * (1 - Math.exp(-x / scale)) * 10) / 10;
}

function band(score) {
  if (score < 2) return 'flat';
  if (score < 4) return 'comfortable';
  if (score < 6) return 'uncomfortable';
  if (score < 8) return 'bucket';
  return 'ashore';
}

function normalizeBoat(boat = {}) {
  return {
    loa_m: Number(boat.loa_m) > 3 ? Number(boat.loa_m) : DEFAULT_BOAT.loa_m,
    displacement_kg: Number(boat.displacement_kg) > 200 ? Number(boat.displacement_kg) : DEFAULT_BOAT.displacement_kg,
    hull_type: HULL_HEAVE[boat.hull_type] ? boat.hull_type : DEFAULT_BOAT.hull_type,
    keel_type: KEEL_ROLL[boat.keel_type] ? boat.keel_type : DEFAULT_BOAT.keel_type,
  };
}

/**
 * Score a single sample point.
 * @param wave  output of waves.getWavePoint / met.getOceanFallback
 * @param boat  { loa_m, displacement_kg, hull_type, keel_type }
 * @param headingDeg  course over ground on this leg
 * @param speedKn     planned boat speed
 */
function scoreSample(wave, boat, headingDeg, speedKn) {
  const b = normalizeBoat(boat);
  const U = speedKn * KN_TO_MS;

  // Use the sea/swell split when the model provides it; otherwise the total.
  const useSplit = wave.sea?.hs > 0.05 && wave.sea?.tp > 0 && wave.swell?.hs > 0.05 && wave.swell?.tp > 0;
  const comps = useSplit
    ? [{ ...wave.sea, name: 'sea' }, { ...wave.swell, name: 'swell' }]
    : [{ hs: wave.hs, tp: wave.tp, from: wave.waveFrom, name: 'total' }];

  const parts = comps.map(c => ({ name: c.name, hs: c.hs, tp: c.tp, from: c.from, ...componentAccel(c, b, U, headingDeg) }))
    .filter(p => p.aw != null);

  let aw = Math.sqrt(parts.reduce((s, p) => s + p.aw * p.aw, 0));
  const factors = [];

  // Dominant component drives the narrative.
  const dom = parts.slice().sort((x, y) => y.aw - x.aw)[0];
  if (dom) {
    factors.push({ key: `sea_${dom.state}`, impact: dom.aw, params: { encounterPeriod: dom.encounterPeriod, hs: dom.hs, tp: dom.tp, component: dom.name } });
    if (dom.steepness > C.steepnessOnset) {
      factors.push({ key: 'steep_sea', impact: dom.aw * C.steepnessGain * (dom.steepness - C.steepnessOnset), params: { steepness: dom.steepness } });
    }
    if (dom.state === 'beam' && dom.roll > dom.heave * 0.6) {
      factors.push({ key: 'beam_rolling', impact: dom.roll * dom.w, params: { keel: b.keel_type } });
    }
  }

  // Cross sea: wind sea and swell from clearly different directions.
  if (useSplit) {
    const diff = angleDiff(wave.sea.from, wave.swell.from);
    if (diff >= C.crossSeaAngle && wave.swell.hs >= 0.3 && wave.sea.hs >= 0.3) {
      const gain = C.crossSeaGain * Math.min(1, wave.swell.hs / wave.sea.hs);
      aw *= 1 + gain;
      factors.push({ key: 'cross_sea', impact: aw * gain, params: { angle: Math.round(diff), seaFrom: wave.sea.from, swellFrom: wave.swell.from } });
    }
  }

  // Wind against current steepens the sea. The 800 m model already includes
  // wave–current interaction, so this is a modest extra plus an explanation.
  if (wave.currentSpeed >= 0.3 && wave.windFrom != null && wave.currentTo != null && wave.windSpeed >= 4) {
    const opposing = angleDiff(wave.windFrom, wave.currentTo) <= 60;
    if (opposing) {
      const gain = C.windAgainstCurrentGain * Math.min(1, wave.currentSpeed / 0.8);
      aw *= 1 + gain;
      factors.push({ key: 'wind_against_current', impact: aw * gain, params: { currentKn: wave.currentSpeed / KN_TO_MS, windMs: wave.windSpeed } });
    }
  }

  return {
    aw: Math.round(aw * 1000) / 1000,
    score: toScore(aw, C.instantScale),
    band: band(toScore(aw, C.instantScale)),
    dominant: dom ? { component: dom.name, state: dom.state, encounterPeriod: dom.encounterPeriod && Math.round(dom.encounterPeriod * 10) / 10, rel: Math.round(dom.rel) } : null,
    factors,
  };
}

/**
 * Accumulate samples (each with aw and durationH) into a passage total.
 * MSDV is additive in a²·T, so legs combine as a root-sum.
 */
function accumulate(samples) {
  const a2t = samples.reduce((s, x) => s + x.aw * x.aw * x.durationH * 3600, 0);
  const msdv = Math.sqrt(a2t);
  const hours = samples.reduce((s, x) => s + x.durationH, 0);
  const score = toScore(msdv, C.totalScale);
  return {
    msdv: Math.round(msdv * 10) / 10,
    msiPercent: Math.round(Math.min(100, C.isoKm * msdv)),
    score,
    band: band(score),
    hours: Math.round(hours * 10) / 10,
    peak: Math.max(0, ...samples.map(s => s.score)),
  };
}

// Merge per-sample factor lists into a ranked top-N for the whole passage.
function topFactors(samples, n = 3) {
  const agg = new Map();
  for (const s of samples) {
    for (const f of s.factors) {
      const cur = agg.get(f.key);
      const weighted = f.impact * s.durationH;
      if (!cur || weighted > cur.weighted) agg.set(f.key, { key: f.key, params: f.params, weighted, impact: (cur?.impact ?? 0) + weighted });
      else cur.impact += weighted;
    }
  }
  const totalHours = samples.reduce((s, x) => s + x.durationH, 0) || 1;
  if (totalHours >= 4) agg.set('long_exposure', { key: 'long_exposure', params: { hours: Math.round(totalHours * 10) / 10 }, impact: 0.1 * totalHours });
  return [...agg.values()].sort((a, b) => b.impact - a.impact).slice(0, n).map(({ key, params }) => ({ key, params }));
}

module.exports = { scoreSample, accumulate, topFactors, normalizeBoat, band, C, DEFAULT_BOAT };
