import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Check } from 'lucide-react';
import { buildShareUrl } from './shareLink';

// "Share this passage": the phone's share sheet where there is one, else the
// link is copied. If neither works the link is shown so it can be copied by hand.
export default function ShareTrip({ trip, className = '' }) {
  const { t } = useTranslation();
  const [state, setState] = useState('idle'); // idle | copied | manual
  const [url, setUrl] = useState('');

  const share = async () => {
    const link = buildShareUrl(trip);
    setUrl(link);
    if (navigator.share && window.matchMedia?.('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: t('passage.share.title'), text: t('passage.share.text'), url: link });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return; // the user closed the share sheet
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      setState('copied');
      setTimeout(() => setState('idle'), 2500);
    } catch {
      setState('manual');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={share}
        className={`inline-flex items-center gap-1.5 border border-line text-ink px-3 py-2 rounded-lg text-sm hover:bg-shallow hover:border-shallow transition-colors ${className}`}
      >
        {state === 'copied'
          ? <><Check size={15} strokeWidth={2} aria-hidden="true" />{t('passage.share.copied')}</>
          : <><Share2 size={15} strokeWidth={1.75} aria-hidden="true" />{t('passage.share.button')}</>}
      </button>
      <span className="sr-only" role="status">{state === 'copied' ? t('passage.share.copied') : ''}</span>
      {state === 'manual' && (
        <div className="basis-full">
          <label className="block label-mono mb-1.5" htmlFor="share-link">{t('passage.share.manual')}</label>
          <input id="share-link" readOnly value={url} onFocus={e => e.target.select()} autoFocus className="w-full border border-line rounded px-3 py-2 text-sm data bg-surface text-ink" />
        </div>
      )}
    </>
  );
}
