import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function BoatCard({ boat }) {
  const { t } = useTranslation();

  return (
    <Link
      to={`/boats/${boat.id}`}
      className="block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="h-40 bg-ocean-100 overflow-hidden">
        {boat.photo_url ? (
          <img
            src={boat.photo_url}
            alt={boat.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl select-none">
            ⛵
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-800 truncate">{boat.name}</h3>
            {(boat.type || boat.year) && (
              <p className="text-sm text-slate-500 mt-0.5">
                {[boat.type, boat.year].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
            boat.is_public
              ? 'bg-green-100 text-green-700'
              : 'bg-slate-100 text-slate-500'
          }`}>
            {boat.is_public ? t('dashboard.public') : t('dashboard.private')}
          </span>
        </div>
        {boat.description && (
          <p className="text-sm text-slate-600 mt-2 line-clamp-2">{boat.description}</p>
        )}
      </div>
    </Link>
  );
}
