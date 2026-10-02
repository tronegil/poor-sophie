import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Monitor, Sun, Moon } from 'lucide-react';
import { getTheme, setTheme } from '../../theme';

const OPTIONS = [
  { id: 'system', icon: Monitor },
  { id: 'light', icon: Sun },
  { id: 'dark', icon: Moon },
];

// System / Dag / Natt switch. `onDeep` styles it for the navy hero and navbar;
// `labels` shows the words next to the icons (Settings page).
export default function ThemePicker({ onDeep = false, labels = false }) {
  const { t } = useTranslation();
  const [theme, setThemeState] = useState(getTheme);

  const pick = id => { setTheme(id); setThemeState(id); };

  const wrap = onDeep
    ? 'border border-deep-on/25 rounded-full p-0.5'
    : 'border border-line rounded-lg p-1 bg-surface';
  const btn = active => onDeep
    ? `rounded-full p-1.5 transition-colors ${active ? 'bg-deep-on text-deep' : 'text-deep-on/70 hover:text-deep-on'}`
    : `flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-deep text-deep-on' : 'text-ink-muted hover:text-ink hover:bg-shallow'}`;

  return (
    <div role="radiogroup" aria-label={t('settings.theme')} className={`inline-flex ${labels ? 'w-full' : ''} ${wrap}`}>
      {OPTIONS.map(({ id, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={theme === id}
          title={t(`settings.themes.${id}`)}
          onClick={() => pick(id)}
          className={btn(theme === id)}
        >
          <Icon size={labels ? 16 : 14} strokeWidth={1.75} aria-hidden="true" />
          {labels ? <span>{t(`settings.themes.${id}`)}</span> : <span className="sr-only">{t(`settings.themes.${id}`)}</span>}
        </button>
      ))}
    </div>
  );
}
