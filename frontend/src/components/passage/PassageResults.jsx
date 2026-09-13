import { useTranslation } from 'react-i18next';
import { bandColor, bandFor } from './bands';

const fmtTime = iso => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Arrow pointing the way the wind/wave is travelling: "from" north → points down.
function Dir({ from }) {
  if (from == null) return null;
  return <span className="inline-block text-slate-400" style={{ transform: `rotate(${from}deg)` }}>↓</span>;
}

// Everything below the map once a passage has been scored. Shared by the
// per-boat page and the public landing page.
export default function PassageResults({ result }) {
  const { t } = useTranslation();
  const samples = result.samples.filter(s => !s.noData);
  const estimated = result.sources?.some(s => s.includes('estimated'));

  const factorText = f => {
    const p = f.params || {};
    return t(`passage.factor.${f.key}`, {
      te: p.encounterPeriod != null ? p.encounterPeriod.toFixed(1) : '?',
      hs: p.hs != null ? p.hs.toFixed(1) : '?',
      steepness: p.steepness != null ? p.steepness.toFixed(3) : '?',
      keel: p.keel ? t(`boat.keel.${p.keel}`).toLowerCase() : '',
      angle: p.angle ?? '?',
      currentKn: p.currentKn != null ? p.currentKn.toFixed(1) : '?',
      hours: p.hours ?? '?',
    });
  };

  return (
    <>
      {/* Headline score */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-5">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-bold shrink-0 shadow-inner"
            style={{ background: bandColor(result.total.band) }}
          >
            {result.total.score.toFixed(1)}
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-slate-400">{t('passage.total')}</p>
            <p className="text-2xl font-bold text-slate-800">{t(`passage.band.${result.total.band}`)}</p>
            <p className="text-sm text-slate-500 mt-1">{t('passage.duration', { hours: result.totalHours, nm: result.totalNm })}</p>
            <p className="text-xs text-slate-400 mt-1">{t('passage.msi', { pct: result.total.msiPercent })}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">{t('passage.peak')}</p>
          <p className="text-3xl font-bold mt-1" style={{ color: bandColor(bandFor(result.total.peak)) }}>{result.total.peak.toFixed(1)}</p>
          {result.tideStation && samples[0]?.tide && (
            <p className="text-xs text-slate-400 mt-3">
              {t('passage.tide', { station: result.tideStation })}: {t(`passage.tideTrend.${samples[0].tide.trend}`)}, ±{Math.round(samples[0].tide.rangeCm / 2)} cm
            </p>
          )}
        </div>
      </div>

      {/* Factors */}
      {result.factors?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">{t('passage.factors')}</h2>
          <ol className="space-y-2">
            {result.factors.map((f, i) => (
              <li key={f.key} className="flex gap-3 text-sm text-slate-700">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                {factorText(f)}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Timeline + table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">{t('passage.timeline')}</h2>
        <div className="flex h-8 rounded-lg overflow-hidden">
          {samples.map((s, i) => (
            <div key={i} className="relative" style={{ flex: s.durationH, background: bandColor(s.band) }} title={`${fmtTime(s.time)} · ${s.score}`}>
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-white/90">{s.score.toFixed(0)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>{fmtTime(result.departure)}</span>
          <span>{fmtTime(new Date(new Date(result.departure).getTime() + result.totalHours * 3600e3).toISOString())}</span>
        </div>

        <div className="overflow-x-auto mt-4 -mx-2">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 text-left">
                <th className="px-2 py-1 font-medium">{t('passage.cols.time')}</th>
                <th className="px-2 py-1 font-medium">{t('passage.legs')}</th>
                <th className="px-2 py-1 font-medium">{t('passage.cols.wave')}</th>
                <th className="px-2 py-1 font-medium">{t('passage.cols.wind')}</th>
                <th className="px-2 py-1 font-medium">{t('passage.cols.current')}</th>
                <th className="px-2 py-1 font-medium text-right">{t('passage.cols.score')}</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((s, i) => (
                <tr key={i} className="border-t border-slate-50">
                  <td className="px-2 py-1.5 text-slate-600 whitespace-nowrap">{fmtTime(s.time)}</td>
                  <td className="px-2 py-1.5 text-slate-500">{s.leg + 1}</td>
                  <td className="px-2 py-1.5 text-slate-700 whitespace-nowrap">
                    <Dir from={s.wave.waveFrom} /> {s.wave.hs?.toFixed(1)} m · {s.wave.tp?.toFixed(0)} s
                    {s.wave.sea?.hs > 0.2 && s.wave.swell?.hs > 0.2 && s.wave.swell.hs < 0.9 * s.wave.hs && (
                      <span className="text-slate-400"> · {t('passage.swell')} {s.wave.swell.hs.toFixed(1)} m/{s.wave.swell.tp?.toFixed(0)} s</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-slate-700 whitespace-nowrap">
                    {s.wave.windSpeed != null ? <><Dir from={s.wave.windFrom} /> {s.wave.windSpeed.toFixed(0)} m/s</> : '—'}
                  </td>
                  <td className="px-2 py-1.5 text-slate-700 whitespace-nowrap">
                    {s.wave.currentSpeed != null ? `${(s.wave.currentSpeed / 0.5144).toFixed(1)} kn` : '—'}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <span className="inline-block min-w-[2.5rem] text-center text-white text-xs font-semibold rounded-full px-2 py-0.5" style={{ background: bandColor(s.band) }}>{s.score.toFixed(1)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {estimated && <p className="text-xs text-amber-600 mt-3">{t('passage.estimatedPeriod')}</p>}
        <p className="text-xs text-slate-400 mt-2">{t('passage.sources')}</p>
      </div>
    </>
  );
}
