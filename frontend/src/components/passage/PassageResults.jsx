import { useTranslation } from 'react-i18next';
import { bandColor, bandFor, bandInk } from './bands';

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
      {/* Headline score: the number in ink, the colour lives in the badge */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 bg-surface rounded-lg border border-line p-5 flex items-center gap-6">
          <p className="font-display font-extrabold text-ink text-6xl sm:text-7xl leading-[0.9] tracking-tight tabular-nums shrink-0">
            {result.total.score.toFixed(1)}<span className="font-mono font-medium text-lg text-ink-muted tracking-normal ml-0.5">/10</span>
          </p>
          <div className="min-w-0 space-y-2">
            <p className="label-mono">{t('passage.total')}</p>
            <BandBadge band={result.total.band} score={result.total.score} label={t(`passage.band.${result.total.band}`)} />
            <p className="data text-sm text-ink-muted">{t('passage.duration', { hours: result.totalHours, nm: result.totalNm })}</p>
            <p className="data text-xs text-ink-muted">{t('passage.msi', { pct: result.total.msiPercent })}</p>
          </div>
        </div>
        <div className="bg-surface rounded-lg border border-line p-5">
          <p className="label-mono">{t('passage.peak')}</p>
          <div className="mt-2">
            <BandBadge band={bandFor(result.total.peak)} score={result.total.peak} label={t(`passage.band.${bandFor(result.total.peak)}`)} />
          </div>
          {result.tideStation && samples[0]?.tide && (
            <p className="data text-xs text-ink-muted mt-3">
              {t('passage.tide', { station: result.tideStation })}: {t(`passage.tideTrend.${samples[0].tide.trend}`)}, ±{Math.round(samples[0].tide.rangeCm / 2)} cm
            </p>
          )}
        </div>
      </div>

      {/* Factors */}
      {result.factors?.length > 0 && (
        <div className="bg-surface rounded-lg border border-line p-5">
          <h2 className="label-mono mb-3">{t('passage.factors')}</h2>
          <ol className="space-y-2">
            {result.factors.map((f, i) => (
              <li key={f.key} className="flex gap-3 text-sm text-slate-700">
                <span className="data w-5 h-5 rounded-full bg-shallow text-ink text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                {factorText(f)}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Timeline + table */}
      <div className="bg-surface rounded-lg border border-line p-5">
        <h2 className="label-mono mb-3">{t('passage.timeline')}</h2>
        <div className="flex items-end gap-[3px] h-16 border-b border-line">
          {samples.map((s, i) => (
            <div
              key={i}
              className="rounded-t-[3px] min-h-[4px]"
              style={{ flex: s.durationH, height: `${Math.max(6, s.score * 10)}%`, background: bandColor(s.band) }}
              title={`${fmtTime(s.time)} · ${s.score.toFixed(1)}`}
            />
          ))}
        </div>
        <div className="data flex justify-between text-xs text-ink-muted mt-1">
          <span>{fmtTime(result.departure)}</span>
          <span>{fmtTime(new Date(new Date(result.departure).getTime() + result.totalHours * 3600e3).toISOString())}</span>
        </div>

        <div className="overflow-x-auto mt-4 -mx-2">
          <table className="min-w-full text-sm data">
            <thead>
              <tr className="label-mono text-left">
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
                <tr key={i} className="border-t border-line">
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
                    <span className="inline-block min-w-[2.75rem] text-center text-xs font-semibold rounded px-2 py-0.5" style={{ background: bandColor(s.band), color: bandInk(s.band) }}>{s.score.toFixed(1)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {estimated && <p className="text-xs text-band-bucket mt-3">{t('passage.estimatedPeriod')}</p>}
        <p className="text-xs text-slate-400 mt-2">{t('passage.sources')}</p>
      </div>
    </>
  );
}

// Score pill: number and band name together, never colour alone.
function BandBadge({ band, score, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-sm font-semibold" style={{ background: bandColor(band), color: bandInk(band) }}>
      <b className="data text-[13px] rounded-full px-2 py-1 bg-white/35">{score.toFixed(1)}</b>
      {label}
    </span>
  );
}
