import { useTranslation } from 'react-i18next';
import { bandColor, BAND_HEEL } from '../passage/bands';
import { useFormat } from '../../i18n/format';

// Each band's name sits on its own waterline, heeled by BAND_HEEL (level at
// Blikkstille, eight degrees at Bli på land, all the same way so each line
// falls away from the one above). Hovering a line rolls it around that heel.

/**
 * The 0–10 scale as the front page's centrepiece.
 * @param {{band:string, score:number, kind:'example'|'shared'|'yours', saved?:boolean}|null} marker
 *   the last scored passage; shown as a magenta buoy on its band's line,
 *   outlined when it is a saved result from an earlier visit
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
        const h = BAND_HEEL[b.band] ?? BAND_HEEL.flat;
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
                  <button type="button" className={`kv-buoy${marker.saved ? ' kv-buoy-saved' : ''}`} onClick={onMarker}>
                    {t(`landing.marker.${marker.kind}`)} <b>{num(marker.score)}</b>
                    <span className="sr-only">. {marker.saved && `${t('landing.marker.saved')}. `}{t('landing.marker.show')}</span>
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
