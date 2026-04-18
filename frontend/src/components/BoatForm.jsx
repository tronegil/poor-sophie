import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function BoatForm({ initialData = {}, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name:        initialData.name        ?? '',
    type:        initialData.type        ?? '',
    year:        initialData.year        ?? '',
    description: initialData.description ?? '',
    photo_url:   initialData.photo_url   ?? '',
    is_public:   initialData.is_public   ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError(t('errors.nameRequired')); return; }
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        ...form,
        year: form.year ? parseInt(form.year, 10) : null,
        photo_url: form.photo_url.trim() || null,
      });
    } catch {
      setError(t('errors.generic'));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent';

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {t('boat.name')} *
        </label>
        <input
          type="text"
          value={form.name}
          onChange={set('name')}
          className={inputClass}
          placeholder="Miss Sophie"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('boat.type')}</label>
          <input
            type="text"
            value={form.type}
            onChange={set('type')}
            className={inputClass}
            placeholder="Sloop, Ketch…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('boat.year')}</label>
          <input
            type="number"
            value={form.year}
            onChange={set('year')}
            className={inputClass}
            placeholder="1985"
            min="1800"
            max={new Date().getFullYear()}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t('boat.description')}</label>
        <textarea
          value={form.description}
          onChange={set('description')}
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t('boat.photoUrl')}</label>
        <input
          type="url"
          value={form.photo_url}
          onChange={set('photo_url')}
          className={inputClass}
          placeholder="https://…"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_public}
          onChange={set('is_public')}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-ocean-600 focus:ring-ocean-500"
        />
        <span className="text-sm text-slate-700">
          {form.is_public ? t('boat.public') : t('boat.private')}
        </span>
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-ocean-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-ocean-700 disabled:opacity-50 transition-colors"
        >
          {saving ? t('boat.saving') : t('boat.save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          {t('boat.cancel')}
        </button>
      </div>
    </form>
  );
}
