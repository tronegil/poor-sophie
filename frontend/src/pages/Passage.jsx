import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import PassagePlanner from '../components/passage/PassagePlanner';
import HowItWorks from '../components/passage/HowItWorks';

// Per-boat seasickness score: hull data comes from the boat profile.
export default function Passage() {
  const { id: boatId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [boat, setBoat] = useState(null);

  useEffect(() => {
    api.get(`/boats/${boatId}`).then(res => setBoat(res.data)).catch(() => navigate('/dashboard'));
  }, [boatId, navigate]);

  const score = payload => api.post(`/boats/${boatId}/passage/score`, payload).then(res => res.data);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <Link to={`/boats/${boatId}`} className="text-sm text-ocean-600 hover:underline">← {boat?.name}</Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-1">🤢 {t('passage.title')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('passage.subtitle')}</p>
        <div className="mt-2"><HowItWorks /></div>
      </div>

      {boat && !(boat.loa_m && boat.displacement_kg && boat.hull_type && boat.keel_type) && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3 flex flex-wrap gap-x-2">
          <span>{t('passage.boatIncomplete')}</span>
          <Link to={`/boats/${boatId}/edit`} className="underline font-medium">{t('passage.boatIncompleteLink')}</Link>
        </div>
      )}

      <PassagePlanner storageKey={`passage:${boatId}`} score={score} />
    </div>
  );
}
