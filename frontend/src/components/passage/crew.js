// Who is on board changes how many get sick. ISO 2631-1 gives
// MSI % ≈ Km · MSDV with Km = 1/3 for a mixed, unadapted adult population;
// the other two are rough multipliers, not standard values: seasoned crews
// adapt (roughly half as many sick), children from about 2–12 and first-timers
// are more susceptible.
export const CREWS = [
  { id: 'seasoned', factor: 0.5 },
  { id: 'mixed', factor: 1 },
  { id: 'novice', factor: 1.5 },
];
export const DEFAULT_CREW = 'mixed';

export const isCrew = id => CREWS.some(c => c.id === id);

// Share of this crew expected to be seasick (vomiting) over the passage, in %.
export function crewPercent(total, crewId) {
  const factor = CREWS.find(c => c.id === crewId)?.factor ?? 1;
  const base = total.msdv != null ? total.msdv / 3 : total.msiPercent;
  return Math.round(Math.min(100, base * factor));
}

// Advice tier for that share: what to actually do about it.
export function adviceTier(pct) {
  if (pct < 5) return 'none';
  if (pct < 15) return 'horizon';
  if (pct < 35) return 'pills';
  if (pct < 60) return 'everyone';
  return 'rethink';
}
