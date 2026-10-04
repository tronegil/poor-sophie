// Band colours from design/tokens.json: darker as it gets worse, so they read
// in greyscale too. Always show the band name next to the colour.
export const BAND_COLORS = {
  flat: '#9fd8c8',
  comfortable: '#c9d96a',
  uncomfortable: '#f2b33d',
  bucket: '#c2410c',
  ashore: '#8f1d2c',
};

const DARK_BANDS = new Set(['bucket', 'ashore']);

export function bandColor(band) {
  return BAND_COLORS[band] ?? '#b3c3cc';
}

// Text colour that reads on a band fill.
export function bandInk(band) {
  return DARK_BANDS.has(band) ? '#ffffff' : '#0f2a3d';
}

export function bandFor(score) {
  if (score == null) return null;
  if (score < 2) return 'flat';
  if (score < 4) return 'comfortable';
  if (score < 6) return 'uncomfortable';
  if (score < 8) return 'bucket';
  return 'ashore';
}

// How far each band lists, in degrees (`rest`), and how hard it rolls when
// hovered on the front page (`roll` either way, once every `period` seconds).
// The worse the band, the further it heels: the scale on the landing page and
// the verdict above a result both use it.
export const BAND_HEEL = {
  flat: { rest: 0, roll: 0.4, period: 5 },
  comfortable: { rest: 1.4, roll: 1, period: 4.2 },
  uncomfortable: { rest: 3, roll: 1.8, period: 3.6 },
  bucket: { rest: 5, roll: 2.8, period: 3 },
  ashore: { rest: 8, roll: 4, period: 2.6 },
};
