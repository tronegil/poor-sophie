import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { Plus } from 'lucide-react';
import BoatCard from '../components/BoatCard';
import ChartTile from '../components/brand/ChartTile';

export default function Dashboard() {
  const { t } = useTranslation();
  const [boats, setBoats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/boats')
      .then(res => setBoats(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-ink">{t('dashboard.myBoats')}</h1>
        <Link
          to="/boats/new"
          className="bg-deep text-deep-on px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-deep-hover transition-colors flex items-center gap-1.5"
        >
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          {t('dashboard.addBoat')}
        </Link>
      </div>

      {boats.length === 0 ? (
        <div className="text-center py-20 text-ink-muted">
          <ChartTile seed="empty" className="w-48 h-28 mx-auto mb-6 rounded-lg" />
          <p className="mb-4">{t('dashboard.noBoats')}</p>
          <Link to="/boats/new" className="text-magenta font-medium hover:underline">
            {t('dashboard.addFirst')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {boats.map(boat => <BoatCard key={boat.id} boat={boat} />)}
        </div>
      )}
    </div>
  );
}
