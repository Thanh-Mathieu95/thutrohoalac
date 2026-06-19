// src/components/room-type-card.tsx
'use client';

import React from 'react';
import { Star, Maximize2, Users } from 'lucide-react';
import Link from 'next/link';
import { RoomType, BoardingHouse } from '@/lib/supabase';
import { IDBImage } from '@/components/idb-image';

interface RoomTypeCardProps {
  roomType: RoomType;
  house: BoardingHouse;
  imageUrl: string;
}

export function RoomTypeCard({
  roomType,
  house,
  imageUrl,
}: RoomTypeCardProps) {
  
  // Dynamic Gender Tag helper matching the mockup's colored tag text
  const getGenderTag = (id: number) => {
    if (id === 1 || id === 8) {
      return (
        <span className="text-rose-500 font-black text-[10px] uppercase tracking-wider flex items-center gap-0.5 shrink-0">
          🚹 Nam
        </span>
      );
    }
    if (id === 2 || id === 4) {
      return (
        <span className="text-fuchsia-500 font-black text-[10px] uppercase tracking-wider flex items-center gap-0.5 shrink-0">
          🚺 Nữ
        </span>
      );
    }
    return (
      <span className="text-blue-600 font-black text-[10px] uppercase tracking-wider flex items-center gap-0.5 shrink-0">
        🚺🚹 Cả hai
      </span>
    );
  };

  // High-fidelity rating scores based on room ids
  const getRating = (id: number) => {
    const ratings: Record<number, string> = {
      1: '4.8',
      2: '4.9',
      3: '4.7',
      4: '4.5',
      5: '4.6',
      6: '4.8',
      7: '4.9',
      8: '4.4',
      9: '4.6'
    };
    return ratings[id] || '4.5';
  };

  // Realistic travel distances to major colleges (FPT / VNU) in Hoa Lac
  const getDistance = (id: number) => {
    const distances: Record<number, string> = {
      1: 'Cách ĐH FPT 0.8km • Thôn Tân Xã',
      2: 'Cách ĐH FPT 1.5km • Thôn Bình Yên',
      3: 'Cách ĐH FPT 1.2km • Thôn Hạ Bằng',
      4: 'Cách ĐH Quốc Gia 0.5km • Thôn Làng',
      5: 'Cách ĐH FPT 1.8km • Thôn Bình Yên',
      6: 'Cách ĐH Quốc Gia 1.1km • Thôn Hạ Bằng',
      7: 'Cách ĐH FPT 0.3km • Khu Công Nghệ Cao',
      8: 'Cách ĐH FPT 2.2km • Thôn Tân Xã',
      9: 'Cách ĐH Quốc Gia 1.4km • Thôn Làng'
    };
    return distances[id] || 'Gần Đại học FPT Hòa Lạc';
  };

  return (
    <Link 
      href={`/rooms/${roomType.id}`} 
      className="group bg-white border border-[#e6e6e6] rounded-xl p-3 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_18px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom-6 duration-500 fill-mode-both"
    >
      {/* Tall Portrait Rounded Image Wrapper */}
      <div className="relative aspect-[3/4] w-full bg-slate-50 overflow-hidden rounded-xl border border-gray-100">
        <IDBImage
          src={imageUrl || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800'}
          alt={roomType.name}
          className="object-cover w-full h-full absolute inset-0 group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Boarding house name overlay tag on top-left */}
        <div className="absolute top-3 left-3 bg-[#0075de]/90 text-white backdrop-blur-sm px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider z-10 shadow-sm">
          {house.name}
        </div>

        {/* Physical rooms empty count badge overlay */}
        {roomType.rooms && roomType.rooms.length > 0 && (
          <div className={`absolute top-3 right-3 backdrop-blur-sm px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider z-10 shadow-sm ${
            roomType.rooms.some((r: any) => r.available)
              ? 'bg-emerald-500/90 text-white'
              : 'bg-red-500/90 text-white'
          }`}>
            {(() => {
              const emptyRooms = roomType.rooms.filter((r: any) => r.available).length;
              return emptyRooms > 0 ? `Trống ${emptyRooms} phòng` : 'Hết phòng';
            })()}
          </div>
        )}

        {/* Carousel Swipe Dots indicators overlay */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex justify-center gap-1 z-10 opacity-75">
          <span className="w-1.5 h-1.5 bg-white rounded-full" />
          <span className="w-1.5 h-1.5 bg-white/60 rounded-full" />
          <span className="w-1.5 h-1.5 bg-white/60 rounded-full" />
        </div>
      </div>

      {/* Info Metadata Details */}
      <div className="space-y-1.5 text-left flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          {/* Line 1: Room Name and Star Rating */}
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-heading font-black text-[#000000] text-base group-hover:text-[#0075de] transition-colors leading-tight line-clamp-1 flex-1">
              {roomType.name}
            </h3>
            <div className="flex items-center gap-0.5 text-[#0075de] font-bold text-xs md:text-sm shrink-0">
              <Star className="w-3.5 h-3.5 fill-current text-[#0075de] stroke-[#0075de]" />
              <span>{getRating(roomType.id)}</span>
            </div>
          </div>

          {/* Line 2: Distance Location Info */}
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            {getDistance(roomType.id)}
          </p>

          {/* Line 3: Detailed Specifications */}
          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
            <div className="flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5 text-[#0075de]/75 shrink-0" />
              <span>{roomType.area} m²</span>
            </div>
            <div className="w-[1px] h-3 bg-slate-200" />
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#0075de]/75 shrink-0" />
              <span>Tối đa {roomType.max_people} người</span>
            </div>
          </div>

          {/* Line 4: Prominent Utilities Tags */}
          {roomType.utilities && roomType.utilities.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {roomType.utilities.slice(0, 2).map((ut, idx) => (
                <span key={idx} className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                  {ut}
                </span>
              ))}
              {roomType.utilities.length > 2 && (
                <span className="bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                  +{roomType.utilities.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Physical rooms list empty */}
          {roomType.rooms && roomType.rooms.length > 0 && (
            <div className="text-[10px] text-slate-500 font-bold pt-1.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-gray-400">Phòng trống:</span>
              {(() => {
                const emptyRooms = roomType.rooms.filter((r: any) => r.available);
                if (emptyRooms.length === 0) return <span className="text-red-500 font-bold text-[9px] uppercase tracking-wider">Hết phòng trống</span>;
                return emptyRooms.map((r: any, rIdx: number) => (
                  <span key={rIdx} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-md text-[9px] font-black">
                    {r.name}
                  </span>
                ));
              })()}
            </div>
          )}
        </div>

        {/* Line 5: Price and Gender Tag */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-auto">
          <p className="text-sm md:text-base font-black text-[#0075de] leading-tight">
            {roomType.price_from.toLocaleString('vi-VN')}đ
            <span className="text-[10px] text-gray-400 font-medium">/tháng</span>
          </p>
          {getGenderTag(roomType.id)}
        </div>
      </div>
    </Link>
  );
}



