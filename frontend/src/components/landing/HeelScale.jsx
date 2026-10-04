import { useTranslation } from 'react-i18next';
import { bandColor } from '../passage/bands';
import { useFormat } from '../../i18n/format';

// Each band's name sits on its own waterline, and the worse the band, the
// harder that line lists: level at Blikkstille, eight degrees at Bli på land.
// All lines heel the same way, so each one falls away from the one above
// instead of into it. Hovering a line rolls it around that heel (`roll` either
// way, once every `period` seconds).
const HEEL = {
  flat: { rest: 0, roll: 0.4, period: 5 },
  comfortable: { rest: 1.4, roll: 1, period: 4.2 },
  uncomfortable: { rest: 3, roll: 1.8, period: 3.6 },
  bucket: { rest: 5, roll: 2.8, period: 3 },
  ashore: { rest: 8, roll: 4, period: 2.6 },
};

/**
 * The 0–10 scale as the front page's centrepiece.
 * @param {{band:string, score:number, kind:'example'|'shared'|'yours'}|null} marker
 *   the last scored passage; shown as a magenta buoy on its band's line
 * @param {() => void} onMarker jump to the full result
 */
export default function HeelScale({ marker, onMarker }) {
  const { t } = useTranslation();
  const { num } = useFormat();
  const bands = t('landing.bands', { returnObjects: true });
  if (!Array.isArray(bands)) return null;

  return (
    <ol className="kv-scale" aria-label={t('landing.scaleLabel')}>
      {bands.map(b => {
        const h = HEEL[b.band] ?? HEEL.flat;
        const here = marker?.band === b.band;
        return (
          <li
            key={b.band}
            className="kv-row"
            style={{ '--heel': `${h.rest}deg`, '--roll': `${h.roll}deg`, '--period': `${h.period}s`, '--band': bandColor(b.band) }}
          >
            <span className="kv-range">{b.range}</span>
            {/* Narrow screens heel the whole group; wide ones only the hull,
                with the description level in its own column. */}
            <div className="kv-tilt">
              <div className="kv-hull">
                <span className="kv-name">{t(`passage.band.${b.band}`)}</span>
                {here && (
                  <button type="button" className="kv-buoy" onClick={onMarker}>
                    {t(`landing.marker.${marker.kind}`)} <b>{num(marker.score)}</b>
                    <span className="sr-only">. {t('landing.marker.show')}</span>
                  </button>
                )}
              </div>
              <p className="kv-says">{b.p}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
