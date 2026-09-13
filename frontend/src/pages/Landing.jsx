import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import PassagePlanner, { inputClass } from '../components/passage/PassagePlanner';
import BoatPicker from '../components/passage/BoatPicker';
import HowItWorks from '../components/passage/HowItWorks';
import { BOAT_PRESETS, DEFAULT_PRESET_ID } from '../components/passage/boatPresets';
import { bandColor } from '../components/passage/bands';

const BOAT_KEY = 'passage:public:boat';

function loadBoat() {
  try {
    const saved = JSON.parse(localStorage.getItem(BOAT_KEY));
    if (saved?.presetId) return saved;
  } catch { /* ignore */ }
  const p = BOAT_PRESETS.find(b => b.id === DEFAULT_PRESET_ID);
  return { presetId: p.id, name: p.name, loa_m: p.loa_m, displacement_kg: p.displacement_kg, hull_type: p.hull_type, keel_type: p.keel_type };
}

// Public front page: the seasickness index for anyone, no account needed.
export default function Landing() {
  const { t, i18n } = useTranslation();
  const [boat, setBoat] = useState(loadBoat);

  const changeBoat = b => { setBoat(b); try { localStorage.setItem(BOAT_KEY, JSON.stringify(b)); } catch { /* ignore */ } };
  const setLang = lng => { i18n.changeLanguage(lng); localStorage.setItem('language', lng); };

  const score = payload => api.post('/passage/score', {
    ...payload,
    boat: { name: boat.name, loa_m: Number(boat.loa_m), displacement_kg: Number(boat.displacement_kg), hull_type: boat.hull_type, keel_type: boat.keel_type },
  }).then(res => res.data);

  const how = t('landing.how', { returnObjects: true });
  const bands = t('landing.bands', { returnObjects: true });
  const pills = t('landing.pills', { returnObjects: true });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Hero */}
      <header className="relative bg-gradient-to-b from-ocean-900 via-ocean-800 to-ocean-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" aria-hidden="true">
          <Waves />
        </div>
        <nav className="relative max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-semibold text-lg flex items-center gap-2"><span>🤢</span>{t('landing.brand')}</span>
          <div className="flex items-center gap-1 text-xs">
            {['no', 'en'].map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 py-1 rounded-md transition-colors ${i18n.language === l ? 'bg-white/15 text-white' : 'text-ocean-200 hover:text-white'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </nav>
        <div className="relative max-w-3xl mx-auto px-4 pt-10 pb-28 sm:pt-16 sm:pb-36 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">{t('landing.title')}</h1>
          <p className="mt-5 text-base sm:text-lg text-ocean-100 leading-relaxed">{t('landing.lead')}</p>
          {Array.isArray(pills) && (
            <ul className="mt-6 flex flex-wrap justify-center gap-2">
              {pills.map((p, i) => (
                <li key={i} className="text-xs sm:text-sm bg-white/10 border border-white/15 rounded-full px-3 py-1 text-ocean-50">{p}</li>
              ))}
            </ul>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 -mt-20 sm:-mt-28 pb-20 space-y-20">
        {/* The tool */}
        <section>
          <PassagePlanner
            storageKey="passage:public"
            score={score}
            mapHeight="h-[24rem] sm:h-[32rem]"
            mapScrollZoom={false}
            extraControls={<BoatPicker value={boat} onChange={changeBoat} inputClass={inputClass} />}
          />
          <p className="text-center text-xs text-slate-400 mt-3">{t('landing.tryHint')}</p>
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-center">{t('landing.howTitle')}</h2>
          <div className="mt-8 grid sm:grid-cols-3 gap-5">
            {Array.isArray(how) && how.map((c, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="text-3xl mb-3">{c.icon}</div>
                <h3 className="font-semibold text-slate-800">{c.h}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{c.p}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <HowItWorks
              label={t('landing.fullMath')}
              buttonClassName="inline-flex items-center gap-2 text-sm font-medium text-ocean-700 bg-ocean-50 hover:bg-ocean-100 border border-ocean-100 rounded-full px-4 py-2 transition-colors"
            />
          </div>
        </section>

        {/* Bands */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-center">{t('landing.bandsTitle')}</h2>
          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">
            {Array.isArray(bands) && bands.map(b => (
              <div key={b.band} className="flex items-center gap-4 px-5 py-3.5">
                <span className="w-12 shrink-0 text-center text-white text-xs font-bold rounded-full py-1" style={{ background: bandColor(b.band) }}>{b.range}</span>
                <span className="w-32 sm:w-40 shrink-0 font-medium text-slate-800">{t(`passage.band.${b.band}`)}</span>
                <span className="text-sm text-slate-600">{b.p}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Why */}
        <section className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">{t('landing.whyTitle')}</h2>
          <p className="mt-5 text-slate-600 leading-relaxed">{t('landing.why')}</p>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8 text-xs text-slate-400 space-y-2">
          <p>{t('landing.footerData')}</p>
          <p className="flex flex-wrap items-center gap-x-2">
            <span>⛵ {t('landing.footerOwners')}</span>
            <Link to="/login" className="text-slate-500 hover:text-ocean-700 underline underline-offset-2">{t('landing.footerLogin')}</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

// Decorative repeating wave lines for the hero background.
function Waves() {
  return (
    <svg className="w-full h-full" viewBox="0 0 1200 600" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      {Array.from({ length: 12 }, (_, i) => (
        <path
          key={i}
          d={`M0 ${60 + i * 48} C 150 ${30 + i * 48}, 300 ${90 + i * 48}, 450 ${60 + i * 48} S 750 ${30 + i * 48}, 900 ${60 + i * 48} S 1200 ${90 + i * 48}, 1350 ${60 + i * 48}`}
          fill="none" stroke="white" strokeWidth="2"
        />
      ))}
    </svg>
  );
}
