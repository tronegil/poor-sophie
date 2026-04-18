import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

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
          <div className="text-5xl mb-3 select-none">⛵</div>
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
      <header className="bg-ocean-800 text-white py-3 px-4 text-center text-sm font-medium">
        ⛵ Poor Sophie
      </header>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-56 bg-ocean-100">
            {boat.photo_url ? (
              <img src={boat.photo_url} alt={boat.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl select-none">⛵</div>
            )}
          </div>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-800">{boat.name}</h1>
            {(boat.type || boat.year) && (
              <p className="text-slate-500 mt-1">
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
