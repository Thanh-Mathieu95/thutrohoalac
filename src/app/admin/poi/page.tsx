'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Plus } from 'lucide-react';

export default function POIPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Quản lý Tiện ích Lân Cận</h1>
          <p className="text-gray-500 mt-1">Danh sách các địa điểm tiện ích quanh các khu vực nhà trọ để hiển thị cho khách thuê.</p>
        </div>
        <div>
          <Button className="bg-[#0075de] hover:bg-opacity-95 text-white rounded-xl py-6 font-bold shadow-lg shadow-[#0075de]/20 flex items-center gap-2" style={{ backgroundColor: '#0075de' }}>
            <Plus className="w-5 h-5" /> Thêm tiện ích mới
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
         <table className="w-full text-left">
           <thead className="bg-gray-50 border-b border-gray-100">
             <tr>
               <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Tên tiện ích</th>
               <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Phân loại</th>
               <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Thao tác</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-50">
             {[
               { name: 'Trường Đại học FPT Hòa Lạc', type: 'Giáo dục' },
               { name: 'UMEE Coffee & Bakery', type: 'Dịch vụ ăn uống' },
               { name: 'VinMart Hòa Lạc', type: 'Siêu thị & Mua sắm' },
               { name: 'Trạm Xe Buýt Tuyến 107', type: 'Giao thông công cộng' },
             ].map((m, i) => (
               <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                 <td className="px-8 py-6">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                       <MapPin className="w-5 h-5 text-[#0075de]" />
                     </div>
                     <span className="font-bold text-gray-900">{m.name}</span>
                   </div>
                 </td>
                 <td className="px-8 py-6">
                   <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-[#0075de]/10 text-[#0075de]" style={{ color: '#0075de', backgroundColor: 'rgba(0, 0, 128, 0.1)' }}>
                     {m.type}
                   </span>
                 </td>
                 <td className="px-8 py-6 text-right">
                   <div className="flex justify-end gap-2">
                     <Button variant="ghost" size="sm" className="rounded-lg hover:bg-white hover:text-[#0075de] shadow-sm border border-transparent hover:border-[#0075de]/10">Sửa</Button>
                     <Button variant="ghost" size="sm" className="rounded-lg hover:bg-white hover:text-red-500 shadow-sm border border-transparent hover:border-red-100 text-gray-400">Xóa</Button>
                   </div>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
      </div>
    </div>
  );
}
