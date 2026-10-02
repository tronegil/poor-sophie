import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Route, X } from 'lucide-react';
import { useFormat } from '../../i18n/format';

// The owner's saved passages for this boat, newest first. Tapping one opens
// and scores it; the × asks once, inline, before deleting.
export default function SavedTrips({ trips, activeId, onOpen, onDelete }) {
  const { t } = useTranslation();
  const { num } = useFormat();
  const [confirming, setConfirming] = useState(null);

  if (!trips.length) return null;
  return (
    <section aria-labelledby="saved-trips-title">
      <h2 id="saved-trips-title" className="label-mono mb-2">{t('passage.saved.title')}</h2>
      <ul className="flex flex-wrap gap-2">
        {trips.map(trip => (
          <li key={trip.id} className={`flex items-stretch rounded-lg border transition-colors ${trip.id === activeId ? 'border-ink bg-surface' : 'border-line bg-surface hover:border-ink-muted'}`}>
            {confirming === trip.id ? (
              <span className="flex items-center gap-2 px-3 py-1.5 text-sm">
                {t('passage.saved.confirmDelete', { name: trip.name })}
                <button type="button" onClick={() => { setConfirming(null); onDelete(trip); }} className="font-medium text-band-ashore hover:underline">{t('boat.delete')}</button>
                <button type="button" onClick={() => setConfirming(null)} className="text-ink-muted hover:text-ink">{t('boat.cancel')}</button>
              </span>
            ) : (
              <>
                <button type="button" onClick={() => onOpen(trip)} aria-current={trip.id === activeId || undefined} className="flex items-center gap-2 pl-3 pr-2 py-1.5 text-sm text-left">
                  <Route size={15} strokeWidth={1.75} className="text-magenta shrink-0" aria-hidden="true" />
                  <span className="font-medium text-ink">{trip.name}</span>
                  <span className="data text-xs text-ink-muted">{num(trip.speed_kn)} kn</span>
                </button>
                <button type="button" onClick={() => setConfirming(trip.id)} aria-label={t('passage.saved.delete', { name: trip.name })} className="px-2 text-ink-muted hover:text-band-ashore border-l border-line">
                  <X size={14} strokeWidth={2} aria-hidden="true" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
