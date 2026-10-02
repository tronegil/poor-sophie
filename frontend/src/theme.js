// Dag/Natt theme. 'system' follows the OS; 'light'/'dark' pin it by setting
// data-theme on <html> (the colour variables live in theme.css). index.html
// applies the stored choice before first paint to avoid a flash.
const KEY = 'theme';

export function getTheme() {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function setTheme(theme) {
  try {
    if (theme === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch { /* ignore */ }
  applyTheme(theme);
}

export function applyTheme(theme = getTheme()) {
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
  else root.removeAttribute('data-theme');
}
