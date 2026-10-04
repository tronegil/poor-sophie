import { useState, useEffect } from 'react';
import { Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import PassagePlanner, { inputClass } from '../components/passage/PassagePlanner';
import BoatPicker from '../components/passage/BoatPicker';
import HowItWorks from '../components/passage/HowItWorks';
import { BOAT_PRESETS, DEFAULT_PRESET_ID } from '../components/passage/boatPresets';
import { parseShareParams } from '../components/passage/shareLink';
import ThemePicker from '../components/brand/ThemePicker';
import InstallApp from '../components/brand/InstallApp';
import HeelScale from '../components/landing/HeelScale';
import './landing.css';

const BOAT_KEY = 'passage:public:boat';

function loadBoat() {
  try {
    const saved = JSON.parse(localStorage.getItem(BOAT_KEY));
    if (saved?.presetId) return saved;
  } catch { /* ignore */ }
  const p = BOAT_PRESETS.find(b => b.id === DEFAULT_PRESET_ID);
  return { presetId: p.id, name: p.name, loa_m: p.loa_m, displacement_kg: p.displacement_kg, hull_type: p.hull_type, keel_type: p.keel_type };
}

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

// Did this result come from exactly these waypoints?
function sameRoute(result, wps) {
  const legs = result?.legs ?? [];
  if (!wps || legs.length !== wps.length - 1) return false;
  const near = (a, b) => Math.abs(a.lat - b.lat) < 1e-4 && Math.abs(a.lon - b.lon) < 1e-4;
  return legs.every((leg, i) => near(leg.from, wps[i]) && near(leg.to, wps[i + 1]));
}

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

const smooth = () => (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

// Public front page: the seasickness index for anyone, no account needed.
export default function Landing() {
  const { t, i18n } = useTranslation();
  const [shared] = useState(takeSharedTrip);
  // Opened once: coming back to the page later starts from your own last route.
  useEffect(() => { sharedTrip = null; }, []);
  const [example, setExample] = useState(() => !shared && !hasOwnRoute());
  const [plannerKey, setPlannerKey] = useState(0);
  // The last scored passage, shown on the scale at the top of the page and
  // named by its route: the example, the shared trip, or the visitor's own.
  // A result saved from an earlier visit shows too, marked as not fresh.
  const [marker, setMarker] = useState(null);
  const onResult = (data, { saved = false } = {}) => {
    const kind = shared && sameRoute(data, shared.waypoints) ? 'shared'
      : sameRoute(data, EXAMPLE_TRIP.waypoints) ? 'example' : 'yours';
    setMarker({ band: data.total.band, score: data.total.score, kind, saved });
  };
  // Remount the planner on an empty chart, dropping the example route.
  const drawOwn = () => {
    try { localStorage.setItem(ROUTE_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(ROUTE_KEY) || '{}'), waypoints: [] })); } catch { /* ignore */ }
    setExample(false);
    setMarker(null);
    setPlannerKey(k => k + 1);
  };
  const [boat, setBoat] = useState(() => (shared?.boat ? { ...shared.boat, name: shared.boat.name || t('landing.customBoat') } : loadBoat()));

  const changeBoat = b => { setBoat(b); try { localStorage.setItem(BOAT_KEY, JSON.stringify(b)); } catch { /* ignore */ } };
  const setLang = lng => { i18n.changeLanguage(lng); localStorage.setItem('language', lng); };
  const isEn = i18n.language?.startsWith('en');

  const boatPayload = { name: boat.name, loa_m: Number(boat.loa_m), displacement_kg: Number(boat.displacement_kg), hull_type: boat.hull_type, keel_type: boat.keel_type };
  const score = payload => api.post('/passage/score', { ...payload, boat: boatPayload }).then(res => res.data);
  const scoreWindow = payload => api.post('/passage/window', { ...payload, boat: boatPayload }).then(res => res.data);

  const showResult = () => document.querySelector('#plan [data-results]')?.scrollIntoView({ behavior: smooth(), block: 'start' });
  const how = t('landing.how', { returnObjects: true });

  return (
    <div className="kv">
      <header className="kv-wrap flex items-center justify-between gap-4 h-16">
        <a href="/" className="text-xl font-extrabold tracking-tight text-ink">{t('landing.brand')}</a>
        <div className="flex items-center gap-3 sm:gap-5">
          <ThemePicker />
          {/* One button, naming the other language in that language. */}
          <button
            type="button"
            lang={isEn ? 'no' : 'en'}
            onClick={() => setLang(isEn ? 'no' : 'en')}
            className="py-1 text-sm font-semibold text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
          >
            {isEn ? 'Norsk' : 'English'}
          </button>
        </div>
      </header>

      <main>
        {/* The question, and the scale that answers it */}
        <section className="kv-wrap pt-10 sm:pt-16 pb-16 sm:pb-24">
          <h1 className="max-w-[18ch] text-[2.25rem] sm:text-[3.25rem] leading-[1.02] font-bold">{t('landing.title')}</h1>
          <p className="mt-5 max-w-[54ch] text-lg leading-relaxed text-ink-muted">{t('landing.lead')}</p>
          <a href="#plan" className="mt-7 inline-flex items-center bg-deep text-deep-on px-5 py-3 rounded-lg font-semibold hover:bg-deep-hover transition-colors">
            {t('landing.cta')}
          </a>
          <div className="mt-12 sm:mt-16">
            <HeelScale marker={marker} onMarker={showResult} />
          </div>
        </section>

        {/* The tool */}
        <section id="plan" className="kv-wrap scroll-mt-4 pb-20 sm:pb-28">
          <div className="mb-6 max-w-[60ch]">
            <h2 className="text-3xl sm:text-[2.5rem] leading-[1.05] font-bold">{t('landing.planTitle')}</h2>
            {example ? (
              <p className="mt-3 text-ink-muted leading-relaxed">
                {t('landing.example')}{' '}
                <button type="button" onClick={drawOwn} className="font-semibold text-magenta underline underline-offset-4 decoration-magenta/40 hover:decoration-magenta">{t('landing.drawOwn')}</button>
              </p>
            ) : (
              <p className="mt-3 text-ink-muted leading-relaxed">{t('landing.planHint')}</p>
            )}
          </div>
          {shared && (
            <p className="mb-3 flex items-center gap-2 text-sm bg-shallow rounded-lg px-4 py-2.5 text-ink">
              <Link2 size={16} strokeWidth={1.75} className="text-magenta shrink-0" aria-hidden="true" />
              {t('passage.shared')}
            </p>
          )}
          <PassagePlanner
            key={plannerKey}
            storageKey={ROUTE_KEY}
            score={score}
            scoreWindow={scoreWindow}
            windowKey={JSON.stringify(boatPayload)}
            shareBoat={boat}
            initial={plannerKey === 0 ? (shared ?? (example ? EXAMPLE_TRIP : null)) : null}
            onResult={onResult}
            mapHeight="h-[24rem] sm:h-[32rem]"
            mapScrollZoom={false}
            extraControls={<BoatPicker value={boat} onChange={changeBoat} inputClass={inputClass} />}
          />
        </section>

        {/* How, and why */}
        <section className="border-t border-line">
          <div className="kv-wrap py-16 sm:py-24 grid md:grid-cols-[minmax(0,1fr)_minmax(0,38rem)] gap-x-16 gap-y-6">
            <h2 className="text-2xl sm:text-3xl leading-tight font-bold">{t('landing.howTitle')}</h2>
            <div className="space-y-5 text-[1.0625rem] leading-relaxed">
              {Array.isArray(how) && how.map((c, i) => (
                <p key={i}><strong className="font-bold">{c.h}.</strong> <span className="text-ink-muted">{c.p}</span></p>
              ))}
              <HowItWorks
                label={t('landing.fullMath')}
                buttonClassName="inline-flex items-center gap-2 font-semibold text-magenta underline underline-offset-4 decoration-magenta/40 hover:decoration-magenta"
              />
            </div>

            <h2 className="mt-10 md:mt-16 text-2xl sm:text-3xl leading-tight font-bold">{t('landing.whyTitle')}</h2>
            <p className="md:mt-16 text-[1.0625rem] leading-relaxed text-ink-muted">{t('landing.why')}</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="kv-wrap py-10 text-sm text-ink-muted space-y-3 max-w-[68rem]">
          <p className="max-w-[70ch]">{t('landing.footerData')}</p>
          <p>
            {t('landing.footerOwners')}{' '}
            <Link to="/login" className="font-semibold text-ink underline underline-offset-4 decoration-line hover:decoration-ink">{t('landing.footerLogin')}</Link>
          </p>
          <InstallApp />
        </div>
      </footer>
    </div>
  );
}
