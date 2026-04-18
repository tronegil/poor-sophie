import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import BoatForm from '../components/BoatForm';

export default function EditBoat() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [boat, setBoat] = useState(null);

  useEffect(() => {
    api.get(`/boats/${id}`)
      .then(res => setBoat(res.data))
      .catch(() => navigate('/dashboard'));
  }, [id, navigate]);

  const handleSubmit = async (data) => {
    await api.put(`/boats/${id}`, data);
    navigate(`/boats/${id}`);
  };

  if (!boat) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">{t('boat.editTitle')}</h1>
      <BoatForm
        initialData={boat}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/boats/${id}`)}
      />
    </div>
  );
}
