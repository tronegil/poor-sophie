import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import AddItemModal from '../components/wiki/AddItemModal';
import { FileText, NotebookPen, Link2, PlayCircle, Play, X, Search, LayoutGrid, List, BookOpen } from 'lucide-react';

const TYPE_META = {
  pdf:     { icon: FileText,   bg: 'bg-shallow', text: 'text-ink', border: 'border-line' },
  text:    { icon: NotebookPen, bg: 'bg-shallow', text: 'text-ink', border: 'border-line' },
  url:     { icon: Link2,      bg: 'bg-shallow', text: 'text-ink', border: 'border-line' },
  youtube: { icon: PlayCircle, bg: 'bg-shallow', text: 'text-ink', border: 'border-line' },
};

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDomain(url) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
}

function openPdfBlob(fileData) {
  const base64 = fileData.replace(/^data:[^;]+;base64,/, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  window.open(URL.createObjectURL(blob), '_blank');
}

function YouTubeCard({ item, meta, onEdit, onDelete, t }) {
  const [playing, setPlaying] = useState(false);
  const thumb = `https://img.youtube.com/vi/${item.youtube_id}/hqdefault.jpg`;

  return (
    <div className="bg-surface rounded-md border border-line overflow-hidden hover:border-ink-muted transition-colors">
      <div className="relative cursor-pointer group" onClick={() => setPlaying(v => !v)}>
        {playing ? (
          <div className="aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${item.youtube_id}?autoplay=1`}
              title={item.title}
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ) : (
          <>
            <img src={thumb} alt={item.title} className="w-full aspect-video object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="w-12 h-12 bg-deep rounded-full flex items-center justify-center text-deep-on shadow-lg">
                <Play size={20} strokeWidth={2} fill="currentColor" aria-hidden="true" />
              </div>
            </div>
          </>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 leading-snug">{item.title}</h3>
        {item.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-400">{fmtDate(item.created_at)}</span>
          <ItemMenu item={item} onEdit={onEdit} onDelete={onDelete} t={t} />
        </div>
      </div>
    </div>
  );
}

function WikiItemCard({ item, onEdit, onDelete, onOpen, t }) {
  const meta = TYPE_META[item.type] || TYPE_META.url;

  if (item.type === 'youtube') {
    return <YouTubeCard item={item} meta={meta} onEdit={onEdit} onDelete={onDelete} t={t} />;
  }

  const handlePrimary = () => {
    if (item.type === 'url') window.open(item.url, '_blank', 'noopener,noreferrer');
    else onOpen(item);
  };

  return (
    <div className="bg-surface rounded-md border border-line overflow-hidden hover:border-ink-muted transition-colors">
      <div className={`px-4 py-2.5 flex items-center gap-2 ${meta.bg} border-b ${meta.border}`}>
        <meta.icon size={16} strokeWidth={1.75} aria-hidden="true" />
        <span className={`text-xs font-semibold ${meta.text}`}>{t(`wiki.types.${item.type}`)}</span>
        <div className="ml-auto flex items-center gap-2 min-w-0">
          {item.type === 'url' && (
            <span className="text-xs text-slate-400 truncate max-w-[140px]">{getDomain(item.url)}</span>
          )}
          {item.type === 'pdf' && item.file_size > 0 && (
            <span className="text-xs text-slate-400">{fmtSize(item.file_size)}</span>
          )}
          {item.type === 'text' && item.file_name && (
            <span className="text-xs text-slate-400 truncate max-w-[140px]">{item.file_name}</span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 leading-snug">{item.title}</h3>
        {item.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-400">{fmtDate(item.created_at)}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrimary}
              className="text-xs text-magenta hover:text-magenta-dark px-2.5 py-1 rounded-lg hover:bg-ocean-50 font-medium transition-colors"
            >
              {item.type === 'text' ? t('wiki.view') : t('wiki.open')}
            </button>
            <ItemMenu item={item} onEdit={onEdit} onDelete={onDelete} t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemMenu({ item, onEdit, onDelete, t }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 text-sm transition-colors"
      >
        ⋯
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 bottom-8 z-20 bg-surface rounded-md shadow-lg border border-line py-1 min-w-[110px]">
            <button
              onClick={() => { onEdit(item); setOpen(false); }}
              className="w-full text-left text-sm px-4 py-2 hover:bg-slate-50 text-slate-700"
            >
              {t('boat.edit')}
            </button>
            <button
              onClick={() => { onDelete(item); setOpen(false); }}
              className="w-full text-left text-sm px-4 py-2 hover:bg-band-ashore/10 text-band-ashore"
            >
              {t('boat.delete')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function TextViewer({ item, onClose, t }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface w-full sm:max-w-2xl sm:rounded-lg rounded-t-2xl shadow-xl max-h-[88vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-surface border-b border-line px-5 py-4 flex items-center justify-between rounded-t-2xl shrink-0">
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-800 truncate">{item.title}</h2>
            {item.file_name && <p className="text-xs text-slate-400 mt-0.5">{item.file_name}</p>}
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink p-1 ml-3 shrink-0" aria-label="Close"><X size={18} strokeWidth={2} aria-hidden="true" /></button>
        </div>
        <div className="overflow-y-auto p-5 flex-1">
          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed break-words">
            {item.file_data}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default function Wiki() {
  const { id: boatId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [boat, setBoat] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gridView, setGridView] = useState(true);
  const [modal, setModal] = useState(null);    // null | {} (new) | item (edit)
  const [viewing, setViewing] = useState(null); // full item with file_data for text
  const [openingId, setOpeningId] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/boats/${boatId}`),
      api.get(`/boats/${boatId}/wiki/items`),
    ])
      .then(([boatRes, itemsRes]) => {
        setBoat(boatRes.data);
        setItems(itemsRes.data);
      })
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [boatId, navigate]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      it => it.title.toLowerCase().includes(q) || (it.description || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const handleOpen = async (item) => {
    if (item.type === 'pdf' && item.url) {
      window.open(`/api/boats/${boatId}/wiki/items/${item.id}/pdf`, '_blank', 'noopener,noreferrer');
      return;
    }
    setOpeningId(item.id);
    try {
      const res = await api.get(`/boats/${boatId}/wiki/items/${item.id}`);
      if (item.type === 'pdf') {
        openPdfBlob(res.data.file_data);
      } else if (item.type === 'text') {
        setViewing(res.data);
      }
    } finally {
      setOpeningId(null);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(t('wiki.form.confirmDelete'))) return;
    await api.delete(`/boats/${boatId}/wiki/items/${item.id}`);
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  const handleSaved = (item, isEdit) => {
    if (isEdit) {
      setItems(prev => prev.map(i => i.id === item.id ? item : i));
    } else {
      setItems(prev => [item, ...prev]);
    }
    setModal(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link to={`/boats/${boatId}`} className="text-sm text-magenta hover:underline">
            ← {boat?.name}
          </Link>
          <h1 className="text-3xl font-bold text-ink mt-1">{t('wiki.title')}</h1>
        </div>
        <button
          onClick={() => setModal({})}
          className="mt-1 bg-deep text-deep-on px-4 py-2 rounded-lg text-sm font-medium hover:bg-deep-hover transition-colors flex items-center gap-1.5 shrink-0"
        >
          <span>+</span>
          {t('wiki.addItem')}
        </button>
      </div>

      {/* Search + view toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('wiki.searchPlaceholder')}
            className="w-full border border-slate-200 rounded-md pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-magenta bg-surface"
          />
        </div>
        <div className="flex border border-slate-200 rounded-md overflow-hidden bg-surface">
          <button
            onClick={() => setGridView(true)}
            className={`px-3 py-2.5 text-sm transition-colors ${gridView ? 'bg-deep text-deep-on' : 'text-slate-500 hover:bg-slate-50'}`}
            title={t('wiki.viewGrid')}
          >
            <LayoutGrid size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            onClick={() => setGridView(false)}
            className={`px-3 py-2.5 text-sm transition-colors ${!gridView ? 'bg-deep text-deep-on' : 'text-slate-500 hover:bg-slate-50'}`}
            title={t('wiki.viewList')}
          >
            <List size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <BookOpen size={40} strokeWidth={1.5} className="mx-auto mb-3 text-ocean-400" aria-hidden="true" />
          <p className="font-medium">{search ? t('wiki.emptySearch') : t('wiki.empty')}</p>
          {!search && (
            <button
              onClick={() => setModal({})}
              className="mt-3 text-magenta hover:underline text-sm"
            >
              {t('wiki.emptyHint')}
            </button>
          )}
        </div>
      ) : gridView ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(item => (
            <WikiItemCard
              key={item.id}
              item={item}
              onEdit={() => setModal(item)}
              onDelete={handleDelete}
              onOpen={handleOpen}
              t={t}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <ListItem
              key={item.id}
              item={item}
              onEdit={() => setModal(item)}
              onDelete={handleDelete}
              onOpen={handleOpen}
              openingId={openingId}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modal !== null && (
        <AddItemModal
          boatId={boatId}
          item={modal?.id ? modal : null}
          onSave={handleSaved}
          onClose={() => setModal(null)}
          t={t}
        />
      )}
      {viewing && (
        <TextViewer item={viewing} onClose={() => setViewing(null)} t={t} />
      )}
    </div>
  );
}

function ListItem({ item, onEdit, onDelete, onOpen, openingId, t }) {
  const meta = TYPE_META[item.type] || TYPE_META.url;
  const loading = openingId === item.id;

  const handlePrimary = () => {
    if (item.type === 'url') window.open(item.url, '_blank', 'noopener,noreferrer');
    else if (item.type === 'youtube') window.open(`https://www.youtube.com/watch?v=${item.youtube_id}`, '_blank', 'noopener,noreferrer');
    else onOpen(item);
  };

  return (
    <div className="bg-surface rounded-md border border-line p-4 flex items-center gap-4 hover:border-ink-muted transition-colors">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${meta.bg}`}>
        <meta.icon size={18} strokeWidth={1.75} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-slate-800 truncate">{item.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${meta.bg} ${meta.text} font-medium shrink-0`}>
            {t(`wiki.types.${item.type}`)}
          </span>
        </div>
        {item.description && (
          <p className="text-sm text-slate-500 mt-0.5 truncate">{item.description}</p>
        )}
        <p className="text-xs text-slate-400 mt-0.5">{fmtDate(item.created_at)}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handlePrimary}
          disabled={loading}
          className="text-xs text-magenta hover:text-magenta-dark px-3 py-1.5 rounded-lg hover:bg-ocean-50 font-medium transition-colors disabled:opacity-50"
        >
          {loading ? '…' : item.type === 'text' ? t('wiki.view') : t('wiki.open')}
        </button>
        <ItemMenu item={item} onEdit={onEdit} onDelete={onDelete} t={t} />
      </div>
    </div>
  );
}
