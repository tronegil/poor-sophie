// The name in the display face with a small chart-magenta dot: a light on the chart.
export default function Wordmark({ children = 'Poor Sophie', className = '' }) {
  return (
    <span className={`inline-flex items-baseline gap-1.5 font-display font-bold tracking-tight ${className}`}>
      {children}
      <i className="block w-2 h-2 rounded-full bg-magenta" aria-hidden="true" />
    </span>
  );
}
