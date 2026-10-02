// How taps and searches change the route. The first point is the start
// ("Fra"), the last the destination ("Til"), anything between is a via point.
// Pure functions over [{ lat, lon, name? }] so the rules are easy to test.

const rad = d => d * Math.PI / 180;
function nm(a, b) {
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * 3440.065 * Math.asin(Math.sqrt(h));
}

// A via point goes into the leg where it adds the least distance, so a tap
// beside the route bends that leg instead of extending the passage.
export function insertVia(wps, p) {
  if (wps.length < 2) return [...wps, p];
  let best = 1, bestCost = Infinity;
  for (let i = 0; i < wps.length - 1; i++) {
    const cost = nm(wps[i], p) + nm(p, wps[i + 1]) - nm(wps[i], wps[i + 1]);
    if (cost < bestCost) { bestCost = cost; best = i + 1; }
  }
  return [...wps.slice(0, best), p, ...wps.slice(best)];
}

// A tap on the chart: start first, then destination, then via points.
export function addPoint(wps, p) {
  return wps.length < 2 ? [...wps, p] : insertVia(wps, p);
}

export function setStart(wps, p) {
  return wps.length ? [p, ...wps.slice(1)] : [p];
}

export function setEnd(wps, p) {
  if (!wps.length) return [p];
  if (wps.length === 1) return [...wps, p];
  return [...wps.slice(0, -1), p];
}

export function swapEnds(wps) {
  return [...wps].reverse();
}

export function removeAt(wps, i) {
  return wps.filter((_, k) => k !== i);
}

// 'start' | 'via' | 'end' for point i (a lone point is the start).
export function roleOf(i, count) {
  if (i === 0) return 'start';
  return i === count - 1 ? 'end' : 'via';
}
