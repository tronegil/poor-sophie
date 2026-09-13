import { useTranslation } from 'react-i18next';
import { BOAT_PRESETS, CUSTOM_ID } from './boatPresets';

// Boat-type dropdown with an "other boat" escape hatch that exposes the four
// hull fields the model uses. `value` = { presetId, loa_m, displacement_kg, hull_type, keel_type }.
export default function BoatPicker({ value, onChange, inputClass }) {
  const { t } = useTranslation();
  const isCustom = value.presetId === CUSTOM_ID;

  const pick = e => {
    const id = e.target.value;
    if (id === CUSTOM_ID) { onChange({ ...value, presetId: CUSTOM_ID }); return; }
    const p = BOAT_PRESETS.find(b => b.id === id);
    if (p) onChange({ presetId: id, name: p.name, loa_m: p.loa_m, displacement_kg: p.displacement_kg, hull_type: p.hull_type, keel_type: p.keel_type });
  };
  const set = field => e => onChange({ ...value, [field]: e.target.value, name: t('landing.customBoat') });

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">{t('landing.boat')}</label>
        <select value={value.presetId} onChange={pick} className={`${inputClass} w-full`}>
          {BOAT_PRESETS.map(b => <option key={b.id} value={b.id}>{b.name} · {b.loa_m} m</option>)}
          <option value={CUSTOM_ID}>{t('landing.customBoat')}…</option>
        </select>
      </div>
      {isCustom && (
        <div className="grid grid-cols-2 gap-2">
          <input type="number" step="0.1" min="3" max="60" value={value.loa_m ?? ''} onChange={set('loa_m')} className={inputClass} placeholder={t('boat.loa')} aria-label={t('boat.loa')} />
          <input type="number" step="50" min="200" value={value.displacement_kg ?? ''} onChange={set('displacement_kg')} className={inputClass} placeholder={t('boat.displacement')} aria-label={t('boat.displacement')} />
          <select value={value.hull_type ?? 'monohull'} onChange={set('hull_type')} className={inputClass} aria-label={t('boat.hullType')}>
            {['monohull', 'catamaran', 'trimaran'].map(h => <option key={h} value={h}>{t(`boat.hull.${h}`)}</option>)}
          </select>
          <select value={value.keel_type ?? 'fin'} onChange={set('keel_type')} className={inputClass} aria-label={t('boat.keelType')}>
            {['fin', 'long', 'bilge', 'lifting', 'centerboard'].map(k => <option key={k} value={k}>{t(`boat.keel.${k}`)}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
