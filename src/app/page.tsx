// src/app/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { BoardingHouseCard } from '@/components/boarding-house-card';
import { RoomTypeCard } from '@/components/room-type-card';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { RoomType, BoardingHouse } from '@/lib/supabase';
import { Map, RefreshCw, Search, ChevronDown, Building2, LayoutGrid, MapPin, Sparkles, Tag } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

const GENDER_OPTIONS = [
  { value: '', label: 'Tất cả giới tính' },
  { value: 'male', label: '🚹 Nam' },
  { value: 'female', label: '🚺 Nữ' },
  { value: 'both', label: '🚺🚹 Cả hai' }
];

const AMENITY_OPTIONS = [
  { value: '', label: 'Tất cả tiện nghi' },
  // Thiết bị
  { value: 'Điều hòa', label: 'Điều hòa' },
  { value: 'Nóng lạnh', label: 'Nóng lạnh' },
  { value: 'Tủ lạnh', label: 'Tủ lạnh' },
  { value: 'Máy giặt', label: 'Máy giặt' },
  // Bếp
  { value: 'Bếp tách riêng', label: 'Bếp tách riêng' },
  { value: 'Bếp chung', label: 'Bếp chung' },
  { value: 'Bếp nấu ăn', label: 'Bếp nấu ăn' },
  // Không gian
  { value: 'Ban công', label: 'Ban công' },
  { value: 'Sân phơi đồ', label: 'Sân phơi đồ' },
  { value: 'Thang máy', label: 'Thang máy' },
  // Nội thất
  { value: 'Nội thất cơ bản', label: 'Nội thất cơ bản' },
  { value: 'Nội thất đầy đủ', label: 'Nội thất đầy đủ' },
  { value: 'Sofa', label: 'Sofa' },
  // An ninh & tiện ích
  { value: 'Wifi', label: 'Wifi' },
  { value: 'Gửi xe', label: 'Gửi xe' },
  { value: 'Camera an ninh', label: 'Camera an ninh' },
  { value: 'Khóa vân tay', label: 'Khóa vân tay' },
  { value: 'Cửa khóa thẻ từ', label: 'Cửa khóa thẻ từ' },
  { value: 'Vệ sinh khép kín', label: 'Vệ sinh khép kín' },
  { value: 'Giờ giấc tự do', label: 'Giờ giấc tự do' },
];

const PRICE_OPTIONS = [
  { value: '', label: 'Tất cả mức giá' },
  { value: 'under1', label: 'Dưới 1 triệu' },
  { value: '1-2', label: '1 - 2 triệu' },
  { value: '2-3', label: '2 - 3 triệu' },
  { value: '3-4', label: '3 - 4 triệu' },
  { value: '4-5', label: '4 - 5 triệu' },
  { value: '5-7', label: '5 - 7 triệu' },
  { value: '7-10', label: '7 - 10 triệu' },
  { value: 'over10', label: 'Trên 10 triệu' },
];

const ROOM_TYPE_OPTIONS = [
  { value: '', label: 'Tất cả loại phòng' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Deluxe', label: 'Deluxe' },
  { value: 'Studio', label: 'Studio' },
  { value: 'Gác lửng', label: 'Gác lửng' }
];

const AREA_OPTIONS = [
  { value: '', label: 'Tất cả khu vực' },
  { value: 'FPT', label: '📍 Khu FPT' },
  { value: 'ĐHQG', label: '📍 Khu ĐHQG' },
  { value: 'Tân Xã', label: '📍 Tân Xã' },
  { value: 'Bình Yên', label: '📍 Bình Yên' },
  { value: 'Thạch Hòa', label: '📍 Thạch Hòa' }
];

interface HeroSearchFormProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  area: string;
  setArea: (val: string) => void;
  amenity: string;
  setAmenity: (val: string) => void;
  price: string;
  setPrice: (val: string) => void;
}

function HeroSearchForm({
  searchTerm,
  setSearchTerm,
  area,
  setArea,
  amenity,
  setAmenity,
  price,
  setPrice
}: HeroSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openDropdown, setOpenDropdown] = useState<'area' | 'amenity' | 'price' | null>(null);
  const [focusedField, setFocusedField] = useState<'search' | 'area' | 'amenity' | 'price' | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
        setFocusedField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFocusedField(null);
    setOpenDropdown(null);
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim());
    } else {
      params.delete('search');
    }
    router.push(`/?${params.toString()}`);

    // Smooth scroll down to results section
    setTimeout(() => {
      const element = document.getElementById('results');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const toggleDropdown = (type: 'area' | 'amenity' | 'price') => {
    const next = openDropdown === type ? null : type;
    setOpenDropdown(next);
    setFocusedField(next);
  };

  return (
    <form ref={formRef} onSubmit={handleSearchSubmit} className="w-full">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center bg-white border border-slate-200 shadow-xl rounded-3xl lg:rounded-full hover:shadow-2xl focus-within:ring-4 focus-within:ring-[#0075de]/10 focus-within:scale-[1.02] lg:focus-within:scale-[1.03] focus-within:shadow-2xl transition-all duration-300 p-3 lg:p-0 lg:h-[72px] w-full text-left relative gap-2.5 lg:gap-0">
        
        {/* Section 1: Keywords */}
        <div 
          onClick={() => {
            const input = document.getElementById('search-input');
            if (input) input.focus();
            setFocusedField('search');
          }}
          className={`flex flex-row items-center gap-2 px-4 py-3 lg:py-0 lg:h-full rounded-2xl lg:rounded-none lg:rounded-l-full cursor-text transition-all duration-300 group min-w-0 border border-slate-100 lg:border-none lg:pl-6 lg:pr-3 ${
            focusedField === 'search'
              ? 'lg:flex-[1.4] bg-slate-50/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]'
              : focusedField !== null
                ? 'lg:flex-[0.8] opacity-70 bg-transparent'
                : 'lg:flex-1 bg-slate-50/30 lg:bg-transparent'
          }`}
        >
          <Search className="w-5 h-5 text-[#0075de] shrink-0" />
          <div className="flex-1 flex flex-col min-w-0">
            <span className="text-[9px] xl:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left mb-0.5">
              Từ khóa
            </span>
            <input 
              id="search-input"
              type="text" 
              placeholder="Tên trọ, địa chỉ..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setFocusedField('search')}
              className="w-full bg-transparent border-none outline-none text-xs xl:text-sm font-bold text-slate-700 placeholder-slate-400 focus:ring-0 p-0 min-w-0"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-8 bg-slate-100 self-center" />

        {/* Section 2: Area Dropdown */}
        <div 
          onClick={() => toggleDropdown('area')}
          className={`flex flex-row items-center gap-2 px-4 py-3 lg:py-0 lg:h-full rounded-2xl lg:rounded-none cursor-pointer transition-all duration-300 relative min-w-0 border border-slate-100 lg:border-none lg:px-3.5 ${
            focusedField === 'area'
              ? 'lg:flex-[1.4] bg-slate-50/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]'
              : focusedField !== null
                ? 'lg:flex-[0.8] opacity-70 bg-transparent'
                : 'lg:flex-1 bg-slate-50/30 lg:bg-transparent'
          }`}
        >
          <MapPin className="w-5 h-5 text-[#0075de] shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col">
            <span className="text-[9px] xl:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left mb-0.5">
              Khu vực
            </span>
            <span className="text-xs xl:text-sm font-bold text-slate-700 truncate">
              {AREA_OPTIONS.find(o => o.value === area)?.label || 'Tất cả khu vực'}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />

          {openDropdown === 'area' && (
            <div className="absolute top-[105%] left-0 right-0 lg:w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
              {AREA_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    setArea(opt.value);
                    setOpenDropdown(null);
                    setFocusedField(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold rounded-xl transition-colors hover:bg-blue-50/40 hover:text-[#0075de] ${
                    area === opt.value ? 'text-[#0075de] bg-blue-50/20' : 'text-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-8 bg-slate-100 self-center" />

        {/* Section 3: Amenity Dropdown */}
        <div 
          onClick={() => toggleDropdown('amenity')}
          className={`flex flex-row items-center gap-2 px-4 py-3 lg:py-0 lg:h-full rounded-2xl lg:rounded-none cursor-pointer transition-all duration-300 relative min-w-0 border border-slate-100 lg:border-none lg:px-3.5 ${
            focusedField === 'amenity'
              ? 'lg:flex-[1.4] bg-slate-50/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]'
              : focusedField !== null
                ? 'lg:flex-[0.8] opacity-70 bg-transparent'
                : 'lg:flex-1 bg-slate-50/30 lg:bg-transparent'
          }`}
        >
          <Sparkles className="w-5 h-5 text-[#0075de] shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col">
            <span className="text-[9px] xl:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left mb-0.5">
              Tiện nghi
            </span>
            <span className="text-xs xl:text-sm font-bold text-slate-700 truncate">
              {AMENITY_OPTIONS.find(o => o.value === amenity)?.label || 'Tất cả tiện nghi'}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />

          {openDropdown === 'amenity' && (
            <div className="absolute top-[105%] left-0 right-0 lg:w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
              {AMENITY_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAmenity(opt.value);
                    setOpenDropdown(null);
                    setFocusedField(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold rounded-xl transition-colors hover:bg-blue-50/40 hover:text-[#0075de] ${
                    amenity === opt.value ? 'text-[#0075de] bg-blue-50/20' : 'text-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-8 bg-slate-100 self-center" />

        {/* Section 4: Price Dropdown */}
        <div 
          onClick={() => toggleDropdown('price')}
          className={`flex flex-row items-center gap-2 px-4 py-3 lg:py-0 lg:h-full rounded-2xl lg:rounded-none cursor-pointer transition-all duration-300 relative min-w-0 border border-slate-100 lg:border-none lg:px-3.5 ${
            focusedField === 'price'
              ? 'lg:flex-[1.4] bg-slate-50/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]'
              : focusedField !== null
                ? 'lg:flex-[0.8] opacity-70 bg-transparent'
                : 'lg:flex-1 bg-slate-50/30 lg:bg-transparent'
          }`}
        >
          <Tag className="w-5 h-5 text-[#0075de] shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col">
            <span className="text-[9px] xl:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left mb-0.5">
              Giá thuê
            </span>
            <span className="text-xs xl:text-sm font-bold text-slate-700 truncate">
              {PRICE_OPTIONS.find(o => o.value === price)?.label || 'Tất cả mức giá'}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />

          {openDropdown === 'price' && (
            <div className="absolute top-[105%] left-0 right-0 lg:w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
              {PRICE_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPrice(opt.value);
                    setOpenDropdown(null);
                    setFocusedField(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold rounded-xl transition-colors hover:bg-blue-50/40 hover:text-[#0075de] ${
                    price === opt.value ? 'text-[#0075de] bg-blue-50/20' : 'text-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Button Column */}
        <div className="py-2.5 lg:py-0 lg:pr-3 lg:pl-1 flex items-center justify-center shrink-0">
          <button 
            type="submit"
            className="bg-[#0075de] hover:bg-[#005bab] text-white h-12 lg:h-13 xl:h-14 w-full lg:w-auto px-8 lg:px-5 xl:px-7 rounded-xl lg:rounded-full flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 shrink-0 font-black text-xs uppercase tracking-wider cursor-pointer"
          >
            <Search className="w-4 h-4 text-white" />
            <span>Tìm phòng</span>
          </button>
        </div>

      </div>
    </form>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f6f5f4] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-[#0075de] animate-spin" />
        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Đang tải En House...</span>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  // Tab: 'houses' | 'rooms'
  const [activeTab, setActiveTab] = useState<'houses' | 'rooms'>('houses');

  const [boardingHouses, setBoardingHouses] = useState<BoardingHouse[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [houseImages, setHouseImages] = useState<Record<number, string>>({});
  const [roomImages, setRoomImages] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Shared filters
  const [gender, setGender] = useState('');
  const [area, setArea] = useState('');
  const [amenity, setAmenity] = useState('');
  const [price, setPrice] = useState('');

  // Room-tab-only filter
  const [roomTypeFilter, setRoomTypeFilter] = useState('');

  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => {
      setIsTyping(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, area, amenity, price, activeTab]);


  useEffect(() => {
    async function loadData() {
      try {
        const houses = await db.getBoardingHouses();
        const types = await db.getRoomTypes();
        setBoardingHouses(houses);
        setRoomTypes(types);

        // Load house front images
        const houseImagesMap: Record<number, string> = {};
        await Promise.all(
          houses.map(async (h) => {
            const imgs = await db.getBoardingHouseImages(h.id, 'approved');
            const front = imgs.find(i => i.image_type === 'front') || imgs[0];
            houseImagesMap[h.id] = front ? front.image_url : '';
          })
        );
        setHouseImages(houseImagesMap);

        // Load room type main images
        const roomImagesMap: Record<number, string> = {};
        await Promise.all(
          types.map(async (rt) => {
            const imgs = await db.getRoomTypeImages(rt.id, 'approved');
            const main = imgs.find(i => i.image_type === 'main') || imgs[0];
            roomImagesMap[rt.id] = main ? main.image_url : '';
          })
        );
        setRoomImages(roomImagesMap);
      } catch (e) {
        console.error('Failed to load home data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleDropdown = (key: string) => {
    setActiveDropdown(activeDropdown === key ? null : key);
  };

  const clearFilters = () => {
    setGender('');
    setArea('');
    setAmenity('');
    setPrice('');
    setRoomTypeFilter('');
    setSearchTerm('');
  };

  const getHouseRoomTypes = (houseId: number) =>
    roomTypes.filter(rt => rt.boarding_house_id === houseId);

  // ── Filter boarding houses ──
  const filteredHouses = boardingHouses.filter((house) => {
    const matchesSearch = !searchTerm.trim() ||
      house.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      house.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = !area ||
      house.name.toLowerCase().includes(area.toLowerCase()) ||
      house.address.toLowerCase().includes(area.toLowerCase());

    const houseRts = getHouseRoomTypes(house.id);
    const priceFrom = houseRts.length > 0 ? Math.min(...houseRts.map(rt => rt.price_from)) : 0;

    let matchesPrice = true;
    if (price === 'under1') matchesPrice = priceFrom < 1000000;
    else if (price === '1-2') matchesPrice = priceFrom >= 1000000 && priceFrom < 2000000;
    else if (price === '2-3') matchesPrice = priceFrom >= 2000000 && priceFrom < 3000000;
    else if (price === '3-4') matchesPrice = priceFrom >= 3000000 && priceFrom < 4000000;
    else if (price === '4-5') matchesPrice = priceFrom >= 4000000 && priceFrom < 5000000;
    else if (price === '5-7') matchesPrice = priceFrom >= 5000000 && priceFrom < 7000000;
    else if (price === '7-10') matchesPrice = priceFrom >= 7000000 && priceFrom < 10000000;
    else if (price === 'over10') matchesPrice = priceFrom >= 10000000;

    const matchesAmenity = !amenity || houseRts.some(rt => rt.utilities.includes(amenity));

    let matchesGender = true;
    if (gender === 'male') matchesGender = houseRts.some(rt => rt.id === 1 || rt.id === 8);
    else if (gender === 'female') matchesGender = houseRts.some(rt => rt.id === 2 || rt.id === 4);
    else if (gender === 'both') matchesGender = houseRts.some(rt => rt.id !== 1 && rt.id !== 8 && rt.id !== 2 && rt.id !== 4);

    return matchesSearch && matchesArea && matchesPrice && matchesAmenity && matchesGender;
  });

  // ── Filter room types ──
  const filteredRooms = roomTypes.filter((rt) => {
    const house = boardingHouses.find(h => h.id === rt.boarding_house_id);
    if (!house) return false;

    const matchesSearch = !searchTerm.trim() ||
      rt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      house.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      house.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = !area ||
      rt.name.toLowerCase().includes(area.toLowerCase()) ||
      house.name.toLowerCase().includes(area.toLowerCase()) ||
      house.address.toLowerCase().includes(area.toLowerCase());

    let matchesPrice = true;
    if (price === 'under1') matchesPrice = rt.price_from < 1000000;
    else if (price === '1-2') matchesPrice = rt.price_from >= 1000000 && rt.price_from < 2000000;
    else if (price === '2-3') matchesPrice = rt.price_from >= 2000000 && rt.price_from < 3000000;
    else if (price === '3-4') matchesPrice = rt.price_from >= 3000000 && rt.price_from < 4000000;
    else if (price === '4-5') matchesPrice = rt.price_from >= 4000000 && rt.price_from < 5000000;
    else if (price === '5-7') matchesPrice = rt.price_from >= 5000000 && rt.price_from < 7000000;
    else if (price === '7-10') matchesPrice = rt.price_from >= 7000000 && rt.price_from < 10000000;
    else if (price === 'over10') matchesPrice = rt.price_from >= 10000000;

    const matchesAmenity = !amenity || rt.utilities.includes(amenity);

    let matchesGender = true;
    if (gender === 'male') matchesGender = rt.id === 1 || rt.id === 8;
    else if (gender === 'female') matchesGender = rt.id === 2 || rt.id === 4;
    else if (gender === 'both') matchesGender = rt.id !== 1 && rt.id !== 8 && rt.id !== 2 && rt.id !== 4;

    const matchesType = !roomTypeFilter || rt.name.toLowerCase().includes(roomTypeFilter.toLowerCase());

    return matchesSearch && matchesArea && matchesPrice && matchesAmenity && matchesGender && matchesType;
  });

  const hasActiveFilters = gender || area || amenity || price || roomTypeFilter || searchTerm;

  return (
    <main className="min-h-screen bg-[#f6f5f4] text-[#31302e] font-sans">

      {/* ── Hero Banner Section ── */}
      <div 
        className="relative z-30 w-full min-h-[280px] lg:min-h-[340px] py-6 lg:py-8 flex items-center justify-center border-b border-[#e6e6e6]"
        style={{
          backgroundImage: "url('/hero_banner.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Soft overlay to make text and form look clean */}
        <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[0.5px]" />

        {/* Clean Glassmorphism Card for text and search form */}
        <div className="relative z-10 w-full max-w-5xl mx-4 px-6 py-8 sm:px-8 sm:py-10 bg-white/80 rounded-[2rem] backdrop-blur-md shadow-2xl border border-white/50 space-y-6 text-center">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-black text-slate-800 uppercase tracking-wider leading-none">
              HOLA EnHouse
            </h1>
          </div>

          {/* Hero Search Bar Wrapper */}
          <div className="w-full max-w-full mx-auto mt-2">
            <HeroSearchForm 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              area={area}
              setArea={setArea}
              amenity={amenity}
              setAmenity={setAmenity}
              price={price}
              setPrice={setPrice}
            />
          </div>
        </div>
      </div>

      {/* ── Sticky Tab Bar + Filters ── */}
      <div id="results" className="scroll-mt-24 bg-[#f6f5f4]/90 backdrop-blur-md border-b border-[#e6e6e6] sticky top-20 md:top-24 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">

        {/* Tab switcher row */}
        <div className="container mx-auto px-4 pt-4 pb-0 flex items-center gap-1">
          <button
            onClick={() => { setActiveTab('houses'); clearFilters(); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl font-black text-xs uppercase tracking-widest transition-all border-b-2 ${
              activeTab === 'houses'
                ? 'text-[#0075de] border-[#0075de] bg-white'
                : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Nhà trọ
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
              activeTab === 'houses' ? 'bg-[#0075de] text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {boardingHouses.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('rooms'); clearFilters(); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl font-black text-xs uppercase tracking-widest transition-all border-b-2 ${
              activeTab === 'rooms'
                ? 'text-[#0075de] border-[#0075de] bg-white'
                : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Kiểu phòng
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
              activeTab === 'rooms' ? 'bg-[#0075de] text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {roomTypes.length}
            </span>
          </button>
        </div>


      </div>

      {/* ── Main Content ── */}
      <div className="container mx-auto px-4 md:px-8 py-10">

        {/* Section heading */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-8">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {activeTab === 'houses' ? 'Nhà trọ' : 'Kiểu phòng'}
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mt-0.5">
              {activeTab === 'houses'
                ? (hasActiveFilters ? `${filteredHouses.length} nhà trọ phù hợp` : 'Khám phá nhà trọ nổi bật')
                : (hasActiveFilters ? `${filteredRooms.length} kiểu phòng phù hợp` : 'Tất cả kiểu phòng đang có')
              }
            </h2>
          </div>
        </div>

        {/* ── Tab: Nhà trọ ── */}
        {activeTab === 'houses' && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="bg-slate-100 rounded-[1.5rem] aspect-[3/4] w-full" />
                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredHouses.length > 0 ? (
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 transition-all duration-200 ${isTyping ? 'opacity-45 blur-[0.5px]' : 'opacity-100'}`}>
                {filteredHouses.map((house) => {
                  const houseRts = getHouseRoomTypes(house.id);
                  const priceFrom = houseRts.length > 0 ? Math.min(...houseRts.map(rt => rt.price_from)) : 0;
                  const firstRoomId = houseRts.length > 0 ? houseRts[0].id : null;
                  return (
                    <BoardingHouseCard
                      key={house.id}
                      house={house}
                      imageUrl={houseImages[house.id] || ''}
                      roomCount={houseRts.length}
                      priceFrom={priceFrom}
                      firstRoomId={firstRoomId}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyState onClear={clearFilters} label="nhà trọ" />
            )}
          </>
        )}

        {/* ── Tab: Kiểu phòng ── */}
        {activeTab === 'rooms' && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="bg-slate-100 rounded-[1.5rem] aspect-[3/4] w-full" />
                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
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
              <EmptyState onClear={clearFilters} label="kiểu phòng" />
            )}
          </>
        )}



        {/* Logo brand indicator */}
        <div className="pt-16 pb-4 flex justify-center items-center select-none overflow-hidden">
          <div className="h-20 w-20 relative bg-white rounded-full border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
            <img 
              src="/logo.png" 
              alt="En House Logo" 
              className="absolute inset-0 w-full h-full object-cover scale-[1.7]" 
            />
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <h3 className="text-lg font-black text-slate-800">Tiếp tục khám phá phòng trọ Hòa Lạc</h3>
          <p className="text-xs text-slate-400 font-bold max-w-sm mb-2 leading-relaxed">
            Xem vị trí thực địa trực quan, các điểm tiện ích lân cận Đại học FPT và liên hệ môi giới ngay trên bản đồ.
          </p>
          <div className="flex justify-center">
            <Button asChild className="bg-[#0075de] hover:bg-[#005bab] text-white px-8 py-5.5 rounded-full font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm">
              <Link href="/rooms">Xem dạng danh sách</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#f6f5f4] border-t border-[#e6e6e6] py-16 pb-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-left">
            <div>
              <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest mb-4">Hỗ trợ khách hàng</h4>
              <ul className="space-y-3 text-xs text-slate-400 font-bold">
                <li><Link href="#" className="hover:text-slate-900 transition-colors">Trung tâm trợ giúp 24/7</Link></li>
                <li><Link href="#" className="hover:text-slate-900 transition-colors">Quy trình xem phòng</Link></li>
                <li><Link href="#" className="hover:text-slate-900 transition-colors">Chính sách bảo mật</Link></li>
                <li><Link href="#" className="hover:text-slate-900 transition-colors">Liên hệ môi giới</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest mb-4">Dành cho chủ nhà</h4>
              <ul className="space-y-3 text-xs text-slate-400 font-bold">
                <li><Link href="#" className="hover:text-slate-900 transition-colors">Ký gửi nhà trọ</Link></li>
                <li><Link href="#" className="hover:text-slate-900 transition-colors">Quy chuẩn hình ảnh</Link></li>
                <li><Link href="#" className="hover:text-slate-900 transition-colors">Tải ảnh gửi duyệt</Link></li>
                <li><Link href="#" className="hover:text-slate-900 transition-colors">Bảng phí dịch vụ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest mb-4">Về En House</h4>
              <ul className="space-y-3 text-xs text-slate-400 font-bold">
                <li><Link href="#" className="hover:text-slate-900 transition-colors">Về thương hiệu Sale Hùng</Link></li>
                <li><Link href="#" className="hover:text-slate-900 transition-colors">Cộng tác viên môi giới</Link></li>
                <li><Link href="#" className="hover:text-slate-900 transition-colors">Cơ hội đầu tư bất động sản</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest mb-4">Sale Hùng (Môi giới)</h4>
              <p className="text-xs text-slate-400 font-bold leading-relaxed">
                Nền tảng tìm kiếm và ký gửi phòng trọ số 1 tại Hòa Lạc. Tối ưu hóa quy trình kết nối khách thuê trực tiếp với chủ trọ.
              </p>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-400">
            <span>© 2026 En House Hòa Lạc - Sale Hùng. Bảo lưu mọi quyền.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function EmptyState({ onClear, label }: { onClear: () => void; label: string }) {
  return (
    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-[#e6e6e6] p-8 max-w-xl mx-auto shadow-sm">
      <div className="w-16 h-16 bg-[#f6f5f4] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#e6e6e6]">
        <Search className="w-6 h-6 text-slate-300" />
      </div>
      <h3 className="text-base font-black text-slate-800 mb-1">Không tìm thấy {label} phù hợp</h3>
      <p className="text-xs text-slate-400 font-bold mb-6 max-w-xs mx-auto">
        Hãy thử nới lỏng bộ lọc hoặc thay đổi từ khóa tìm kiếm.
      </p>
      <Button onClick={onClear} className="bg-[#0075de] hover:bg-[#005bab] text-white font-black text-xs uppercase tracking-widest rounded-xl px-6 py-3.5 shadow-sm active:scale-95">
        Xóa tất cả bộ lọc
      </Button>
    </div>
  );
}
