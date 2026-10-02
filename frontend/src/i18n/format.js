import { useTranslation } from 'react-i18next';

// Norwegian shows numbers with a decimal comma ("6,4"), English with a point.
export function numberLocale(lng = '') {
  return /^(no|nb|nn)/.test(lng) ? 'nb-NO' : 'en-GB';
}

export function formatNumber(n, digits = 1, lng) {
  if (n == null || Number.isNaN(Number(n))) return '?';
  return Number(n).toLocaleString(numberLocale(lng), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

// Formatters bound to the current UI language.
export function useFormat() {
  const { i18n } = useTranslation();
  const locale = numberLocale(i18n.language);
  return {
    num: (n, digits = 1) => formatNumber(n, digits, i18n.language),
    time: iso => new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
    int: n => Number(n).toLocaleString(locale),
  };
}
