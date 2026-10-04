import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { bandColor, bandFor, bandInk, BAND_HEEL } from './bands';
import { CREWS, crewPercent, adviceTier } from './crew';
import { useFormat } from '../../i18n/format';
import ResultSection from './ResultSection';


// Arrow pointing the way the wind/wave is travelling: "from" north → points down.
function Dir({ from }) {
  if (from == null) return null;
  return <span className="inline-block text-slate-400" style={{ transform: `rotate(${from}deg)` }}>↓</span>;
}

// Everything below the map once a passage has been scored. Shared by the
// per-boat page and the public landing page. `departures` (the best-departure
// strip) is slotted in after the crew, where "when should we go?" comes up.
export default function PassageResults({ result, crew, onCrewChange, departures = null }) {
  const { t } = useTranslation();
  const { num, time: fmtTime } = useFormat();
  const [hours, setHours] = useState(false);
  const samples = result.samples.filter(s => !s.noData);
  const estimated = result.sources?.some(s => s.includes('estimated'));

  const factorText = f => {
    const p = f.params || {};
    return t(`passage.factor.${f.key}`, {
      te: p.encounterPeriod != null ? num(p.encounterPeriod, 1) : '?',
      hs: p.hs != null ? num(p.hs, 1) : '?',
      steepness: p.steepness != null ? num(p.steepness, 3) : '?',
      keel: p.keel ? t(`boat.keel.${p.keel}`).toLowerCase() : '',
      angle: p.angle ?? '?',
      currentKn: p.currentKn != null ? num(p.currentKn, 1) : '?',
      hours: p.hours ?? '?',
    });
  };

  return (
    <div>
      <Verdict result={result} samples={samples} />

      {crew && <CrewAdvice total={result.total} crew={crew} onCrewChange={onCrewChange} />}

      {departures}

      {result.factors?.length > 0 && (
        <ResultSection title={t('passage.factors')}>
          <ol className="space-y-2 max-w-prose text-ink">
            {result.factors.map(f => <li key={f.key}>{factorText(f)}</li>)}
          </ol>
        </ResultSection>
      )}

      <ResultSection title={t('passage.timeline')}>
        <div className="flex items-end gap-[3px] h-16 border-b border-line">
          {samples.map((s, i) => (
            <div
              key={i}
              className="rounded-t-[3px] min-h-[4px]"
              style={{ flex: s.durationH, height: `${Math.max(6, s.score * 10)}%`, background: bandColor(s.band) }}
              title={`${fmtTime(s.time)}: ${num(s.score)}`}
            />
          ))}
        </div>
        <div className="data flex justify-between text-sm text-ink-muted mt-1.5">
          <span>{fmtTime(result.departure)}</span>
          <span>{fmtTime(new Date(new Date(result.departure).getTime() + result.totalHours * 3600e3).toISOString())}</span>
        </div>

        <button
          type="button"
          onClick={() => setHours(h => !h)}
          aria-expanded={hours}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-magenta"
        >
          {hours ? t('passage.hideHours') : t('passage.showHours')}
          <ChevronDown size={16} strokeWidth={2} className={`transition-transform ${hours ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        {hours && (
          <div className="overflow-x-auto mt-3 -mx-2">
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
                      <Dir from={s.wave.waveFrom} /> {num(s.wave.hs)} m · {num(s.wave.tp, 0)} s
                      {s.wave.sea?.hs > 0.2 && s.wave.swell?.hs > 0.2 && s.wave.swell.hs < 0.9 * s.wave.hs && (
                        <span className="text-slate-400"> · {t('passage.swell')} {num(s.wave.swell.hs)} m/{num(s.wave.swell.tp, 0)} s</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-slate-700 whitespace-nowrap">
                      {s.wave.windSpeed != null ? <><Dir from={s.wave.windFrom} /> {num(s.wave.windSpeed, 0)} m/s</> : '—'}
                    </td>
                    <td className="px-2 py-1.5 text-slate-700 whitespace-nowrap">
                      {s.wave.currentSpeed != null ? `${num(s.wave.currentSpeed / 0.5144)} kn` : '—'}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <span className="inline-block min-w-[2.75rem] text-center text-xs font-semibold rounded px-2 py-0.5" style={{ background: bandColor(s.band), color: bandInk(s.band) }}>{num(s.score)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {estimated && <p className="text-sm text-band-bucket mt-4">{t('passage.estimatedPeriod')}</p>}
        <p className="text-sm text-ink-muted mt-3">{t('passage.sources')}</p>
      </ResultSection>
    </div>
  );
}

// The answer, set like one line of the front page's scale: the score and the
// band name on a waterline in the band's colour, heeled as far as that band
// lists. Then the band's one-liner, the worst moment and the tide.
function Verdict({ result, samples }) {
  const { t, i18n } = useTranslation();
  const { num, time } = useFormat();
  const band = result.total.band;
  const bands = t('landing.bands', { returnObjects: true });
  const says = Array.isArray(bands) ? bands.find(b => b.band === band)?.p : null;
  const worst = samples.reduce((m, s) => (m == null || s.score > m.score ? s : m), null);
  const peakBand = worst ? bandFor(worst.score) : null;
  const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'nb-NO';
  const day = new Date(result.departure).toLocaleDateString(locale, { weekday: 'short' });
  const end = new Date(new Date(result.departure).getTime() + result.totalHours * 3600e3).toISOString();
  const tide = result.tideStation && samples[0]?.tide;

  return (
    <section className="pt-6 sm:pt-8 pb-8 sm:pb-10">
      <p className="text-ink-muted">
        {t('passage.span', { from: `${day} ${time(result.departure)}`, to: time(end), nm: num(result.totalNm), hours: num(result.totalHours) })}
      </p>
      <p className="verdict" style={{ '--band': bandColor(band), '--heel': `${BAND_HEEL[band]?.rest ?? 0}deg` }}>
        <span className="sr-only">{t('passage.total')}: </span>
        <span className="verdict-score">{num(result.total.score)}</span>
        <span className="verdict-band">{t(`passage.band.${band}`)}</span>
      </p>
      {says && <p className="text-lg sm:text-xl text-ink max-w-[42ch]">{says}</p>}
      <p className="mt-3 text-ink-muted max-w-prose">
        {worst && peakBand && (
          <>
            <i className="inline-block w-2.5 h-2.5 rounded-sm mr-2 align-[0.05em]" style={{ background: bandColor(peakBand) }} aria-hidden="true" />
            {t('passage.worstAt', { time: time(worst.time), score: num(worst.score), band: t(`passage.band.${peakBand}`) })}
          </>
        )}
        {tide && <> {t('passage.tide', { station: result.tideStation })}: {t(`passage.tideTrend.${tide.trend}`)}, ±{Math.round(tide.rangeCm / 2)} cm.</>}
      </p>
    </section>
  );
}

// "Who's going to be sick, and what do we do about it?" — the share of this
// crew expected to be seasick, with one concrete piece of advice. Changing the
// crew needs no new forecast, so it updates instantly.
function CrewAdvice({ total, crew, onCrewChange }) {
  const { t } = useTranslation();
  const pct = crewPercent(total, crew);
  const tier = adviceTier(pct);
  return (
    <ResultSection title={t('passage.crew.title')}>
      <div role="radiogroup" aria-label={t('passage.crew.title')} className="inline-flex flex-wrap border border-line rounded-lg p-0.5 text-sm">
        {CREWS.map(c => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={crew === c.id}
            onClick={() => onCrewChange?.(c.id)}
            className={`px-2.5 py-1.5 rounded-md transition-colors ${crew === c.id ? 'bg-deep text-deep-on' : 'text-ink-muted hover:text-ink hover:bg-shallow'}`}
          >
            {t(`passage.crew.${c.id}`)}
          </button>
        ))}
      </div>
      <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display font-bold text-3xl sm:text-4xl text-ink leading-none">≈ {pct} %</span>
        <span className="text-ink">{t(`passage.crew.sick.${crew}`)}</span>
      </p>
      <p className="mt-3 text-ink max-w-prose">{t(`passage.crew.advice.${tier}`)}</p>
      <p className="mt-2 text-sm text-ink-muted">{t('passage.crew.basis')}</p>
    </ResultSection>
  );
}
