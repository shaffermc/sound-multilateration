import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function SoundOriginMap({ tdoaData }) {
  if (!tdoaData) return <div style={{ flex:1, textAlign:'center', padding:'20px' }}>No data yet</div>;

  const stations = tdoaData.station_coords;
  const origin = tdoaData.origin_solution;
  const hyperbolas = tdoaData.hyperbolas;

  const center = origin || stations[0] || { lat: 0, lon: 0 };

  return (
    <div style={{ flex: 1, height: '600px' }}>
      <MapContainer center={[center.lat, center.lon]} zoom={16} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Station markers */}
        {stations.map((s,i) => <Marker key={i} position={[s.lat, s.lon]} />)}

        {/* Origin solution */}
        {origin && <Marker position={[origin.lat, origin.lon]} />}

        {/* Hyperbolas */}
        {hyperbolas.map((h,i) => {
          const positions = h.points.map(p => [p.lat, p.lon]);
          return <Polyline key={i} positions={positions} color="red" />;
        })}
      </MapContainer>
    </div>
  );
}

export default SoundOriginMap;
