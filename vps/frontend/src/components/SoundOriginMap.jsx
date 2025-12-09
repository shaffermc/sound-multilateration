import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default function SoundOriginMap({ stations, hyperbolas, solution }) {
  // Compute map bounds to fit stations + solution
  const latitudes = stations.map(s => s.lat).concat(solution.lat);
  const longitudes = stations.map(s => s.lon).concat(solution.lon);
  const southWest = [Math.min(...latitudes), Math.min(...longitudes)];
  const northEast = [Math.max(...latitudes), Math.max(...longitudes)];
  const bounds = [southWest, northEast];

  return (
    <MapContainer bounds={bounds} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {/* Stations */}
      {stations.map((s, i) => (
        <Marker key={i} position={[s.lat, s.lon]}>
          <Tooltip direction="top" offset={[0, -10]} permanent>
            {`S${i + 1}`}
          </Tooltip>
        </Marker>
      ))}

      {/* Solution point */}
      <Marker position={[solution.lat, solution.lon]} icon={new L.Icon({
        iconUrl: require('./gold-star.png'),
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })}>
        <Tooltip direction="top" offset={[0, -10]} permanent>Origin</Tooltip>
      </Marker>

      {/* Hyperbolas */}
      {hyperbolas.map((hb, i) => (
        <Polyline
          key={i}
          positions={hb.points.map(p => [p.lat, p.lon])}
          color="red"
          weight={2}
        />
      ))}
    </MapContainer>
  );
}
