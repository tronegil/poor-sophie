import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Wrench, BookOpen, Compass, Waves } from 'lucide-react';
import ChartTile from '../components/brand/ChartTile';

export default function BoatProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [boat, setBoat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get(`/boats/${id}`)
      .then(res => setBoat(res.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!window.confirm(t('boat.confirmDelete'))) return;
    await api.delete(`/boats/${id}`);
    navigate('/dashboard');
  };

  const copyPublicLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/boats/public/${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600" />
      </div>
    );
  }
  if (!boat) return null;

  const isOwner = user?.id === boat.user_id;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-surface rounded-lg border border-line overflow-hidden">
        <div className="h-56 bg-land">
          {boat.photo_url ? (
            <img src={boat.photo_url} alt={boat.name} className="w-full h-full object-cover" />
          ) : (
            <ChartTile seed={boat.id} className="w-full h-full" />
          )}
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-ink truncate">{boat.name}</h1>
              {(boat.type || boat.year) && (
                <p className="data text-sm text-ink-muted mt-1">
                  {[boat.type, boat.year].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <span className={`shrink-0 font-mono text-[11px] uppercase tracking-wider px-1.5 py-1 rounded ${
              boat.is_public ? 'border border-magenta text-magenta' : 'border border-line text-ink-muted'
            }`}>
              {boat.is_public ? t('dashboard.public') : t('dashboard.private')}
            </span>
          </div>

          {boat.description && (
            <p className="text-slate-600 leading-relaxed mb-6">{boat.description}</p>
          )}

          {isOwner && (
            <div className="flex flex-wrap gap-3 pt-4 border-t border-line">
              <Link
                to={`/boats/${id}/maintenance`}
                className="border border-line bg-surface text-ink px-4 py-2 rounded-lg text-sm font-medium hover:bg-shallow hover:border-shallow transition-colors flex items-center gap-1.5"
              >
                <Wrench size={16} strokeWidth={1.75} aria-hidden="true" />
                {t('maintenance.title')}
              </Link>
              <Link
                to={`/boats/${id}/wiki`}
                className="border border-line bg-surface text-ink px-4 py-2 rounded-lg text-sm font-medium hover:bg-shallow hover:border-shallow transition-colors flex items-center gap-1.5"
              >
                <BookOpen size={16} strokeWidth={1.75} aria-hidden="true" />
                {t('wiki.title')}
              </Link>
              <Link
                to={`/boats/${id}/chat`}
                className="border border-line bg-surface text-ink px-4 py-2 rounded-lg text-sm font-medium hover:bg-shallow hover:border-shallow transition-colors flex items-center gap-1.5"
              >
                <Compass size={16} strokeWidth={1.75} aria-hidden="true" />
                {t('chat.title')}
              </Link>
              <Link
                to={`/boats/${id}/passage`}
                className="border border-line bg-surface text-ink px-4 py-2 rounded-lg text-sm font-medium hover:bg-shallow hover:border-shallow transition-colors flex items-center gap-1.5"
              >
                <Waves size={16} strokeWidth={1.75} aria-hidden="true" />
                {t('boat.passage')}
              </Link>
              <Link
                to={`/boats/${id}/edit`}
                className="border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                {t('boat.edit')}
              </Link>
              {boat.is_public && (
                <button
                  onClick={copyPublicLink}
                  className="border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  {copied ? t('boat.linkCopied') : t('boat.copyLink')}
                </button>
              )}
              <button
                onClick={handleDelete}
                className="ml-auto text-band-ashore px-4 py-2 rounded-lg text-sm font-medium hover:bg-band-ashore/10 transition-colors"
              >
                {t('boat.delete')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
