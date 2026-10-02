import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, BellRing } from 'lucide-react';
import { enablePush, pushSupport } from '../../push';

// Thresholds offered: tell me when a departure scores under Flat calm,
// Comfortable or Uncomfortable (the band boundaries 2, 4, 6).
const THRESHOLDS = [
  { value: 2, band: 'flat' },
  { value: 4, band: 'comfortable' },
  { value: 6, band: 'uncomfortable' },
];

// The bell on a saved passage: pick a threshold to be alerted when the next
// 48 h hold a departure that calm, or turn it off. Asks for notification
// permission the first time.
export default function WatchTrip({ trip, onWatch }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const active = trip.watch_threshold != null;

  const choose = async threshold => {
    setBusy(true);
    setError('');
    try {
      if (threshold != null) await enablePush();
      await onWatch(trip, threshold);
      setOpen(false);
    } catch (err) {
      const code = err.code || err.response?.data?.code;
      setError(t(`passage.watch.errors.${['IOS_INSTALL', 'UNSUPPORTED', 'NOT_CONFIGURED', 'DENIED', 'NO_WORKER', 'TOO_MANY_WATCHES'].includes(code) ? code : 'GENERIC'}`));
    } finally {
      setBusy(false);
    }
  };

  const label = active
    ? t('passage.watch.on', { name: trip.name, band: t(`passage.band.${THRESHOLDS.find(x => x.value === trip.watch_threshold)?.band ?? 'comfortable'}`) })
    : t('passage.watch.off', { name: trip.name });

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setError(''); }}
        aria-expanded={open}
        aria-label={label}
        title={label}
        className={`px-2 border-l border-line transition-colors ${active ? 'text-magenta' : 'text-ink-muted hover:text-ink'}`}
      >
        {active ? <BellRing size={15} strokeWidth={2} aria-hidden="true" /> : <Bell size={15} strokeWidth={1.75} aria-hidden="true" />}
      </button>
      {open && (
        <div className="basis-full border-t border-line px-3 py-2.5 space-y-2 text-sm">
          <p className="text-ink">{t('passage.watch.prompt')}</p>
          {pushSupport() === 'ios-install' && <p className="text-ink-muted text-xs">{t('passage.watch.errors.IOS_INSTALL')}</p>}
          <div className="flex flex-wrap gap-1.5">
            {THRESHOLDS.map(x => (
              <button
                key={x.value}
                type="button"
                disabled={busy}
                aria-pressed={trip.watch_threshold === x.value}
                onClick={() => choose(x.value)}
                className={`px-2.5 py-1.5 rounded-md border transition-colors disabled:opacity-45 ${trip.watch_threshold === x.value ? 'bg-deep text-deep-on border-deep' : 'border-line text-ink hover:bg-shallow'}`}
              >
                {t('passage.watch.under', { band: t(`passage.band.${x.band}`), n: x.value })}
              </button>
            ))}
            {active && (
              <button type="button" disabled={busy} onClick={() => choose(null)} className="px-2.5 py-1.5 text-ink-muted hover:text-ink disabled:opacity-45">
                {t('passage.watch.turnOff')}
              </button>
            )}
          </div>
          <p className="text-xs text-ink-muted">{t('passage.watch.how')}</p>
          {error && <p role="alert" className="text-band-ashore">{error}</p>}
        </div>
      )}
    </>
  );
}
