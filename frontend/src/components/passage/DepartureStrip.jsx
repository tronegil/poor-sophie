import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { bandColor, bandInk } from './bands';
import { useFormat } from '../../i18n/format';
import ResultSection from './ResultSection';

const near = (a, b) => Math.abs(new Date(a).getTime() - new Date(b).getTime()) < 90 * 60e3;

// "When should we go?" — the same route scored for every departure in the next
// 48 h. One bar per departure (height = score, colour = band); tapping a bar
// picks that departure and rescores the passage.
export default function DepartureStrip({ window: win, loading, error, departure, onPick }) {
  const { t, i18n } = useTranslation();
  const { num, time } = useFormat();
  const locale = i18n.language?.startsWith('no') || i18n.language?.startsWith('nb') ? 'nb-NO' : 'en-GB';
  const day = iso => new Date(iso).toLocaleDateString(locale, { weekday: 'short' });

  if (loading) {
    return (
      <ResultSection title={t('passage.window.title')} aria-busy="true">
        <div className="flex items-end gap-1 h-24" aria-hidden="true">
          {Array.from({ length: 17 }, (_, i) => (
            <div key={i} className="flex-1 rounded-t bg-shallow animate-pulse" style={{ height: `${30 + ((i * 37) % 50)}%` }} />
          ))}
        </div>
        <p className="text-sm text-ink-muted mt-3">{t('passage.window.loading')}</p>
      </ResultSection>
    );
  }
  if (error) {
    return (
      <ResultSection title={t('passage.window.title')}>
        <p className="text-ink-muted">{error}</p>
      </ResultSection>
    );
  }
  if (!win) return null;

  const deps = win.departures;
  const best = deps.find(d => d.departure === win.best);
  const bestIsSelected = best && near(best.departure, departure);

  // One departure: a bar as tall as its score, in its band's colour.
  const Bar = ({ d, decimals, className }) => {
    const selected = near(d.departure, departure);
    const isBest = d.departure === win.best;
    const label = d.score == null
      ? `${day(d.departure)} ${time(d.departure)}: ${t('passage.window.noData')}`
      : `${day(d.departure)} ${time(d.departure)}: ${num(d.score)} ${t(`passage.band.${d.band}`)}`;
    return (
      <button
        type="button"
        role="listitem"
        disabled={d.score == null}
        onClick={() => onPick(d.departure)}
        aria-label={label}
        aria-current={selected ? 'true' : undefined}
        title={label}
        className={`group relative flex flex-col justify-end rounded-t outline-offset-2 disabled:cursor-not-allowed ${className}`}
      >
        {isBest && <span className="block mx-auto mb-1 w-1.5 h-1.5 rounded-full bg-magenta shrink-0" aria-hidden="true" />}
        {d.score == null ? (
          <span className="block w-full h-2 rounded-t bg-line" />
        ) : (
          <span
            className={`block w-full rounded-t transition-[filter] group-hover:brightness-110 text-[10px] font-mono font-medium leading-none pt-1 text-center overflow-hidden ${selected ? 'outline outline-2 outline-offset-2 outline-ink' : ''}`}
            style={{ height: `${Math.max(decimals ? 26 : 14, d.score * 10)}%`, background: bandColor(d.band), color: bandInk(d.band) }}
          >
            {num(d.score, decimals)}
          </span>
        )}
      </button>
    );
  };

  // The departures by local day and hour, for the narrow layout.
  const hours = [...new Set(deps.map(d => new Date(d.departure).getHours()))].sort((a, b) => a - b);
  const days = [];
  for (const d of deps) {
    const date = new Date(d.departure);
    const key = date.toDateString();
    let row = days.find(r => r.key === key);
    if (!row) days.push(row = { key, label: day(d.departure), byHour: new Map() });
    row.byHour.set(date.getHours(), d);
  }
  const cols = { gridTemplateColumns: `2.5rem repeat(${hours.length}, minmax(0, 1fr))` };

  return (
    <ResultSection title={t('passage.window.title')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        {best && (
          <p className="min-w-0 max-w-prose text-ink">
            {t('passage.window.calmestAt', { when: `${day(best.departure)} ${time(best.departure)}`, score: num(best.score), band: t(`passage.band.${best.band}`) })}
          </p>
        )}
        {best && !bestIsSelected && (
          <button
            type="button"
            onClick={() => onPick(best.departure)}
            className="inline-flex items-center gap-1.5 bg-deep text-deep-on px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-deep-hover transition-colors"
          >
            <Clock size={15} strokeWidth={1.75} aria-hidden="true" />
            {t('passage.window.useBest')}
          </button>
        )}
      </div>

      {/* Narrow screens: one row per day, so every departure fits the width
          and the same hour sits in the same column. */}
      <div className="mt-4 space-y-2 sm:hidden">
        <div className="grid gap-1 data text-[10px] text-ink-muted text-center" style={cols} aria-hidden="true">
          <span />
          {hours.map(h => <span key={h}>{String(h).padStart(2, '0')}</span>)}
        </div>
        {days.map(row => (
          <div key={row.key} className="grid gap-1 items-end border-b border-line" style={cols} role="list" aria-label={row.label}>
            <span className="self-center data text-xs font-medium text-ink" aria-hidden="true">{row.label}</span>
            {hours.map(h => {
              const d = row.byHour.get(h);
              return d ? <Bar key={h} d={d} decimals={1} className="h-16" /> : <span key={h} />;
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 hidden sm:block">
        <div className="flex items-end gap-1 h-28" role="list">
          {deps.map(d => <Bar key={d.departure} d={d} decimals={0} className="flex-1 h-full" />)}
        </div>
        <div className="flex gap-1 mt-1.5" aria-hidden="true">
          {deps.map((d, i) => {
            const h = new Date(d.departure).getHours();
            const newDay = i === 0 || new Date(deps[i - 1].departure).getDate() !== new Date(d.departure).getDate();
            return (
              <span key={d.departure} className={`flex-1 text-center data text-[10px] leading-tight ${near(d.departure, departure) ? 'text-ink font-semibold' : 'text-ink-muted'}`}>
                {newDay ? <b className="block font-semibold text-ink">{day(d.departure)}</b> : <span className="block">&nbsp;</span>}
                {i % 2 === 0 || h === 0 || near(d.departure, departure) ? time(d.departure).slice(0, 2) : ''}
              </span>
            );
          })}
        </div>
      </div>
      <p className="text-sm text-ink-muted mt-3">{t('passage.window.hint')}</p>
    </ResultSection>
  );
}
