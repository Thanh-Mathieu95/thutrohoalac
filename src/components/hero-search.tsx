'use client';

import { MapPin, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSearchProps {
  onSearch?: (value: string) => void;
  onCategoryChange?: (value: string) => void;
  onPriceChange?: (value: string) => void;
  onAreaChange?: (value: string) => void;
  currentSearch?: string;
}

export function HeroSearch({ 
  onSearch, 
  onCategoryChange, 
  onPriceChange, 
  onAreaChange,
  currentSearch 
}: HeroSearchProps) {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000" 
          alt="Hero Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 pb-10 pt-4 px-4 md:px-8 flex flex-col items-center">
        <div className="container mx-auto max-w-4xl text-center mb-6">
          <h1 className="text-white text-2xl md:text-3xl font-bold drop-shadow-lg">
            Tìm phòng trọ lý tưởng tại <span className="text-white underline decoration-brand decoration-4 underline-offset-8">Hòa Lạc</span>
          </h1>
        </div>

        <div className="container mx-auto max-w-4xl">
          <div className="bg-[#002d62]/90 backdrop-blur-md p-3 md:p-4 rounded-2xl shadow-2xl border border-white/20">
            {/* Top Row */}
            <div className="flex bg-white rounded-lg overflow-hidden mb-3 items-center">
              <div className="pl-4 flex items-center">
                <MapPin className="w-4 h-4 text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="Tìm kiếm khu vực, tên phòng..." 
                className="flex-1 px-3 py-3 text-[14px] outline-none font-medium text-gray-700"
                value={currentSearch}
                onChange={(e) => onSearch?.(e.target.value)}
              />
              <div className="p-1">
                <Button className="bg-airbnb hover:bg-airbnb-dark text-white px-6 md:px-10 py-5 rounded-md font-bold text-[14px] shadow-md h-auto">
                  Tìm kiếm
                </Button>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* Danh mục */}
              <div className="relative group">
                <select 
                  onChange={(e) => onCategoryChange?.(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 text-white px-3 py-2.5 rounded-md appearance-none cursor-pointer outline-none hover:bg-white/10 transition-colors font-medium text-[13px]"
                >
                  <option value="" className="bg-[#002d62]">Chọn danh mục</option>
                  <option value="phong-tro" className="bg-[#002d62]">Phòng trọ</option>
                  <option value="chung-cu-mini" className="bg-[#002d62]">Chung cư mini</option>
                  <option value="nha-nguyen-can" className="bg-[#002d62]">Nhà nguyên căn</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/50 group-hover:text-white transition-colors pointer-events-none" />
              </div>

              {/* Mức giá */}
              <div className="relative group">
                <select 
                  onChange={(e) => onPriceChange?.(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 text-white px-3 py-2.5 rounded-md appearance-none cursor-pointer outline-none hover:bg-white/10 transition-colors font-medium text-[13px]"
                >
                  <option value="" className="bg-[#002d62]">Chọn mức giá</option>
                  <option value="under2" className="bg-[#002d62]">Dưới 2 triệu</option>
                  <option value="2-3.5" className="bg-[#002d62]">2 - 3.5 triệu</option>
                  <option value="3.5-5" className="bg-[#002d62]">3.5 - 5 triệu</option>
                  <option value="over5" className="bg-[#002d62]">Trên 5 triệu</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/50 group-hover:text-white transition-colors pointer-events-none" />
              </div>

              {/* Diện tích */}
              <div className="relative group">
                <select 
                  onChange={(e) => onAreaChange?.(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 text-white px-3 py-2.5 rounded-md appearance-none cursor-pointer outline-none hover:bg-white/10 transition-colors font-medium text-[13px]"
                >
                  <option value="" className="bg-[#002d62]">Chọn diện tích</option>
                  <option value="under20" className="bg-[#002d62]">Dưới 20 m²</option>
                  <option value="20-30" className="bg-[#002d62]">20 - 30 m²</option>
                  <option value="30-45" className="bg-[#002d62]">30 - 45 m²</option>
                  <option value="over45" className="bg-[#002d62]">Trên 45 m²</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/50 group-hover:text-white transition-colors pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
