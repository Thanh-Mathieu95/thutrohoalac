'use client';

import { 
  Home, 
  Palmtree, 
  Umbrella, 
  Mountain, 
  Castle, 
  Wind, 
  Warehouse, 
  Waves, 
  Tent, 
  TreePine,
  Building2,
  Building
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const CATEGORIES = [
  { label: 'Phòng trọ', icon: Home },
  { label: 'Chung cư mini', icon: Building2 },
  { label: 'Nhà nguyên căn', icon: Building },
  { label: 'View đẹp', icon: Mountain },
  { label: 'Gần FPT', icon: Palmtree },
  { label: 'Gần ĐHQG', icon: TreePine },
  { label: 'Có ban công', icon: Wind },
  { label: 'Full nội thất', icon: Warehouse },
  { label: 'Giá rẻ', icon: Waves },
  { label: 'Ở ghép', icon: Tent },
];

export function CategoryBar() {
  const [active, setActive] = useState('Phòng trọ');

  return (
    <div className="sticky top-20 md:top-24 left-0 right-0 z-40 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar py-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setActive(cat.label)}
              className={cn(
                "flex flex-col items-center gap-2 min-w-fit transition-all hover:text-black border-b-2 pb-2 -mb-2",
                active === cat.label 
                  ? "text-black border-black" 
                  : "text-gray-500 border-transparent hover:border-gray-200"
              )}
            >
              <cat.icon className="w-6 h-6" />
              <span className="text-[12px] font-bold whitespace-nowrap">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
