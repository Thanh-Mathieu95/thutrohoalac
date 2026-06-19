'use client';

import React from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface AreaMapProps {
  latitude: number;
  longitude: number;
}

export default function AreaMap({ latitude, longitude }: AreaMapProps) {
  const position: [number, number] = [latitude, longitude];

  // Cast React-Leaflet components to any to bypass type definition discrepancies in React 19 / React-Leaflet 5
  const LMapContainer = MapContainer as any;
  const LTileLayer = TileLayer as any;
  const LCircle = Circle as any;

  return (
    <div className="w-full h-full relative z-10">
      <LMapContainer
        center={position}
        zoom={16}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <LTileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Render a large circular zone representing the general area (radius: 150m) */}
        <LCircle
          center={position}
          radius={150}
          pathOptions={{
            color: '#0075de',
            fillColor: '#0075de',
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '4, 4'
          }}
        />
      </LMapContainer>
    </div>
  );
}
