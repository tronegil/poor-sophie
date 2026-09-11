import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Small info button that opens a plain-language explanation of the model.
export default function HowItWorks() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const steps = t('passage.how.steps', { returnObjects: true });
  const refs = t('passage.how.refs', { returnObjects: true });
  const sources = t('passage.how.sources', { returnObjects: true });

  useEffect(() => {
    if (!open) return;
    const onKey = e => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-ocean-600 hover:text-ocean-800 hover:underline"
        aria-haspopup="dialog"
      >
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-current text-[10px] font-bold">i</span>
        {t('passage.how.title')}
      </button>

      {open && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('passage.how.title')}
            onClick={e => e.stopPropagation()}
            className="bg-white w-full sm:max-w-xl max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl"
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">🧮 {t('passage.how.title')}</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none px-2" aria-label="Close">×</button>
            </div>
            <div className="px-5 py-4 space-y-4 text-sm text-slate-600 leading-relaxed">
              <p>{t('passage.how.intro')}</p>
              <ol className="space-y-3">
                {Array.isArray(steps) && steps.map((s, i) => (
                  <li key={i}>
                    <p className="font-medium text-slate-800">{s.h}</p>
                    <p>{s.p}</p>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">{t('passage.how.caveat')}</p>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold text-slate-500 mb-1.5">{t('passage.how.sourcesTitle')}</p>
                <ul className="space-y-2">
                  {Array.isArray(sources) && sources.map((src, i) => (
                    <li key={i} className="text-xs leading-snug">
                      <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-ocean-600 hover:underline font-medium">{src.name} ↗</a>
                      <span className="text-slate-400"> — {src.p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold text-slate-500 mb-1.5">{t('passage.how.refsTitle')}</p>
                <ul className="space-y-1.5">
                  {Array.isArray(refs) && refs.map((r, i) => <li key={i} className="text-xs text-slate-400 leading-snug">{r}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
