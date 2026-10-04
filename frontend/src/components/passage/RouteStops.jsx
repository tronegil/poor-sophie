import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ArrowUpDown, Plus } from 'lucide-react';
import PlaceSearch from './PlaceSearch';
import { useFormat } from '../../i18n/format';

// The route as a list of stops, like a navigation app: Fra, any via points,
// Til. Empty stops are search fields; filled ones show the place (or the
// position, for a tap on the chart) with a remove button.
export default function RouteStops({ waypoints, maxWaypoints, onSetStart, onSetEnd, onAddVia, onReplace, onRemove, onSwap }) {
  const { t } = useTranslation();
  const { num } = useFormat();
  const [addingVia, setAddingVia] = useState(false);
  const [editing, setEditing] = useState(null); // index of the stop being replaced by search
  const n = waypoints.length;
  const full = n >= maxWaypoints;

  const where = w => w.name || `${num(w.lat, 3)} N ${num(w.lon, 3)} Ø`;
  const tag = (role, i) => (
    <span className={`stop-tag shrink-0 w-12 text-center rounded px-1.5 py-1 ${role === 'end' ? 'bg-magenta text-magenta-on' : role === 'start' ? 'bg-deep text-deep-on' : 'bg-shallow text-ink'}`}>
      {role === 'via' ? t('passage.stops.viaN', { n: i }) : t(`passage.stops.${role}`)}
    </span>
  );
  const stopLabel = (role, i) => (role === 'via' ? t('passage.stops.viaN', { n: i }) : t(`passage.stops.${role}`));
  const filled = (w, i, role) => (
    <li key={`${role}-${i}`} className="flex items-center gap-2 min-w-0">
      {tag(role, i)}
      {editing === i ? (
        <div className="flex-1 min-w-0">
          <PlaceSearch
            autoFocus
            onPick={p => { onReplace(i, p); setEditing(null); }}
            onCancel={() => setEditing(null)}
            label={stopLabel(role, i)}
            placeholder={t('passage.stops.replacePlaceholder', { what: stopLabel(role, i) })}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(i)}
          title={t('passage.stops.change', { what: stopLabel(role, i) })}
          className={`flex-1 min-w-0 truncate text-left text-sm rounded px-1 py-1.5 hover:bg-shallow ${w.name ? 'text-ink' : 'data text-ink-muted'}`}
        >
          {where(w)}
        </button>
      )}
      <button type="button" onClick={() => onRemove(i)} aria-label={t('passage.stops.remove', { what: role === 'via' ? t('passage.stops.viaN', { n: i }) : t(`passage.stops.${role}`) })} className="p-1.5 text-ink-muted hover:text-band-ashore">
        <X size={15} strokeWidth={2} aria-hidden="true" />
      </button>
    </li>
  );
  const empty = (role, onPick, disabledText) => (
    <li key={`${role}-empty`} className="flex items-center gap-2 min-w-0">
      {tag(role)}
      <div className="flex-1 min-w-0">
        {disabledText
          ? <p className="text-sm text-ink-muted px-1 py-2">{disabledText}</p>
          : <PlaceSearch onPick={onPick} label={t(`passage.stops.${role}`)} placeholder={t(`passage.stops.${role}Placeholder`)} />}
      </div>
    </li>
  );

  return (
    <div className="space-y-2">
      <ol className="space-y-1.5" aria-label={t('passage.stops.title')}>
        {n ? filled(waypoints[0], 0, 'start') : empty('start', onSetStart)}
        {waypoints.slice(1, -1).map((w, k) => filled(w, k + 1, 'via'))}
        {n >= 2 ? filled(waypoints[n - 1], n - 1, 'end') : empty('end', onSetEnd, n === 0 ? t('passage.stops.startFirst') : null)}
      </ol>
      {n >= 2 && (
        <div className="flex flex-wrap items-center gap-2">
          {addingVia ? (
            <div className="flex-1 min-w-[14rem] flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <PlaceSearch
                  autoFocus
                  onPick={p => { onAddVia(p); setAddingVia(false); }}
                  onCancel={() => setAddingVia(false)}
                  label={t('passage.stops.via')}
                  placeholder={t('passage.stops.viaPlaceholder')}
                />
              </div>
              <button type="button" onClick={() => setAddingVia(false)} className="text-sm text-ink-muted hover:text-ink px-2 py-2">{t('boat.cancel')}</button>
            </div>
          ) : (
            <button type="button" disabled={full} onClick={() => setAddingVia(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-magenta hover:underline underline-offset-4 disabled:opacity-45 disabled:no-underline">
              <Plus size={15} strokeWidth={2} aria-hidden="true" />{t('passage.stops.addVia')}
            </button>
          )}
          <button type="button" onClick={onSwap} className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink ml-auto">
            <ArrowUpDown size={15} strokeWidth={1.75} aria-hidden="true" />{t('passage.stops.swap')}
          </button>
        </div>
      )}
    </div>
  );
}
