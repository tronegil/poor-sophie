import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import PassagePlanner from '../components/passage/PassagePlanner';
import HowItWorks from '../components/passage/HowItWorks';
import SavedTrips from '../components/passage/SavedTrips';

// Per-boat seasickness score: hull data comes from the boat profile.
export default function Passage() {
  const { id: boatId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [boat, setBoat] = useState(null);
  const [trips, setTrips] = useState([]);
  // A saved passage being opened: remounting the planner with it as `initial`
  // loads the route and scores it straight away.
  const [opened, setOpened] = useState({ key: 0, trip: null });

  const loadTrips = useCallback(() => api.get(`/boats/${boatId}/trips`).then(res => setTrips(res.data)).catch(() => {}), [boatId]);
  useEffect(() => { loadTrips(); }, [loadTrips]);

  const openTrip = trip => setOpened(o => ({ key: o.key + 1, trip }));
  const saveTrip = async ({ name, id, waypoints, speedKn, crew }) => {
    const body = { name, waypoints, speedKn, crew };
    const { data } = id ? await api.put(`/boats/${boatId}/trips/${id}`, body) : await api.post(`/boats/${boatId}/trips`, body);
    setOpened(o => ({ ...o, trip: data })); // keep the planner as is; it now edits this saved passage
    loadTrips();
  };
  const deleteTrip = async trip => {
    await api.delete(`/boats/${boatId}/trips/${trip.id}`).catch(() => {});
    if (opened.trip?.id === trip.id) setOpened(o => ({ ...o, trip: null }));
    loadTrips();
  };

  useEffect(() => {
    api.get(`/boats/${boatId}`).then(res => setBoat(res.data)).catch(() => navigate('/dashboard'));
  }, [boatId, navigate]);

  const score = payload => api.post(`/boats/${boatId}/passage/score`, payload).then(res => res.data);
  const scoreWindow = payload => api.post(`/boats/${boatId}/passage/window`, payload).then(res => res.data);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <Link to={`/boats/${boatId}`} className="text-sm text-magenta hover:underline">← {boat?.name}</Link>
        <h1 className="text-3xl font-bold text-ink mt-1">{t('passage.title')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('passage.subtitle')}</p>
        <div className="mt-2"><HowItWorks /></div>
      </div>

      {boat && !(boat.loa_m && boat.displacement_kg && boat.hull_type && boat.keel_type) && (
        <div className="bg-band-uncomfortable/15 border border-band-uncomfortable/50 text-ink text-sm rounded-md px-4 py-3 flex flex-wrap gap-x-2">
          <span>{t('passage.boatIncomplete')}</span>
          <Link to={`/boats/${boatId}/edit`} className="underline font-medium">{t('passage.boatIncompleteLink')}</Link>
        </div>
      )}

      <SavedTrips trips={trips} activeId={opened.trip?.id} onOpen={openTrip} onDelete={deleteTrip} />

      <PassagePlanner
        key={opened.key}
        initial={opened.key > 0 && opened.trip ? { waypoints: opened.trip.waypoints, speed: opened.trip.speed_kn, crew: opened.trip.crew } : null}
        onSaveTrip={saveTrip}
        loadedTrip={opened.trip}
        storageKey={`passage:${boatId}`}
        score={score}
        scoreWindow={scoreWindow}
        shareBoat={boat && { name: boat.name, loa_m: boat.loa_m, displacement_kg: boat.displacement_kg, hull_type: boat.hull_type, keel_type: boat.keel_type }}
      />
    </div>
  );
}
