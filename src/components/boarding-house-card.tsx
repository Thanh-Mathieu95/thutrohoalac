// src/components/boarding-house-card.tsx
'use client';

import React from 'react';
import { MapPin, Home, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { BoardingHouse } from '@/lib/supabase';
import { IDBImage } from '@/components/idb-image';

interface BoardingHouseCardProps {
  house: BoardingHouse;
  imageUrl: string;
  roomCount: number;
  priceFrom: number;
  firstRoomId: number | null;
}

export function BoardingHouseCard({
  house,
  imageUrl,
  roomCount,
  priceFrom,
  firstRoomId,
}: BoardingHouseCardProps) {

  // Short location tag
  const getLocation = (address: string) => {
    const parts = address.split(',');
    return parts.slice(-2).join(',').trim();
  };

  return (
    <Link
      href={firstRoomId ? `/rooms/${firstRoomId}` : `/boarding-house/${house.id}`}
      className="group bg-white border border-[#e6e6e6] rounded-xl p-3 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_18px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom-6 duration-500 fill-mode-both"
    >
      {/* Padded Portrait Image */}
      <div className="relative aspect-[3/4] w-full bg-slate-50 overflow-hidden rounded-xl border border-gray-100">
        <IDBImage
          src={imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800'}
          alt={house.name}
          className="object-cover w-full h-full absolute inset-0 group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Rooms count badge - top left */}
        <div className="absolute top-3 left-3 bg-[#0075de]/90 text-white backdrop-blur-sm px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider z-10 shadow-sm flex items-center gap-1">
          <Home className="w-3 h-3" />
          {roomCount} kiểu phòng
        </div>

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent z-10" />

        {/* Carousel dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex justify-center gap-1 z-20 opacity-75">
          <span className="w-1.5 h-1.5 bg-white rounded-full" />
          <span className="w-1.5 h-1.5 bg-white/60 rounded-full" />
          <span className="w-1.5 h-1.5 bg-white/60 rounded-full" />
        </div>
      </div>

      {/* Info Metadata */}
      <div className="space-y-1.5 text-left flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          {/* Category-like tags line (Address info) */}
          <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            <span>Nhà trọ sinh viên</span>
            <span className="flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5 text-[#0075de]/60 shrink-0" />
              {getLocation(house.address)}
            </span>
          </div>

          {/* House name heading */}
          <h3 className="font-heading font-black text-[#000000] text-base group-hover:text-[#0075de] transition-colors leading-tight line-clamp-1">
            {house.name}
          </h3>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-auto">
          <div>
            <p className="text-sm md:text-base font-black text-[#0075de] leading-tight">
              Từ {priceFrom.toLocaleString('vi-VN')}đ
              <span className="text-[10px] text-gray-400 font-medium">/tháng</span>
            </p>
          </div>
          <span className="text-[9px] font-black text-[#0075de]/70 uppercase tracking-wider flex items-center gap-0.5">
            Chi tiết <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
