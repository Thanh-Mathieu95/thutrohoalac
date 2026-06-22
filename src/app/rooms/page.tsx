// src/app/rooms/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RoomTypeCard } from '@/components/room-type-card';
import { Button } from '@/components/ui/button';
import { Search, MapPin, SlidersHorizontal, Maximize2, Sparkles } from 'lucide-react';
import { db } from '@/lib/db';
import { RoomType, BoardingHouse } from '@/lib/supabase';
function RoomsContent() {
  const searchParams = useSearchParams();
  const initialHouseId = searchParams.get('house') ? Number(searchParams.get('house')) : undefined;

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [boardingHouses, setBoardingHouses] = useState<BoardingHouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedHouseId, setSelectedHouseId] = useState<number | undefined>(initialHouseId);
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');

  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => {
      setIsTyping(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, areaFilter, priceFilter, sizeFilter, selectedHouseId]);

  useEffect(() => {
    async function loadData() {
      try {
        const houses = await db.getBoardingHouses();
        const types = await db.getRoomTypes();
        setBoardingHouses(houses);
        setRoomTypes(types);
      } catch (e) {
        console.error('Failed to load room data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Sync with search params changes
  useEffect(() => {
    const houseParam = searchParams.get('house');
    if (houseParam) {
      setSelectedHouseId(Number(houseParam));
    }
  }, [searchParams]);

  // Handle filtering room types
  const filteredRooms = roomTypes.filter((rt) => {
    const house = boardingHouses.find((h) => h.id === rt.boarding_house_id);
    if (!house) return false;

    // Search term (Room name, house name, address)
    const matchesSearch = 
      rt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      house.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      house.address.toLowerCase().includes(searchTerm.toLowerCase());

    // Selected house ID
    const matchesHouse = selectedHouseId ? rt.boarding_house_id === selectedHouseId : true;

    // Area filter (address parsing)
    let matchesArea = true;
    if (areaFilter !== 'all') {
      matchesArea = house.address.toLowerCase().includes(areaFilter.toLowerCase());
    }

    // Price filter
    let matchesPrice = true;
    if (priceFilter === 'under2.5') matchesPrice = rt.price_from < 2500000;
    else if (priceFilter === '2.5-4') matchesPrice = rt.price_from >= 2500000 && rt.price_from <= 4000000;
    else if (priceFilter === 'over4') matchesPrice = rt.price_from > 4000000;

    // Size filter
    let matchesSize = true;
    if (sizeFilter === 'under25') matchesSize = rt.area < 25;
    else if (sizeFilter === '25-40') matchesSize = rt.area >= 25 && rt.area <= 40;
    else if (sizeFilter === 'over40') matchesSize = rt.area > 40;

    return matchesSearch && matchesHouse && matchesArea && matchesPrice && matchesSize;
  });

  // Fetch first approved image of a room type
  const [roomImages, setRoomImages] = useState<Record<number, string>>({});
  
  useEffect(() => {
    async function loadRoomImages() {
      const imagesMap: Record<number, string> = {};
      await Promise.all(
        roomTypes.map(async (rt) => {
          const images = await db.getRoomTypeImages(rt.id, 'approved');
          const mainImage = images.find(img => img.image_type === 'main') || images[0];
          imagesMap[rt.id] = mainImage ? mainImage.image_url : '';
        })
      );
      setRoomImages(imagesMap);
    }
    if (roomTypes.length > 0) {
      loadRoomImages();
    }
  }, [roomTypes]);

  const clearFilters = () => {
    setSearchTerm('');
    setAreaFilter('all');
    setPriceFilter('all');
    setSizeFilter('all');
    setSelectedHouseId(undefined);
  };

  return (
    <div className="min-h-screen bg-[#f6f5f4] flex flex-col">
      {/* Spacer to push content below fixed header */}
      <div className="h-20 md:h-24 shrink-0" />
      
      {/* Listings & Filters Container */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col">
        
        {/* Header */}
        <div className="mb-8 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#0075de]">
            Danh mục tin đăng phòng trọ Hòa Lạc
          </span>
          <h1 className="text-3xl font-heading font-black text-gray-900 tracking-tight">
            Tìm Phòng Trọ Tuyển Chọn
          </h1>
          <p className="text-xs text-gray-500 font-bold">
            Hiển thị {filteredRooms.length} loại phòng trọ đáp ứng điều kiện tìm kiếm.
          </p>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl p-6 mb-8 border border-[#e6e6e6] shadow-sm space-y-4">
          <div className="flex gap-2 items-center text-xs font-black text-gray-900 mb-2 uppercase tracking-wider">
            <SlidersHorizontal className="w-4 h-4 text-[#0075de]" />
            <span>Bộ lọc tìm kiếm</span>
            {(searchTerm || areaFilter !== 'all' || priceFilter !== 'all' || sizeFilter !== 'all' || selectedHouseId) && (
              <button onClick={clearFilters} className="ml-auto text-[10px] text-red-500 hover:underline">
                Xóa bộ lọc
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search text */}
            <div className="relative flex items-center bg-white border border-[#e6e6e6] rounded-xl px-3 py-1.5 focus-within:border-[#0075de] shadow-sm">
              <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input 
                type="text" 
                placeholder="Từ khóa tìm kiếm..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs font-bold outline-none text-gray-700 placeholder-gray-400 bg-transparent py-1"
              />
            </div>

            {/* Area select */}
            <div className="bg-white border border-[#e6e6e6] rounded-xl px-3 py-2.5 shadow-sm">
              <select 
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="w-full text-xs font-bold outline-none bg-transparent text-gray-700 cursor-pointer"
              >
                <option value="all">Khu vực: Tất cả</option>
                <option value="Thạch Hòa">📍 Thạch Hòa</option>
                <option value="Tân Xã">📍 Tân Xã</option>
                <option value="Bình Yên">📍 Bình Yên</option>
                <option value="Sơn Tây">📍 Sơn Tây</option>
                <option value="Hạ Bằng">📍 Hạ Bằng</option>
                <option value="Bắc Phú Cát">📍 Bắc Phú Cát</option>
                <option value="Phú Hữu">📍 Phú Hữu</option>
              </select>
            </div>

            {/* Price select */}
            <div className="bg-white border border-[#e6e6e6] rounded-xl px-3 py-2.5 shadow-sm">
              <select 
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full text-xs font-bold outline-none bg-transparent text-gray-700 cursor-pointer"
              >
                <option value="all">Mức giá: Tất cả</option>
                <option value="under2.5">Dưới 2.5 triệu</option>
                <option value="2.5-4">2.5 - 4 triệu</option>
                <option value="over4">Trên 4 triệu</option>
              </select>
            </div>

            {/* Size select */}
            <div className="bg-white border border-[#e6e6e6] rounded-xl px-3 py-2.5 shadow-sm">
              <select 
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="w-full text-xs font-bold outline-none bg-transparent text-gray-700 cursor-pointer"
              >
                <option value="all">Diện tích: Tất cả</option>
                <option value="under25">Dưới 25 m²</option>
                <option value="25-40">25 - 40 m²</option>
                <option value="over40">Trên 40 m²</option>
              </select>
            </div>
          </div>

          {/* Selecting specific house notification */}
          {selectedHouseId && (
            <div className="bg-[#0075de]/5 text-[#0075de] border border-[#0075de]/10 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold">
              <span>
                Đang lọc theo tòa nhà: <strong className="font-black">{boardingHouses.find(h => h.id === selectedHouseId)?.name}</strong>
              </span>
              <button onClick={() => setSelectedHouseId(undefined)} className="hover:underline text-[10px] uppercase font-black tracking-wider text-red-500">
                Xóa lọc tòa nhà
              </button>
            </div>
          )}
        </div>

        {/* Room Listings (4-column grid for full width) */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
                <div className="bg-gray-100 rounded-2xl aspect-[4/3] w-full" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredRooms.length > 0 ? (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 transition-all duration-200 ${isTyping ? 'opacity-45 blur-[0.5px]' : 'opacity-100'}`}>
            {filteredRooms.map((rt) => {
              const house = boardingHouses.find(h => h.id === rt.boarding_house_id);
              if (!house) return null;
              return (
                <RoomTypeCard 
                  key={rt.id}
                  roomType={rt}
                  house={house}
                  imageUrl={roomImages[rt.id] || ''}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-[#e6e6e6] p-8 shadow-sm">
            <div className="w-16 h-16 bg-[#f6f5f4] border border-[#e6e6e6] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Search className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">Không tìm thấy loại phòng trọ</h3>
            <p className="text-xs text-gray-400 font-bold mb-6 max-w-xs mx-auto">
              Không tìm thấy phòng trọ nào khớp với bộ lọc của bạn. Hãy thử thay đổi bộ lọc tìm kiếm.
            </p>
            <Button 
              onClick={clearFilters}
              className="bg-[#0075de] hover:bg-[#005bab] text-white font-black text-xs uppercase tracking-wider rounded-xl px-6 py-4 shadow-sm active:scale-95 transition-all"
            >
              Xóa tất cả bộ lọc
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-xs text-gray-400">Đang tải trang...</div>}>
      <RoomsContent />
    </Suspense>
  );
}
