export const BAND_COLORS = {
  flat: '#22c55e',
  comfortable: '#84cc16',
  uncomfortable: '#f59e0b',
  bucket: '#f97316',
  ashore: '#dc2626',
};

export function bandColor(band) {
  return BAND_COLORS[band] ?? '#94a3b8';
}

export function bandFor(score) {
  if (score == null) return null;
  if (score < 2) return 'flat';
  if (score < 4) return 'comfortable';
  if (score < 6) return 'uncomfortable';
  if (score < 8) return 'bucket';
  return 'ashore';
}
