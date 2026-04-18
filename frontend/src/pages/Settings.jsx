import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import i18n from '../i18n';

export default function Settings() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const [language, setLanguage] = useState(user?.language || 'en');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await api.put('/users/language', { language });
    await i18n.changeLanguage(language);
    localStorage.setItem('language', language);
    setUser(u => ({ ...u, language }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const langs = [
    { code: 'en', label: t('settings.english') },
    { code: 'no', label: t('settings.norwegian') },
  ];

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">{t('settings.title')}</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">{t('settings.language')}</p>
          <div className="flex gap-3">
            {langs.map(lang => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  language === lang.code
                    ? 'bg-ocean-600 text-white border-ocean-600'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="bg-ocean-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-ocean-700 transition-colors"
        >
          {saved ? t('settings.saved') : t('settings.save')}
        </button>
      </div>
    </div>
  );
}
