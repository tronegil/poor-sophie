// Placeholder for a boat without a photo: a small sea-chart cut-out
// (shallow water, land, a magenta buoy) instead of an emoji.
export default function ChartTile({ seed = '', className = '' }) {
  // Vary the coastline a little per boat so cards don't look identical.
  const n = [...String(seed)].reduce((a, c) => a + c.charCodeAt(0), 0);
  const y = 96 + (n % 40);
  const flip = n % 2 === 0;
  return (
    <svg className={className} viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="320" height="180" className="fill-shallow" />
      <path d={`M0 ${y} Q80 ${y - 26} 160 ${y - 2} T320 ${y - 8} V180 H0Z`} className="fill-land" transform={flip ? 'translate(320 0) scale(-1 1)' : undefined} />
      <path d={`M0 ${y - 30} Q90 ${y - 52} 170 ${y - 30} T320 ${y - 36}`} fill="none" strokeWidth="1.5" className="stroke-ocean-200" />
      <circle cx={flip ? 72 : 252} cy="52" r="9" className="fill-magenta" />
    </svg>
  );
}
