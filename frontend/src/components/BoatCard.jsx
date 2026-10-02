import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ChartTile from './brand/ChartTile';

export default function BoatCard({ boat }) {
  const { t } = useTranslation();

  return (
    <Link
      to={`/boats/${boat.id}`}
      className="block bg-surface rounded-lg border border-line overflow-hidden hover:border-ink-muted transition-colors"
    >
      <div className="aspect-video bg-land overflow-hidden">
        {boat.photo_url ? (
          <img
            src={boat.photo_url}
            alt={boat.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <ChartTile seed={boat.id} className="w-full h-full" />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-ink truncate">{boat.name}</h3>
            {(boat.type || boat.year) && (
              <p className="data text-sm text-ink-muted mt-0.5">
                {[boat.type, boat.year].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <span className={`shrink-0 font-mono text-[11px] uppercase tracking-wider px-1.5 py-1 rounded border ${
            boat.is_public
              ? 'border-magenta text-magenta'
              : 'border-line text-ink-muted'
          }`}>
            {boat.is_public ? t('dashboard.public') : t('dashboard.private')}
          </span>
        </div>
        {boat.description && (
          <p className="text-sm text-ink-muted mt-2 line-clamp-2">{boat.description}</p>
        )}
      </div>
    </Link>
  );
}
