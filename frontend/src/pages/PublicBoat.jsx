import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Wordmark from '../components/brand/Wordmark';
import ChartTile from '../components/brand/ChartTile';

export default function PublicBoat() {
  const { id } = useParams();
  const [boat, setBoat] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/boats/${id}`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setBoat)
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center text-slate-500">
          <ChartTile seed="private" className="w-40 h-24 mx-auto mb-4 rounded-lg" />
          <p>This boat profile is private or doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (!boat) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-deep text-deep-on h-14 px-4 flex items-center justify-center">
        <Wordmark className="text-xl" />
      </header>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-surface rounded-lg border border-line overflow-hidden">
          <div className="h-56 bg-land">
            {boat.photo_url ? (
              <img src={boat.photo_url} alt={boat.name} className="w-full h-full object-cover" />
            ) : (
              <ChartTile seed={boat.id} className="w-full h-full" />
            )}
          </div>
          <div className="p-6">
            <h1 className="text-3xl font-bold text-ink">{boat.name}</h1>
            {(boat.type || boat.year) && (
              <p className="data text-sm text-ink-muted mt-1">
                {[boat.type, boat.year].filter(Boolean).join(' · ')}
              </p>
            )}
            {boat.description && (
              <p className="text-slate-600 mt-4 leading-relaxed">{boat.description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
