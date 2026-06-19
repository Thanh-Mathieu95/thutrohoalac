'use client';

import React, { useState, useEffect } from 'react';
import { Star, Heart } from 'lucide-react';
import Link from 'next/link';

interface RoomCardProps {
  title: string;
  price: string;
  location: string;
  imageUrl: string;
  id?: number | string;
  isHot?: boolean;
}

export function RoomCard({
  title,
  price,
  location,
  imageUrl,
  id,
  isHot,
}: RoomCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      const favorites = JSON.parse(localStorage.getItem('salehung_favorites') || '[]');
      setIsFavorite(favorites.includes(id));
    }
  }, [id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!id) return;
    
    const favorites = JSON.parse(localStorage.getItem('salehung_favorites') || '[]');
    let newFavorites;
    if (isFavorite) {
      newFavorites = favorites.filter((favId: string | number) => favId !== id);
    } else {
      newFavorites = [...favorites, id];
    }
    
    localStorage.setItem('salehung_favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
    window.dispatchEvent(new Event('favorites_updated'));
  };

  return (
    <div className="group cursor-pointer">
      <Link href={`/rooms/${id || 1}`} className="block">
        <div className="relative mb-3 overflow-hidden rounded-xl aspect-square">
          <img
            src={imageUrl}
            alt={title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Guest Favorite Badge */}
          {isHot && (
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
              <span className="text-[12px] font-bold text-gray-900 flex items-center gap-1.5">
                Guest favorite
              </span>
            </div>
          )}

          {/* Favorite Button */}
          <button 
            onClick={toggleFavorite}
            className="absolute top-3 right-3 p-1 transition-transform hover:scale-110 active:scale-95"
          >
            <Heart 
              className={`w-6 h-6 stroke-white stroke-[2px] transition-colors ${isFavorite ? 'fill-airbnb text-airbnb' : 'fill-black/30 text-white'}`} 
            />
          </button>
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-[15px] text-gray-900 line-clamp-1">{location}</h3>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-current text-gray-900" />
              <span className="text-[14px] text-gray-900">4.95</span>
            </div>
          </div>
          
          <p className="text-[15px] text-gray-500 line-clamp-1">{title}</p>
          <p className="text-[15px] text-gray-500 mb-1">Mở cửa xem phòng ngay</p>
          
          <div className="mt-1">
            <span className="font-bold text-[15px] text-gray-900">{price}</span>
            <span className="text-[15px] text-gray-900"> / tháng</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
