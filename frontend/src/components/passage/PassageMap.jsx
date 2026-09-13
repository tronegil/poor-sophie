import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { bandColor } from './bands';

// Kartverket's open nautical chart tiles cover Norwegian waters; OSM underneath
// fills in everything else (Skagen, Sweden, open sea).
const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const SJOKART = 'https://cache.kartverket.no/v1/wmts/1.0.0/sjokartraster/default/webmercator/{z}/{y}/{x}.png';

function ClickHandler({ onClick }) {
  useMapEvents({ click: e => onClick({ lat: e.latlng.lat, lon: e.latlng.lng }) });
  return null;
}

export default function PassageMap({ waypoints, result, onAddWaypoint, center = [59.0, 10.4], zoom = 8, heightClass = 'h-80 sm:h-96', scrollWheelZoom = true }) {
  const path = waypoints.map(w => [w.lat, w.lon]);
  const legs = result?.legs ?? [];

  return (
    <MapContainer center={center} zoom={zoom} className={`${heightClass} w-full rounded-2xl z-0`} scrollWheelZoom={scrollWheelZoom}>
      <TileLayer url={OSM} attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
      <TileLayer url={SJOKART} attribution='© <a href="https://www.kartverket.no">Kartverket</a>' opacity={0.9} />
      <ClickHandler onClick={onAddWaypoint} />

      {/* Route: one grey line while planning, one coloured line per leg once scored */}
      {!result && path.length > 1 && <Polyline positions={path} pathOptions={{ color: '#0369a1', weight: 3, dashArray: '6 6' }} />}
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
            <span className="font-semibold">{s.score}</span> · {new Date(s.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {s.wave && <> · {s.wave.hs?.toFixed(1)} m / {s.wave.tp?.toFixed(0)} s</>}
          </Tooltip>
        </CircleMarker>
      ))}

      {waypoints.map((w, i) => (
        <CircleMarker key={`wp-${i}`} center={[w.lat, w.lon]} radius={9} pathOptions={{ color: '#fff', weight: 2, fillColor: '#0c4a6e', fillOpacity: 1 }}>
          <Tooltip permanent direction="center" className="wp-label">{i + 1}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
