import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-900 to-ocean-700 flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <div className="text-6xl mb-4 select-none">⛵</div>
        <h1 className="text-4xl font-bold text-white mb-2">{t('login.title')}</h1>
        <p className="text-ocean-200">{t('login.subtitle')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <a
          href="/api/auth/google"
          className="flex items-center justify-center gap-3 w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-700 font-medium hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <GoogleIcon />
          {t('login.signIn')}
        </a>
      </div>

      <div className="mt-10 opacity-30">
        <WaveDivider />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function WaveDivider() {
  return (
    <svg viewBox="0 0 300 24" className="w-64 fill-white" aria-hidden="true">
      <path d="M0,12 C50,0 75,24 150,12 C225,0 250,24 300,12 L300,24 L0,24 Z" />
    </svg>
  );
}
