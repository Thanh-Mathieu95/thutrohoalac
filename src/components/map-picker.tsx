'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon path issue in Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}

function MapClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPicker({ latitude, longitude, onChange }: MapPickerProps) {
  const position: [number, number] = [latitude || 21.0125, longitude || 105.5269];

  // Cast React-Leaflet components to any to bypass type definition discrepancies in React 19 / React-Leaflet 5
  const LMapContainer = MapContainer as any;
  const LTileLayer = TileLayer as any;
  const LMarker = Marker as any;

  return (
    <div className="w-full h-full relative z-10">
      <LMapContainer
        center={position}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full cursor-crosshair"
      >
        <LTileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onChange={onChange} />
        <LMarker position={position} icon={defaultIcon} />
      </LMapContainer>
    </div>
  );
}
