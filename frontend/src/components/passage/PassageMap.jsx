import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import 'leaflet/dist/leaflet.css';
import { bandColor } from './bands';
import { useFormat } from '../../i18n/format';
import { roleOf } from './routeEdit';

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

// Markers say what each point is: Fra (start), Til (destination) as labelled
// pins, via points as small numbered dots. All can be dragged.
const endIcon = (label, role) => L.divIcon({ className: `wp-pin wp-pin-${role}`, html: `<span>${label}</span>`, iconSize: [44, 24], iconAnchor: [22, 12], popupAnchor: [0, -14] });
const viaIcon = n => L.divIcon({ className: 'wp-icon', html: `<span>${n}</span>`, iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -12] });

const toWp = latlng => ({ lat: latlng.lat, lon: latlng.lng });

// Fly to a searched place; `focus.seq` changes on every pick so picking the
// same place twice still moves the map.
function FlyTo({ focus }) {
  const map = useMap();
  useEffect(() => {
    if (!focus) return;
    if (focus.bounds) map.flyToBounds(focus.bounds, { padding: [50, 50], maxZoom: 12, duration: 0.8 });
    else map.flyTo([focus.lat, focus.lon], Math.max(map.getZoom(), 12), { duration: 0.8 });
  }, [focus?.seq]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function ClickHandler({ onClick }) {
  useMapEvents({ click: e => onClick({ lat: e.latlng.lat, lon: e.latlng.lng }) });
  return null;
}

export default function PassageMap({ waypoints, result, onAddWaypoint, onMoveWaypoint, onRemoveWaypoint, maxWaypoints = 12, focus = null, center = DEFAULT_CENTER, zoom = DEFAULT_ZOOM, heightClass = 'h-80 sm:h-96', scrollWheelZoom = true }) {
  const { t } = useTranslation();
  const { num, time } = useFormat();
  const mapRef = useRef(null);
  const editable = !!onMoveWaypoint;
  const full = waypoints.length >= maxWaypoints;
  const hint = waypoints.length === 0 ? t('passage.draw.start')
    : waypoints.length === 1 ? t('passage.draw.next')
    : full ? t('passage.draw.full', { n: maxWaypoints })
    : !result && editable ? t('passage.draw.edit') : null;
  const stopName = i => {
    const role = roleOf(i, waypoints.length);
    return role === 'via' ? t('passage.stops.viaN', { n: i }) : t(`passage.stops.${role}`);
  };
  const iconFor = i => {
    const role = roleOf(i, waypoints.length);
    return role === 'via' ? viaIcon(i) : endIcon(t(`passage.stops.${role}`), role);
  };
  const path = waypoints.map(w => [w.lat, w.lon]);
  const legs = result?.legs ?? [];

  return (
    <div className="relative">
    <MapContainer ref={mapRef} center={center} zoom={zoom} className={`ps-map ${heightClass} w-full rounded-lg z-0`} scrollWheelZoom={scrollWheelZoom}>
      <TileLayer url={OSM} attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
      <TileLayer url={SJOKART} attribution='© <a href="https://www.kartverket.no">Kartverket</a>' opacity={0.9} />
      {editable && <ClickHandler onClick={p => { if (!full) onAddWaypoint(p); }} />}
      <FitOnce points={path} />
      <FlyTo focus={focus} />

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

      {waypoints.map((w, i) => (
        editable ? (
          <Marker
            key={`wp-${i}`}
            position={[w.lat, w.lon]}
            icon={iconFor(i)}
            draggable
            keyboard
            zIndexOffset={roleOf(i, waypoints.length) === 'via' ? 0 : 500}
            title={t('passage.draw.pointTitle', { what: stopName(i) })}
            eventHandlers={{ dragend: e => onMoveWaypoint(i, toWp(e.target.getLatLng())) }}
          >
            <Popup closeButton={false} className="wp-popup">
              <button type="button" onClick={() => { mapRef.current?.closePopup(); onRemoveWaypoint(i); }} className="text-sm font-medium text-band-ashore hover:underline">
                {t('passage.stops.remove', { what: stopName(i) })}
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
