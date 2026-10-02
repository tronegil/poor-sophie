// Depth contours, the way a sea chart draws water. Decorative background for
// deep-navy surfaces (landing hero, login).
export default function Isobaths({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 1200 600" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
      {[120, 220, 320, 420, 520, 620].map((r, i) => (
        <path
          key={r}
          d={`M1200 ${600 - r * 1.15} A ${r * 1.6} ${r * 1.15} 0 0 0 ${1200 - r * 1.6} 600`}
          fill="none"
          strokeWidth={i === 0 ? 2 : 1.5}
          className="stroke-deep-on"
          strokeOpacity={0.22 - i * 0.025}
        />
      ))}
    </svg>
  );
}
