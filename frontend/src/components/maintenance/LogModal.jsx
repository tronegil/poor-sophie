import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';

async function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        let { width, height } = img;
        const ratio = Math.min(MAX / width, MAX / height, 1);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function PhotoSection({ category, label, existingPhotos, newPhotos, onAddPhotos, onRemoveNew, onRemoveExisting }) {
  const inputRef = useRef();

  const handleFiles = async (files) => {
    const compressed = await Promise.all(Array.from(files).map(compressImage));
    onAddPhotos(compressed.map(data => ({ data, category })));
  };

  return (
    <div>
      <p className="text-xs font-medium text-slate-600 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-2">
        {existingPhotos.map(p => (
          <div key={p.id} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
            <img src={p.data} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemoveExisting(p.id)}
              className="absolute inset-0 bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ))}
        {newPhotos.map((p, i) => (
          <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-ocean-200 bg-ocean-50">
            <img src={p.data} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemoveNew(i)}
              className="absolute inset-0 bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 hover:border-ocean-400 hover:bg-ocean-50 transition-colors flex items-center justify-center text-slate-400 hover:text-ocean-500 text-xl"
        >
          +
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}

export default function LogModal({ boatId, task, log, lang, onSave, onDelete, onClose, t }) {
  const isEdit = Boolean(log);
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [cost, setCost] = useState('');
  const [existingPhotos, setExistingPhotos] = useState({ job: [], receipt: [] });
  const [newPhotos, setNewPhotos] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const taskName = lang === 'no' ? task.name_no : task.name_en;

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/boats/${boatId}/maintenance/logs/${log.id}`)
      .then(res => {
        const l = res.data;
        setDate(l.completed_date?.split('T')[0] || today);
        setNotes(l.notes || '');
        setCost(l.cost_nok != null ? String(l.cost_nok) : '');
        const jobPhotos = (l.photos || []).filter(p => p.category === 'job');
        const receiptPhotos = (l.photos || []).filter(p => p.category === 'receipt');
        setExistingPhotos({ job: jobPhotos, receipt: receiptPhotos });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRemoveExisting = async (photoId, category) => {
    await api.delete(`/boats/${boatId}/maintenance/logs/${log.id}/photos/${photoId}`);
    setExistingPhotos(prev => ({
      ...prev,
      [category]: prev[category].filter(p => p.id !== photoId),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        const updated = await api.put(`/boats/${boatId}/maintenance/logs/${log.id}`, {
          completed_date: date,
          notes: notes || null,
          cost_nok: cost ? parseFloat(cost) : null,
        });
        for (const p of newPhotos) {
          await api.post(`/boats/${boatId}/maintenance/logs/${log.id}/photos`, p);
        }
        onSave(updated.data, true);
      } else {
        const res = await api.post(`/boats/${boatId}/maintenance/logs`, {
          task_id: task.id,
          completed_date: date,
          notes: notes || null,
          cost_nok: cost ? parseFloat(cost) : null,
          photos: newPhotos,
        });
        onSave(res.data, false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('maintenance.log.confirmDelete'))) return;
    await api.delete(`/boats/${boatId}/maintenance/logs/${log.id}`);
    onDelete(log.id);
  };

  const newJobPhotos = newPhotos.filter(p => p.category === 'job');
  const newReceiptPhotos = newPhotos.filter(p => p.category === 'receipt');

  const addNewPhotos = (photos) => setNewPhotos(prev => [...prev, ...photos]);
  const removeNewPhoto = (category, idx) => {
    const catPhotos = newPhotos.filter(p => p.category === category);
    const target = catPhotos[idx];
    setNewPhotos(prev => {
      let found = false;
      return prev.filter(p => {
        if (!found && p === target) { found = true; return false; }
        return true;
      });
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="font-semibold text-slate-800">
              {isEdit ? t('maintenance.log.editTitle') : t('maintenance.log.title')}
            </h2>
            <p className="text-sm text-ocean-600 mt-0.5">{taskName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none p-1">✕</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ocean-600" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('maintenance.log.date')}</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('maintenance.log.cost')}</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">kr</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('maintenance.log.notes')}</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none"
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{t('maintenance.log.jobPhotos')}</p>
              <PhotoSection
                category="job"
                label={t('maintenance.log.jobPhotos')}
                existingPhotos={existingPhotos.job}
                newPhotos={newJobPhotos}
                onAddPhotos={addNewPhotos}
                onRemoveNew={idx => removeNewPhoto('job', idx)}
                onRemoveExisting={id => handleRemoveExisting(id, 'job')}
              />
              <PhotoSection
                category="receipt"
                label={t('maintenance.log.receipts')}
                existingPhotos={existingPhotos.receipt}
                newPhotos={newReceiptPhotos}
                onAddPhotos={addNewPhotos}
                onRemoveNew={idx => removeNewPhoto('receipt', idx)}
                onRemoveExisting={id => handleRemoveExisting(id, 'receipt')}
              />
            </div>

            <div className="flex gap-2 pt-2 pb-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-ocean-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-ocean-700 disabled:opacity-60 transition-colors"
              >
                {saving ? t('maintenance.log.saving') : t('maintenance.log.save')}
              </button>
              {isEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  {t('maintenance.log.delete')}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
