// src/components/room-type-card.tsx
'use client';

import React from 'react';
import { MapPin, ChevronRight, Home } from 'lucide-react';
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
        <div className="absolute top-3 left-3 bg-[#0075de]/90 text-white backdrop-blur-sm px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider z-10 shadow-sm flex items-center gap-1">
          <Home className="w-3 h-3" />
          {house.name}
        </div>



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
          {/* Category-like tags line (Address / distance info) */}
          <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            <span>Kiểu phòng sinh viên</span>
            <span className="flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5 text-[#0075de]/60 shrink-0" />
              {getDistance(roomType.id)}
            </span>
          </div>

          {/* Room name heading */}
          <h3 className="font-heading font-black text-[#000000] text-base group-hover:text-[#0075de] transition-colors leading-tight line-clamp-1">
            {roomType.name}
          </h3>
        </div>

        {/* Price and Action Link */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-auto">
          <p className="text-sm md:text-base font-black text-[#0075de] leading-tight">
            {roomType.price_from.toLocaleString('vi-VN')}đ
            <span className="text-[10px] text-gray-400 font-medium">/tháng</span>
          </p>
          <span className="text-[9px] font-black text-[#0075de]/70 uppercase tracking-wider flex items-center gap-0.5">
            Chi tiết <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}



