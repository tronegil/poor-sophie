import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import PassageMap from './PassageMap';
import PassageResults from './PassageResults';

function nextFullHour() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const inputClass = 'border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent bg-white';

/**
 * Map + controls + results. Owns the route/departure/speed state and persists
 * it per `storageKey`. The caller decides how scoring happens (`score`) and
 * can slot extra controls (e.g. a boat picker) via `extraControls`.
 *
 * @param {(payload:{waypoints,departure,speedKn}) => Promise<object>} score
 */
export default function PassagePlanner({ storageKey, score, extraControls = null, onResult, mapHeight, mapScrollZoom = true }) {
  const { t } = useTranslation();
  const saved = useMemo(() => { try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { return {}; } }, [storageKey]);

  const [waypoints, setWaypoints] = useState(saved.waypoints ?? []);
  const [departure, setDeparture] = useState(nextFullHour);
  const [speed, setSpeed] = useState(saved.speed ?? 5.5);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify({ waypoints, speed })); } catch { /* ignore */ }
  }, [waypoints, speed, storageKey]);

  const reset = () => { setResult(null); setError(''); };
  const addWaypoint = wp => { if (waypoints.length >= 12) return; setWaypoints(w => [...w, wp]); reset(); };
  const undo = () => { setWaypoints(w => w.slice(0, -1)); reset(); };
  const clear = () => { setWaypoints([]); reset(); };

  const calculate = async () => {
    if (waypoints.length < 2) { setError(t('passage.needTwo')); return; }
    setLoading(true);
    setError('');
    try {
      const data = await score({ waypoints, departure: new Date(departure).toISOString(), speedKn: Number(speed) });
      setResult(data);
      onResult?.(data);
    } catch (err) {
      setResult(null);
      const code = err.response?.data?.code;
      setError(code === 'NO_DATA' ? t('passage.noData') : code === 'RATE_LIMITED' ? t('passage.rateLimited') : t('passage.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 space-y-3">
        <PassageMap waypoints={waypoints} result={result} onAddWaypoint={addWaypoint} heightClass={mapHeight} scrollWheelZoom={mapScrollZoom} />

        <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
          {extraControls ? <div>{extraControls}</div> : <div />}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t('passage.departure')}</label>
            <input type="datetime-local" value={departure} onChange={e => { setDeparture(e.target.value); setResult(null); }} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t('passage.speed')}</label>
            <input type="number" step="0.5" min="1" max="30" value={speed} onChange={e => { setSpeed(e.target.value); setResult(null); }} className={`${inputClass} w-24`} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-slate-400 mr-auto">{waypoints.length} {t('passage.waypoints')}</p>
          <button onClick={undo} disabled={!waypoints.length} className="border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-40">{t('passage.undo')}</button>
          <button onClick={clear} disabled={!waypoints.length} className="border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-40">{t('passage.clear')}</button>
          <button
            onClick={calculate}
            disabled={loading || waypoints.length < 2}
            className="w-full sm:w-auto bg-ocean-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-ocean-700 disabled:opacity-50 transition-colors"
          >
            {loading ? t('passage.calculating') : t('passage.calculate')}
          </button>
        </div>
        {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
      </div>

      {result && <PassageResults result={result} />}
    </div>
  );
}
