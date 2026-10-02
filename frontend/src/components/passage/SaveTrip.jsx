import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bookmark, Check } from 'lucide-react';

// "Save passage": names the current route and stores it for this boat. When
// the route came from a saved passage, it can update that one or save a copy.
export default function SaveTrip({ onSave, loaded }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const start = () => { setName(loaded?.name ?? ''); setError(''); setOpen(true); };
  const submit = async asNew => {
    if (!name.trim()) { setError(t('passage.saved.nameRequired')); return; }
    setBusy(true);
    setError('');
    try {
      await onSave({ name: name.trim(), id: asNew ? null : loaded?.id ?? null });
      setOpen(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.code === 'TOO_MANY' ? t('passage.saved.tooMany') : t('passage.saved.error'));
    } finally {
      setBusy(false);
    }
  };

  const btn = 'inline-flex items-center gap-1.5 border border-line text-ink px-3 py-2 rounded-lg text-sm hover:bg-shallow hover:border-shallow transition-colors disabled:opacity-45';

  if (!open) {
    return (
      <button type="button" onClick={start} className={btn}>
        {saved
          ? <><Check size={15} strokeWidth={2} aria-hidden="true" />{t('passage.saved.done')}</>
          : <><Bookmark size={15} strokeWidth={1.75} aria-hidden="true" />{t('passage.saved.save')}</>}
      </button>
    );
  }
  return (
    <form
      className="basis-full flex flex-wrap items-end gap-2 bg-shallow/60 rounded-lg p-3"
      onSubmit={e => { e.preventDefault(); submit(!loaded); }}
    >
      <label className="flex-1 min-w-[12rem]">
        <span className="block label-mono mb-1.5">{t('passage.saved.name')}</span>
        <input
          autoFocus
          maxLength={80}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('passage.saved.placeholder')}
          className="w-full border border-line rounded px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-magenta focus:border-transparent"
        />
      </label>
      {loaded ? (
        <>
          <button type="submit" disabled={busy} className="bg-deep text-deep-on px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-deep-hover disabled:opacity-45">{t('passage.saved.update')}</button>
          <button type="button" disabled={busy} onClick={() => submit(true)} className={btn}>{t('passage.saved.saveCopy')}</button>
        </>
      ) : (
        <button type="submit" disabled={busy} className="bg-deep text-deep-on px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-deep-hover disabled:opacity-45">{t('passage.saved.save')}</button>
      )}
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink-muted hover:text-ink px-2 py-2">{t('boat.cancel')}</button>
      {error && <p role="alert" className="basis-full text-sm text-band-ashore">{error}</p>}
    </form>
  );
}
