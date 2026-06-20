'use client';

import React from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation, Compass } from 'lucide-react';

interface AreaMapProps {
  latitude: number;
  longitude: number;
}

const CAMPUSES = [
  { name: 'Đại học FPT Hòa Lạc', lat: 21.0128, lng: 105.5262, short: 'FPT', color: '#ff6b35' },
  { name: 'Đại học Quốc gia HN (VNU)', lat: 21.0375, lng: 105.5034, short: 'VNU', color: '#2ec4b6' },
  { name: 'TH School Hòa Lạc', lat: 21.0261, lng: 105.5230, short: 'THS', color: '#e71d36' }
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function AreaMap({ latitude, longitude }: AreaMapProps) {
  const housePosition: [number, number] = [latitude, longitude];

  // Cast React-Leaflet components to any to bypass type definition discrepancies in React 19 / React-Leaflet 5
  const LMapContainer = MapContainer as any;
  const LTileLayer = TileLayer as any;
  const LCircle = Circle as any;
  const LMarker = Marker as any;
  const LPopup = Popup as any;

  // Calculate distances to all campuses
  const distances = CAMPUSES.map(campus => {
    const dist = calculateDistance(latitude, longitude, campus.lat, campus.lng);
    const walkTime = Math.round((dist / 5) * 60); // 5 km/h walking speed
    const motoTime = Math.round((dist / 35) * 60); // 35 km/h motorcycle speed
    return {
      ...campus,
      distance: dist,
      walkTime: walkTime < 1 ? 1 : walkTime,
      motoTime: motoTime < 1 ? 1 : motoTime
    };
  });

  // Custom icon generators
  const getHouseIcon = () => {
    if (typeof window === 'undefined') return null as any;
    return L.divIcon({
      className: 'custom-house-marker',
      html: `<div style="background-color: #0075de; color: white; width: 36px; height: 36px; border-radius: 50%; border: 3.5px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,117,222,0.45);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  };

  const getCampusIcon = (short: string, color: string) => {
    if (typeof window === 'undefined') return null as any;
    return L.divIcon({
      className: 'custom-campus-marker',
      html: `<div style="background-color: ${color}; color: white; width: 32px; height: 32px; border-radius: 50%; border: 2.5px solid white; display: flex; align-items: center; justify-content: center; font-family: system-ui, sans-serif; font-weight: 900; font-size: 8.5px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">${short}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-50/50 p-5 rounded-3xl border border-slate-100">
      {/* List of distances */}
      <div className="flex flex-col justify-center space-y-5 lg:col-span-1">
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#0075de] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 animate-pulse" /> VỊ TRÍ ĐỊA LÝ & DI CHUYỂN
          </span>
          <h3 className="text-base font-black text-slate-800 tracking-tight">Kết nối giảng đường cực tiện</h3>
          <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
            Xem ước tính thời gian di chuyển bằng xe máy và đi bộ từ khu nhà trọ đến các cơ sở giáo dục lân cận tại Hòa Lạc.
          </p>
        </div>

        <div className="space-y-3">
          {distances.map((item, idx) => (
            <div 
              key={idx}
              className="bg-white border border-slate-100 hover:border-slate-200/80 rounded-2xl p-4 shadow-sm transition-all duration-200 hover:shadow-md flex items-center justify-between group"
            >
              <div className="space-y-1.5 text-left">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[12px] font-black text-slate-800 group-hover:text-[#0075de] transition-colors">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 pl-4.5">
                  <span className="flex items-center gap-1">
                    🛵 {item.motoTime} phút
                  </span>
                  <span className="w-[3px] h-[3px] bg-slate-200 rounded-full" />
                  <span className="flex items-center gap-1">
                    🚶‍♂️ {item.walkTime} phút
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] font-black text-[#0075de] bg-[#0075de]/5 px-3 py-1.5 rounded-xl border border-[#0075de]/10 select-none">
                  ~{item.distance.toFixed(1)} km
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaflet Map container */}
      <div className="h-[300px] lg:h-[360px] lg:col-span-2 relative z-10 rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
        <LMapContainer
          center={housePosition}
          zoom={14}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <LTileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* general circle area */}
          <LCircle
            center={housePosition}
            radius={200}
            pathOptions={{
              color: '#0075de',
              fillColor: '#0075de',
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: '5, 5'
            }}
          />

          {/* Boarding house marker */}
          {getHouseIcon() && (
            <LMarker position={housePosition} icon={getHouseIcon()}>
              <LPopup>
                <div className="p-1 font-sans text-xs">
                  <p className="font-black text-[#0075de] mb-0.5">Vị trí nhà trọ</p>
                  <p className="text-[10px] font-bold text-slate-500">Môi trường sống an toàn, sạch sẽ.</p>
                </div>
              </LPopup>
            </LMarker>
          )}

          {/* Campus markers */}
          {distances.map((campus, idx) => {
            const icon = getCampusIcon(campus.short, campus.color);
            return icon ? (
              <LMarker 
                key={idx} 
                position={[campus.lat, campus.lng]} 
                icon={icon}
              >
                <LPopup>
                  <div className="p-1 font-sans text-xs">
                    <p className="font-black text-slate-800 mb-0.5">{campus.name}</p>
                    <p className="text-[10px] font-bold text-slate-400">
                      Khoảng cách đến trọ: ~{campus.distance.toFixed(2)} km
                    </p>
                  </div>
                </LPopup>
              </LMarker>
            ) : null;
          })}
        </LMapContainer>
      </div>
    </div>
  );
}
