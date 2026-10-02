import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import 'leaflet/dist/leaflet.css';
import { bandColor } from './bands';
import { useFormat } from '../../i18n/format';

// Kartverket's open nautical chart tiles cover Norwegian waters; OSM underneath
// fills in everything else (Skagen, Sweden, open sea).
const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const SJOKART = 'https://cache.kartverket.no/v1/wmts/1.0.0/sjokartraster/default/webmercator/{z}/{y}/{x}.png';

// Default start view: Boknafjorden / Kvitsøy off Stavanger.
export const DEFAULT_CENTER = [59.05, 5.5];
export const DEFAULT_ZOOM = 11;

// Fit the view to a saved route once on mount, so a returning visitor sees
// their whole passage instead of the default view.
function FitOnce({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) map.fitBounds(points, { padding: [40, 40], maxZoom: 12 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Numbered waypoint you can drag; a hollow handle on each leg's midpoint that
// inserts a new waypoint there when tapped or dragged.
const waypointIcon = n => L.divIcon({ className: 'wp-icon', html: `<span>${n}</span>`, iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -14] });
const midIcon = L.divIcon({ className: 'wp-mid', html: '<span></span>', iconSize: [18, 18], iconAnchor: [9, 9] });

const toWp = latlng => ({ lat: latlng.lat, lon: latlng.lng });

function ClickHandler({ onClick }) {
  useMapEvents({ click: e => onClick({ lat: e.latlng.lat, lon: e.latlng.lng }) });
  return null;
}

export default function PassageMap({ waypoints, result, onAddWaypoint, onMoveWaypoint, onRemoveWaypoint, onInsertWaypoint, maxWaypoints = 12, center = DEFAULT_CENTER, zoom = DEFAULT_ZOOM, heightClass = 'h-80 sm:h-96', scrollWheelZoom = true }) {
  const { t } = useTranslation();
  const { num, time } = useFormat();
  const mapRef = useRef(null);
  const editable = !!onMoveWaypoint;
  const full = waypoints.length >= maxWaypoints;
  const hint = full ? t('passage.draw.full', { n: maxWaypoints })
    : waypoints.length === 0 ? t('passage.draw.start')
    : waypoints.length === 1 ? t('passage.draw.next')
    : !result && editable ? t('passage.draw.edit') : null;
  const path = waypoints.map(w => [w.lat, w.lon]);
  const legs = result?.legs ?? [];

  return (
    <div className="relative">
    <MapContainer ref={mapRef} center={center} zoom={zoom} className={`ps-map ${heightClass} w-full rounded-lg z-0`} scrollWheelZoom={scrollWheelZoom}>
      <TileLayer url={OSM} attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
      <TileLayer url={SJOKART} attribution='© <a href="https://www.kartverket.no">Kartverket</a>' opacity={0.9} />
      <ClickHandler onClick={onAddWaypoint} />
      <FitOnce points={path} />

      {/* Route: one grey line while planning, one coloured line per leg once scored */}
      {!result && path.length > 1 && <Polyline positions={path} pathOptions={{ color: '#b0186f', weight: 3, dashArray: '6 6' }} />}
      {result && legs.map(leg => (
        <Polyline
          key={leg.index}
          positions={[[leg.from.lat, leg.from.lon], [leg.to.lat, leg.to.lon]]}
          pathOptions={{ color: bandColor(leg.band), weight: 5, opacity: 0.9 }}
        />
      ))}

      {result?.samples?.filter(s => !s.noData).map((s, i) => (
        <CircleMarker key={i} center={[s.lat, s.lon]} radius={5} pathOptions={{ color: '#fff', weight: 1.5, fillColor: bandColor(s.band), fillOpacity: 1 }}>
          <Tooltip direction="top" offset={[0, -6]}>
            <span className="font-semibold">{num(s.score)}</span> · {time(s.time)}
            {s.wave && <> · {num(s.wave.hs)} m / {num(s.wave.tp, 0)} s</>}
          </Tooltip>
        </CircleMarker>
      ))}

      {editable && !full && waypoints.slice(1).map((w, i) => {
        const a = waypoints[i];
        const mid = [(a.lat + w.lat) / 2, (a.lon + w.lon) / 2];
        return (
          <Marker
            key={`mid-${i}-${a.lat}-${w.lat}`}
            position={mid}
            icon={midIcon}
            draggable
            title={t('passage.draw.insert')}
            eventHandlers={{
              click: () => onInsertWaypoint(i + 1, { lat: mid[0], lon: mid[1] }),
              dragend: e => onInsertWaypoint(i + 1, toWp(e.target.getLatLng())),
            }}
          />
        );
      })}

      {waypoints.map((w, i) => (
        editable ? (
          <Marker
            key={`wp-${i}`}
            position={[w.lat, w.lon]}
            icon={waypointIcon(i + 1)}
            draggable
            keyboard
            title={t('passage.draw.pointTitle', { n: i + 1 })}
            eventHandlers={{ dragend: e => onMoveWaypoint(i, toWp(e.target.getLatLng())) }}
          >
            <Popup closeButton={false} className="wp-popup">
              <button type="button" onClick={() => { mapRef.current?.closePopup(); onRemoveWaypoint(i); }} className="text-sm font-medium text-band-ashore hover:underline">
                {t('passage.draw.remove', { n: i + 1 })}
              </button>
            </Popup>
          </Marker>
        ) : (
          <CircleMarker key={`wp-${i}`} center={[w.lat, w.lon]} radius={9} pathOptions={{ color: '#fff', weight: 2, fillColor: '#b0186f', fillOpacity: 1 }}>
            <Tooltip permanent direction="center" className="wp-label">{i + 1}</Tooltip>
          </CircleMarker>
        )
      ))}
    </MapContainer>
    {hint && (
      <p className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-[400] max-w-[80%] text-center text-xs sm:text-sm font-medium bg-surface/95 text-ink border border-line rounded-full px-3.5 py-1.5 shadow-panel" role="status">
        {hint}
      </p>
    )}
    </div>
  );
}
