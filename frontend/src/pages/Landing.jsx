import { useState, useEffect } from 'react';
import { Link2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import PassagePlanner, { inputClass } from '../components/passage/PassagePlanner';
import BoatPicker from '../components/passage/BoatPicker';
import HowItWorks from '../components/passage/HowItWorks';
import { BOAT_PRESETS, DEFAULT_PRESET_ID } from '../components/passage/boatPresets';
import { Waves, Sailboat, Ear } from 'lucide-react';
import { bandColor, bandInk } from '../components/passage/bands';
import Wordmark from '../components/brand/Wordmark';
import Isobaths from '../components/brand/Isobaths';
import { parseShareParams } from '../components/passage/shareLink';
import ThemePicker from '../components/brand/ThemePicker';
import InstallApp from '../components/brand/InstallApp';

// Icons for the three "how it works" cards, in order: sea, boat, inner ear.
const HOW_ICONS = [Waves, Sailboat, Ear];

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
const ROUTE_KEY = 'passage:public';

// What a first-time visitor sees instead of an empty chart: the open crossing
// of Boknafjorden from Tananger to Skudeneshavn, south of Kvitsøy, already scored.
const EXAMPLE_TRIP = {
  waypoints: [
    { lat: 58.937, lon: 5.570 },
    { lat: 58.980, lon: 5.450 },
    { lat: 59.020, lon: 5.330 },
    { lat: 59.100, lon: 5.270 },
    { lat: 59.142, lon: 5.262 },
  ],
  speed: 5.5,
};

function hasOwnRoute() {
  try { return (JSON.parse(localStorage.getItem(ROUTE_KEY))?.waypoints?.length ?? 0) > 0; } catch { return false; }
}

// A shared trip in the URL, read once. The query is then removed so a reload
// or further edits behave like normal use.
// Cached at module level so React's double-invoked initialisers (StrictMode)
// see the same trip after the URL has been cleaned.
let sharedTrip;
function takeSharedTrip() {
  if (sharedTrip === undefined) {
    sharedTrip = parseShareParams(window.location.search);
    if (sharedTrip) window.history.replaceState(null, '', window.location.pathname + window.location.hash);
  }
  return sharedTrip;
}

export default function Landing() {
  const { t, i18n } = useTranslation();
  const [shared] = useState(takeSharedTrip);
  // Opened once: coming back to the page later starts from your own last route.
  useEffect(() => { sharedTrip = null; }, []);
  const [example, setExample] = useState(() => !shared && !hasOwnRoute());
  const [plannerKey, setPlannerKey] = useState(0);
  // Remount the planner on an empty chart, dropping the example route.
  const drawOwn = () => {
    try { localStorage.setItem(ROUTE_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(ROUTE_KEY) || '{}'), waypoints: [] })); } catch { /* ignore */ }
    setExample(false);
    setPlannerKey(k => k + 1);
  };
  const [boat, setBoat] = useState(() => (shared?.boat ? { ...shared.boat, name: shared.boat.name || t('landing.customBoat') } : loadBoat()));

  const changeBoat = b => { setBoat(b); try { localStorage.setItem(BOAT_KEY, JSON.stringify(b)); } catch { /* ignore */ } };
  const setLang = lng => { i18n.changeLanguage(lng); localStorage.setItem('language', lng); };

  const boatPayload = { name: boat.name, loa_m: Number(boat.loa_m), displacement_kg: Number(boat.displacement_kg), hull_type: boat.hull_type, keel_type: boat.keel_type };
  const score = payload => api.post('/passage/score', { ...payload, boat: boatPayload }).then(res => res.data);
  const scoreWindow = payload => api.post('/passage/window', { ...payload, boat: boatPayload }).then(res => res.data);

  const how = t('landing.how', { returnObjects: true });
  const bands = t('landing.bands', { returnObjects: true });
  const pills = t('landing.pills', { returnObjects: true });

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Hero: deep water with depth contours */}
      <header className="relative bg-deep text-deep-on overflow-hidden">
        <Isobaths className="absolute inset-0 w-full h-full pointer-events-none" />
        <nav className="relative max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Wordmark className="text-xl">{t('landing.brand')}</Wordmark>
          <div className="flex items-center gap-2">
          <ThemePicker onDeep />
          <div className="inline-flex border border-deep-on/25 rounded-full p-0.5 font-mono text-[11px]">
            {['no', 'en'].map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={i18n.language === l}
                className={`px-2.5 py-1 rounded-full transition-colors ${i18n.language === l ? 'bg-deep-on text-deep' : 'text-deep-on/70 hover:text-deep-on'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          </div>
        </nav>
        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-28 sm:pt-16 sm:pb-36">
          <h1 className="max-w-3xl text-4xl sm:text-[56px] font-bold leading-[1.02]">{t('landing.title')}</h1>
          <p className="mt-5 max-w-2xl text-base sm:text-lg text-deep-on/80 leading-relaxed">{t('landing.lead')}</p>
          {Array.isArray(pills) && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {pills.map((p, i) => (
                <li key={i} className="font-mono text-[11px] sm:text-xs uppercase tracking-wider border border-deep-on/25 rounded px-2 py-1 text-deep-on/80">{p}</li>
              ))}
            </ul>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 -mt-20 sm:-mt-28 pb-20 space-y-16">
        {/* The tool */}
        <section>
          {shared && (
            <p className="relative z-10 mb-3 flex items-center gap-2 text-sm bg-surface border border-line rounded-lg px-4 py-2.5 text-ink shadow-panel">
              <Link2 size={16} strokeWidth={1.75} className="text-magenta shrink-0" aria-hidden="true" />
              {t('passage.shared')}
            </p>
          )}
          {example && (
            <div className="relative z-10 mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm bg-surface border border-line rounded-lg px-4 py-2.5 text-ink shadow-panel">
              <Sparkles size={16} strokeWidth={1.75} className="text-magenta shrink-0" aria-hidden="true" />
              <p className="flex-1 min-w-[14rem]">{t('landing.example')}</p>
              <button type="button" onClick={drawOwn} className="font-medium text-magenta hover:underline underline-offset-4">{t('landing.drawOwn')}</button>
            </div>
          )}
          <PassagePlanner
            key={plannerKey}
            storageKey={ROUTE_KEY}
            score={score}
            scoreWindow={scoreWindow}
            windowKey={JSON.stringify(boatPayload)}
            shareBoat={boat}
            initial={plannerKey === 0 ? (shared ?? (example ? EXAMPLE_TRIP : null)) : null}
            mapHeight="h-[24rem] sm:h-[32rem]"
            mapScrollZoom={false}
            extraControls={<BoatPicker value={boat} onChange={changeBoat} inputClass={inputClass} />}
          />
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold">{t('landing.howTitle')}</h2>
          <div className="mt-6 grid sm:grid-cols-3 gap-6">
            {Array.isArray(how) && how.map((c, i) => {
              const Icon = HOW_ICONS[i] ?? Waves;
              return (
                <div key={i} className="border-t-2 border-ink pt-4">
                  <Icon size={22} strokeWidth={1.75} className="text-magenta mb-3" aria-hidden="true" />
                  <h3 className="font-semibold text-ink">{c.h}</h3>
                  <p className="text-sm text-ink-muted mt-2 leading-relaxed">{c.p}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-8">
            <HowItWorks
              label={t('landing.fullMath')}
              buttonClassName="inline-flex items-center gap-2 text-sm font-medium text-magenta hover:underline underline-offset-4"
            />
          </div>
        </section>

        {/* Bands */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold">{t('landing.bandsTitle')}</h2>
          <ul className="mt-6 border-t border-line">
            {Array.isArray(bands) && bands.map(b => (
              <li key={b.band} className="grid grid-cols-[3.5rem_1fr] sm:grid-cols-[3.5rem_10rem_1fr] gap-x-4 gap-y-1 items-center py-3 border-b border-line">
                <span className="data text-center text-[13px] font-semibold rounded py-1.5" style={{ background: bandColor(b.band), color: bandInk(b.band) }}>{b.range}</span>
                <span className="font-semibold text-ink">{t(`passage.band.${b.band}`)}</span>
                <span className="col-start-2 sm:col-start-auto text-sm text-ink-muted">{b.p}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Why */}
        <section className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold">{t('landing.whyTitle')}</h2>
          <p className="mt-5 text-ink-muted leading-relaxed">{t('landing.why')}</p>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="max-w-5xl mx-auto px-4 py-8 text-xs text-ink-muted space-y-2">
          <p>{t('landing.footerData')}</p>
          <p className="flex flex-wrap items-center gap-x-2">
            <span>{t('landing.footerOwners')}</span>
            <Link to="/login" className="text-magenta hover:underline underline-offset-2">{t('landing.footerLogin')}</Link>
          </p>
          <InstallApp className="pt-2" />
        </div>
      </footer>
    </div>
  );
}
