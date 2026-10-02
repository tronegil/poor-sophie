import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Smartphone, Share } from 'lucide-react';

// Chrome/Edge/Android fire `beforeinstallprompt` once per page load; keep it
// at module level so the button works on whichever page shows it.
let deferredPrompt = null;
const listeners = new Set();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    listeners.forEach(fn => fn());
  });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; listeners.forEach(fn => fn()); });
}

const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

// "Install the app": the browser's own install prompt where there is one; on
// iPhone and iPad (no prompt) a one-line how-to; nothing once installed.
export default function InstallApp({ onDeep = false, className = '' }) {
  const { t } = useTranslation();
  const [, rerender] = useState(0);
  useEffect(() => {
    const fn = () => rerender(n => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);

  if (isStandalone()) return null;

  if (deferredPrompt) {
    const install = async () => {
      const prompt = deferredPrompt;
      deferredPrompt = null;
      prompt.prompt();
      await prompt.userChoice.catch(() => null);
      listeners.forEach(fn => fn());
    };
    return (
      <button
        type="button"
        onClick={install}
        className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${onDeep ? 'text-deep-on/80 hover:text-deep-on' : 'text-magenta hover:underline underline-offset-4'} ${className}`}
      >
        <Smartphone size={15} strokeWidth={1.75} aria-hidden="true" />
        {t('app.install')}
      </button>
    );
  }

  if (isIos()) {
    return (
      <p className={`inline-flex items-center gap-1.5 text-sm ${onDeep ? 'text-deep-on/80' : 'text-ink-muted'} ${className}`}>
        <Share size={15} strokeWidth={1.75} aria-hidden="true" />
        {t('app.iosHint')}
      </p>
    );
  }
  return null;
}
