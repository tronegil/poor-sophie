import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import PassageMap from './PassageMap';
import PassageResults from './PassageResults';
import DepartureStrip from './DepartureStrip';
import ShareTrip from './ShareTrip';
import SaveTrip from './SaveTrip';
import RouteStops from './RouteStops';
import { addPoint, insertVia, setStart, setEnd, swapEnds, removeAt } from './routeEdit';
import { DEFAULT_CREW, isCrew } from './crew';
import { RefreshCw, TriangleAlert, WifiOff } from 'lucide-react';
import useOnline from '../../hooks/useOnline';
import { useFormat } from '../../i18n/format';

// Value for <input type="datetime-local">, in local time.
function toLocalInput(date) {
  const d = new Date(date);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nextFullHour() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return toLocalInput(d);
}

const MAX_WAYPOINTS = 12;

// Great-circle distance in nautical miles (same formula as the backend).
function routeNm(wps) {
  const rad = d => d * Math.PI / 180;
  let nm = 0;
  for (let i = 1; i < wps.length; i++) {
    const a = wps[i - 1], b = wps[i];
    const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
    nm += 2 * 3440.065 * Math.asin(Math.sqrt(h));
  }
  return nm;
}

export const inputClass = 'border border-line rounded px-3 py-2 text-sm text-ink bg-surface hover:border-ink-muted focus:outline-none focus:ring-2 focus:ring-magenta focus:border-transparent';

/**
 * Map + controls + results. Owns the route/departure/speed state and persists
 * it per `storageKey`. The caller decides how scoring happens (`score`) and
 * can slot extra controls (e.g. a boat picker) via `extraControls`.
 *
 * @param {(payload:{waypoints,departure,speedKn}) => Promise<object>} score
 * @param {(payload:{waypoints,departure,speedKn}) => Promise<object>} [scoreWindow]
 *   optional: scores every departure in the next 48 h for the "best departure" strip
 * @param {string} [windowKey] changes when something outside the planner (the boat) changes the score
 * @param {object} [shareBoat] hull data for the share link (omit to hide the share button)
 * @param {{waypoints, departure?:Date, speed?:number, crew?:string}} [initial] a trip to open and score right away
 * @param {(trip:{name, id, waypoints, speedKn, crew}) => Promise} [onSaveTrip] shows "Save passage" (owners only)
 * @param {{id, name}} [loadedTrip] the saved passage currently open, so saving can update it
 */
export default function PassagePlanner({ storageKey, score, scoreWindow, windowKey = '', shareBoat, initial, onSaveTrip, loadedTrip, extraControls = null, onResult, mapHeight, mapScrollZoom = true }) {
  const { t, i18n } = useTranslation();
  const { num } = useFormat();
  const saved = useMemo(() => { try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { return {}; } }, [storageKey]);

  const [waypoints, setWaypoints] = useState(initial?.waypoints ?? saved.waypoints ?? []);
  const [departure, setDeparture] = useState(() => (initial?.departure ? toLocalInput(initial.departure) : nextFullHour()));
  const [speed, setSpeed] = useState(initial?.speed ?? saved.speed ?? 5.5);
  // The last scored result for this route, kept so a returning visitor (or
  // one at sea without a network) sees it straight away, marked as old.
  const lastKey = `${storageKey}:last`;
  const restored = useMemo(() => {
    if (initial?.waypoints) return null;
    try {
      const last = JSON.parse(localStorage.getItem(lastKey));
      const fresh = last && Date.now() - last.at < 7 * 24 * 3600e3;
      return fresh && last.route === JSON.stringify(saved.waypoints ?? []) ? last : null;
    } catch { return null; }
  }, [lastKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [result, setResult] = useState(restored?.result ?? null);
  const [resultAt, setResultAt] = useState(restored?.at ?? null);
  const online = useOnline();
  const [crew, setCrew] = useState(initial?.crew ?? (isCrew(saved.crew) ? saved.crew : DEFAULT_CREW));
  const [stale, setStale] = useState(restored ? 'saved' : null); // null | 'edited' | 'saved'
  const [focus, setFocus] = useState(null);       // last searched place, for the map to fly to      // inputs changed since `result` was scored
  const [lastPayload, setLastPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [win, setWin] = useState(null);           // { key, data } for the departure strip
  const [winLoading, setWinLoading] = useState(false);
  const [winError, setWinError] = useState('');
  const resultsRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify({ waypoints, speed, crew })); } catch { /* ignore */ }
  }, [waypoints, speed, crew, storageKey]);

  // Editing keeps the last result on screen, dimmed, until the next Beregn.
  const reset = () => { if (result) setStale('edited'); setError(''); };
  // Route edits. A tap on the chart fills Fra, then Til, then adds a via
  // point where it bends the route least (routeEdit.js has the rules).
  // Every edit is undoable, one step at a time.
  const history = useRef([]);
  const edit = fn => { history.current = [...history.current.slice(-30), waypoints]; setWaypoints(fn); reset(); };
  const roomForOne = waypoints.length < MAX_WAYPOINTS;
  const addWaypoint = wp => { if (roomForOne || waypoints.length < 2) edit(w => addPoint(w, wp)); };
  // A dragged point keeps its spot but loses the place name it no longer matches.
  const moveWaypoint = (i, wp) => edit(w => w.map((p, k) => (k === i ? wp : p)));
  const removeWaypoint = i => edit(w => removeAt(w, i));
  const fromPlace = place => ({ lat: place.lat, lon: place.lon, name: place.name });
  // After a search, show the whole route once it has both ends, else fly to the place.
  const searchEdit = (place, fn) => {
    const next = fn(waypoints);
    setFocus({ lat: place.lat, lon: place.lon, bounds: next.length >= 2 ? next.map(w => [w.lat, w.lon]) : null, seq: Date.now() });
    edit(() => next);
  };
  const pickStart = place => searchEdit(place, w => setStart(w, fromPlace(place)));
  const pickEnd = place => searchEdit(place, w => setEnd(w, fromPlace(place)));
  const pickVia = place => { if (roomForOne) searchEdit(place, w => insertVia(w, fromPlace(place))); };
  const replaceAt = (i, place) => searchEdit(place, w => w.map((p, k) => (k === i ? fromPlace(place) : p)));
  const swap = () => edit(swapEnds);
  const undo = () => { const prev = history.current.pop(); if (prev) { setWaypoints(prev); reset(); } };
  const clear = () => { history.current = [...history.current, waypoints]; setWaypoints([]); setResult(null); setStale(null); setError(''); };

  const nm = routeNm(waypoints);
  const minutes = Number(speed) > 0 ? Math.round(nm / Number(speed) * 60) : 0;
  const routeSummary = waypoints.length < 2
    ? `${waypoints.length} ${t('passage.waypoints')}`
    : t('passage.draw.summary', { n: waypoints.length, nm: num(nm), h: Math.floor(minutes / 60), m: String(minutes % 60).padStart(2, '0') });

  // Route, speed and boat decide the window; the chosen departure doesn't.
  const routeKey = JSON.stringify([waypoints, Number(speed), windowKey]);
  const errorText = err => {
    const code = err.response?.data?.code;
    if (code === 'NO_DATA') return t('passage.noData');
    if (code === 'RATE_LIMITED' || err.response?.status === 429) return t('passage.rateLimited');
    if (!err.response) return t('passage.offline');
    if (err.response.status === 400 && err.response.data?.error) return t('passage.invalid', { reason: err.response.data.error });
    return t('passage.error');
  };
  const hoursAhead = (new Date(departure).getTime() - Date.now()) / 3600e3;
  const departureHint = hoursAhead > 66 ? t('passage.farAhead') : hoursAhead < -1 ? t('passage.inPast') : '';

  const loadWindow = async payload => {
    if (!scoreWindow || win?.key === routeKey) return;
    setWinLoading(true);
    setWinError('');
    try {
      setWin({ key: routeKey, data: await scoreWindow(payload) });
    } catch (err) {
      setWin(null);
      setWinError(err.response?.data?.code === 'NO_DATA' ? t('passage.window.none') : errorText(err));
    } finally {
      setWinLoading(false);
    }
  };

  const calculate = async (dep = departure) => {
    if (waypoints.length < 2) { setError(t('passage.needTwo')); return; }
    setLoading(true);
    setError('');
    const payload = { waypoints, departure: new Date(dep).toISOString(), speedKn: Number(speed) };
    setLastPayload(dep);
    try {
      const data = await score(payload);
      setResult(data);
      setStale(null);
      setResultAt(Date.now());
      try { localStorage.setItem(lastKey, JSON.stringify({ result: data, at: Date.now(), route: JSON.stringify(waypoints) })); } catch { /* full or blocked: fine */ }
      onResult?.(data);
      // Bring the result into view on small screens, where it lands below the fold.
      requestAnimationFrame(() => {
        const el = resultsRef.current;
        if (el && el.getBoundingClientRect().top > window.innerHeight * 0.8) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      loadWindow(payload);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  };

  const whenText = at => (at ? new Date(at).toLocaleString(i18n.language?.startsWith('en') ? 'en-GB' : 'nb-NO', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : '');

  const pickDeparture = iso => {
    const local = toLocalInput(iso);
    setDeparture(local);
    calculate(local);
  };

  // A shared link opens straight to its result.
  useEffect(() => {
    if (initial?.waypoints?.length >= 2) calculate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // The boat changing (outside the planner) also makes the result stale.
  const firstWindowKey = useRef(true);
  useEffect(() => {
    if (firstWindowKey.current) { firstWindowKey.current = false; return; }
    if (result) setStale('edited');
  }, [windowKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // A different route, speed or boat makes the old window wrong.
  useEffect(() => {
    if (win && win.key !== routeKey) { setWin(null); setWinError(''); }
  }, [routeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">
      <div className="bg-surface rounded-2xl border border-line shadow-panel p-3 space-y-3">
        <RouteStops
          waypoints={waypoints}
          maxWaypoints={MAX_WAYPOINTS}
          onSetStart={pickStart}
          onSetEnd={pickEnd}
          onAddVia={pickVia}
          onReplace={replaceAt}
          onRemove={removeWaypoint}
          onSwap={swap}
        />
        <PassageMap
          waypoints={waypoints}
          focus={focus}
          result={stale === 'edited' ? null : result}
          onAddWaypoint={addWaypoint}
          onMoveWaypoint={moveWaypoint}
          onRemoveWaypoint={removeWaypoint}
          maxWaypoints={MAX_WAYPOINTS}
          heightClass={mapHeight} scrollWheelZoom={mapScrollZoom} />

        <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
          {extraControls ? <div>{extraControls}</div> : <div />}
          <div>
            <label className="block label-mono mb-1.5">{t('passage.departure')}</label>
            <input type="datetime-local" value={departure} onChange={e => { setDeparture(e.target.value); reset(); }} className={inputClass} aria-describedby="departure-hint" />
            {departureHint && <p id="departure-hint" className="text-xs text-ink-muted mt-1 max-w-[16rem]">{departureHint}</p>}
          </div>
          <div>
            <label className="block label-mono mb-1.5">{t('passage.speed')}</label>
            <input type="number" step="0.5" min="1" max="30" value={speed} onChange={e => { setSpeed(e.target.value); reset(); }} className={`${inputClass} w-24`} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <p className="data text-xs text-ink-muted mr-auto">{routeSummary}</p>
          <button onClick={undo} disabled={!history.current.length} className="border border-line text-ink px-3 py-2 rounded-lg text-sm hover:bg-shallow hover:border-shallow transition-colors disabled:opacity-45 disabled:cursor-not-allowed">{t('passage.undo')}</button>
          {shareBoat && waypoints.length >= 2 && (
            <ShareTrip trip={{ waypoints, departure, speed, boat: shareBoat, crew }} />
          )}
          {onSaveTrip && waypoints.length >= 2 && (
            <SaveTrip loaded={loadedTrip} onSave={({ name, id }) => onSaveTrip({ name, id, waypoints, speedKn: Number(speed), crew })} />
          )}
          <button onClick={clear} disabled={!waypoints.length} className="border border-line text-ink px-3 py-2 rounded-lg text-sm hover:bg-shallow hover:border-shallow transition-colors disabled:opacity-45 disabled:cursor-not-allowed">{t('passage.clear')}</button>
          <button
            onClick={() => calculate()}
            disabled={loading || waypoints.length < 2}
            className="w-full sm:w-auto bg-deep text-deep-on px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-deep-hover disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('passage.calculating') : stale ? t('passage.recalculate') : t('passage.calculate')}
          </button>
        </div>
        {error && (
          <div role="alert" className="flex flex-wrap items-start gap-3 text-sm text-ink bg-band-ashore/10 border border-band-ashore/30 rounded px-4 py-3">
            <TriangleAlert size={18} strokeWidth={1.75} className="text-band-ashore shrink-0 mt-0.5" aria-hidden="true" />
            <p className="flex-1 min-w-[12rem]">{error}</p>
            {lastPayload && waypoints.length >= 2 && (
              <button type="button" onClick={() => calculate()} disabled={loading} className="inline-flex items-center gap-1.5 font-medium text-magenta hover:underline disabled:opacity-45">
                <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />{t('passage.retry')}
              </button>
            )}
          </div>
        )}
      </div>

      {!online && (
        <p role="status" className="flex items-center gap-2 text-sm bg-band-uncomfortable/15 border border-band-uncomfortable/50 text-ink rounded-lg px-4 py-2.5">
          <WifiOff size={16} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
          {result ? t('passage.offlineShowing') : t('passage.offlineNoResult')}
        </p>
      )}
      <div ref={resultsRef} className="space-y-5 scroll-mt-4">
        {(win || winLoading || winError) && (
          <DepartureStrip window={win?.data} loading={winLoading} error={winError} departure={departure} onPick={pickDeparture} />
        )}
        {stale && result && !loading && (
          <div className="flex flex-wrap items-center gap-3 text-sm bg-shallow text-ink rounded-lg px-4 py-3">
            <p className="flex-1 min-w-[12rem]">
              {stale === 'saved' ? t('passage.lastResult', { when: whenText(resultAt) }) : t('passage.staleNote')}
            </p>
            <button type="button" onClick={() => calculate()} className="bg-deep text-deep-on px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-deep-hover transition-colors">
              {t('passage.recalculate')}
            </button>
          </div>
        )}
        {loading && !result && <ResultSkeleton label={t('passage.reading', { n: waypoints.length })} />}
        {result && (
          <div className={`relative space-y-5 transition-opacity ${stale === 'edited' || loading ? 'opacity-45' : stale === 'saved' ? 'opacity-75' : ''}`} aria-busy={loading || undefined}>
            <PassageResults result={result} crew={crew} onCrewChange={setCrew} />
            {loading && <p className="absolute top-4 left-1/2 -translate-x-1/2 bg-surface border border-line rounded-full px-4 py-1.5 text-sm text-ink shadow-panel" role="status">{t('passage.calculating')}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// Placeholder in the shape of the result while the sea is being read, so the
// page doesn't jump and it's clear something is happening.
function ResultSkeleton({ label }) {
  return (
    <div className="space-y-4" aria-busy="true">
      <p className="text-sm text-ink-muted" role="status">{label}</p>
      <div className="grid sm:grid-cols-3 gap-4" aria-hidden="true">
        <div className="sm:col-span-2 h-32 rounded-lg bg-shallow animate-pulse" />
        <div className="h-32 rounded-lg bg-shallow animate-pulse" />
      </div>
      <div className="h-48 rounded-lg bg-shallow animate-pulse" aria-hidden="true" />
    </div>
  );
}
