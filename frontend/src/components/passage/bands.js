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
