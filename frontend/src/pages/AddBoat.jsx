import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import BoatForm from '../components/BoatForm';

export default function AddBoat() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    const res = await api.post('/boats', data);
    navigate(`/boats/${res.data.id}`);
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">{t('boat.addTitle')}</h1>
      <BoatForm onSubmit={handleSubmit} onCancel={() => navigate('/dashboard')} />
    </div>
  );
}
