import { useState, useEffect, useRef, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MapPin } from 'lucide-react';
import api from '../../api/client';

// "Tau", "Skudeneshavn": find a place by name instead of hunting on the chart.
// Picking one hands it to `onPick` (the planner flies there and drops a point).
export default function PlaceSearch({ onPick, disabled = false }) {
  const { t } = useTranslation();
  const listId = useId();
  const [q, setQ] = useState('');
  const [places, setPlaces] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | loading | empty | error
  const reqId = useRef(0);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) { setPlaces([]); setStatus('idle'); return undefined; }
    const id = ++reqId.current;
    setStatus('loading');
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/places', { params: { q: query } });
        if (id !== reqId.current) return; // a newer search is on its way
        setPlaces(Array.isArray(data) ? data : []);
        setActive(0);
        setStatus(Array.isArray(data) && data.length ? 'idle' : 'empty');
      } catch {
        if (id === reqId.current) { setPlaces([]); setStatus('error'); }
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  const pick = p => {
    onPick(p);
    setQ('');
    setPlaces([]);
    setOpen(false);
  };

  const onKeyDown = e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(a => Math.min(a + 1, places.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && places[active]) { e.preventDefault(); pick(places[active]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  const showList = open && q.trim().length >= 2;

  return (
    <div className="relative">
      <label htmlFor={`${listId}-input`} className="sr-only">{t('passage.search.label')}</label>
      <Search size={16} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" aria-hidden="true" />
      <input
        id={`${listId}-input`}
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={`${listId}-list`}
        aria-activedescendant={showList && places[active] ? `${listId}-opt-${active}` : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        disabled={disabled}
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        placeholder={disabled ? t('passage.search.full') : t('passage.search.placeholder')}
        className="w-full border border-line rounded-lg pl-9 pr-3 py-2.5 text-sm text-ink bg-surface hover:border-ink-muted focus:outline-none focus:ring-2 focus:ring-magenta focus:border-transparent disabled:opacity-60"
      />
      {showList && (
        <ul id={`${listId}-list`} role="listbox" className="absolute z-[1000] left-0 right-0 mt-1 bg-surface border border-line rounded-lg shadow-panel overflow-hidden">
          {status === 'loading' && !places.length && <li className="px-3 py-2.5 text-sm text-ink-muted">{t('passage.search.loading')}</li>}
          {status === 'empty' && <li className="px-3 py-2.5 text-sm text-ink-muted">{t('passage.search.empty', { q: q.trim() })}</li>}
          {status === 'error' && <li className="px-3 py-2.5 text-sm text-ink-muted">{t('passage.search.error')}</li>}
          {places.map((p, i) => (
            <li
              key={`${p.name}-${p.lat}-${p.lon}`}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={e => { e.preventDefault(); pick(p); }}
              onMouseEnter={() => setActive(i)}
              className={`flex items-start gap-2.5 px-3 py-2 cursor-pointer ${i === active ? 'bg-shallow' : ''}`}
            >
              <MapPin size={16} strokeWidth={1.75} className="text-magenta shrink-0 mt-0.5" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink truncate">{p.name}</span>
                <span className="block text-xs text-ink-muted truncate">{[p.type, p.municipality].filter(Boolean).join(' · ')}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
