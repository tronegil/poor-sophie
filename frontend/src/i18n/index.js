import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import no from './no';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    no: { translation: no },
  },
  lng: localStorage.getItem('language') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
