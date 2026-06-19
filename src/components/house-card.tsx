// src/components/house-card.tsx
'use client';

import React from 'react';
import { MapPin, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';
import { BoardingHouse } from '@/lib/supabase';

interface HouseCardProps {
  house: BoardingHouse;
  imageUrl: string;
  priceFrom: number;
  roomTypeCount: number;
}

export function HouseCard({
  house,
  imageUrl,
  priceFrom,
  roomTypeCount,
}: HouseCardProps) {
  // Format price helper
  const formatPrice = (val: number) => {
    return (val / 1000000).toFixed(1) + ' triệu';
  };

  return (
    <div className="group bg-white rounded-xl border border-[#e6e6e6] hover:shadow-[0_4px_18px_rgba(0,0,0,0.08)] shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-300 overflow-hidden flex flex-col h-full hover:-translate-y-0.5">
      {/* 1 Main Image with standard img element to bypass domain issues */}
      <div className="relative aspect-[4/3] w-full bg-gray-50 overflow-hidden">
        <img
          src={imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800'}
          alt={house.name}
          className="object-cover w-full h-full absolute inset-0 group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Room Type Count Badge */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
          <Home className="w-3.5 h-3.5 text-[#0075de]" />
          <span className="text-[10px] font-black text-gray-900 uppercase tracking-wider">
            {roomTypeCount} loại phòng
          </span>
        </div>
      </div>

      {/* Info content */}
      <div className="p-6 flex flex-col flex-1 justify-between">
        <div className="space-y-2">
          {/* Location Area */}
          <div className="flex items-center gap-1.5 text-gray-400">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs font-bold uppercase tracking-wider line-clamp-1">
              {house.address.split(',').slice(-2).join(',').trim()}
            </span>
          </div>

          {/* House Name */}
          <h3 className="font-heading font-black text-lg text-gray-900 group-hover:text-[#0075de] transition-colors leading-tight line-clamp-1">
            {house.name}
          </h3>

          {/* House Description */}
          <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
            {house.description || 'Không có mô tả chi tiết từ chủ nhà.'}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Giá thuê từ</div>
            <div className="text-base font-black text-[#0075de] tracking-tight mt-0.5">
              {formatPrice(priceFrom)} <span className="text-xs font-bold text-gray-400">/ tháng</span>
            </div>
          </div>

          <Link
            href={`/rooms?house=${house.id}`}
            className="w-10 h-10 rounded-full bg-gray-50 hover:bg-[#0075de] hover:text-white text-gray-700 flex items-center justify-center transition-all shadow-sm active:scale-95 group-hover:scale-110"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
