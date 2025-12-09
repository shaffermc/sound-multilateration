import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Generate a sample hyperbola y = 1/x
const generateHyperbolaPoints = (center, scale = 0.001, count = 1000) => {
  const points = [];
  for (let i = -count; i <= count; i++) {
    if (i === 0) continue; // avoid division by zero
    const lat = center[0] + scale * (1 / i);
    const lng = center[1] + scale * i;
    points.push([lat, lng]);
  }
  return points;
};

const SatelliteMap = ({ center = [38.836902, -77.3827], zoom = 13 }) => {
  const hyperbolaPoints = generateHyperbolaPoints(center);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution='Tiles &copy; <a href="https://www.esri.com/">ESRI</a>'
      />
      <Marker position={center}>
        <Popup>This is the default marker.</Popup>
      </Marker>

      {/* Plot hyperbola as a polyline */}
      <Polyline positions={hyperbolaPoints} color="red" weight={2} />
    </MapContainer>
  );
};

export default SatelliteMap;
