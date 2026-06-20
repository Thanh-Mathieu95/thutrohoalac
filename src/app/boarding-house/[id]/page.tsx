// src/app/boarding-house/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MapPin, ChevronLeft, Star, Home, Maximize2, Users, 
  ChevronRight, RefreshCw, Phone, X, LayoutGrid, Camera
} from 'lucide-react';
import { db } from '@/lib/db';
import { BoardingHouse, RoomType, BoardingHouseImage, RoomTypeImage } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { IDBImage } from '@/components/idb-image';

export default function BoardingHouseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [house, setHouse] = useState<BoardingHouse | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [houseImages, setHouseImages] = useState<BoardingHouseImage[]>([]);
  const [roomImages, setRoomImages] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const bh = await db.getBoardingHouseById(id);
        setHouse(bh);
        const bhImgs = await db.getBoardingHouseImages(id, 'approved');
        setHouseImages(bhImgs);
        const types = await db.getRoomTypes({ boarding_house_id: id });
        setRoomTypes(types);
        
        // Redirect to first room type if available
        if (types.length > 0) {
          router.replace(`/rooms/${types[0].id}`);
          return;
        }

        const imagesMap: Record<number, string> = {};
        await Promise.all(
          types.map(async (rt) => {
            const imgs = await db.getRoomTypeImages(rt.id, 'approved');
            const main = imgs.find(i => i.image_type === 'main') || imgs[0];
            imagesMap[rt.id] = main ? main.image_url : '';
          })
        );
        setRoomImages(imagesMap);
      } catch (e) {
        console.error('Failed to load boarding house data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-[#0075de] animate-spin" />
        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Đang tải...</span>
      </div>
    );
  }

  if (!house) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-4">
        <Home className="w-12 h-12 text-slate-300" />
        <h2 className="text-lg font-black text-slate-800">Không tìm thấy nhà trọ</h2>
        <Button onClick={() => router.push('/')} className="bg-[#0075de] text-white">Về trang chủ</Button>
      </div>
    );
  }

  const FALLBACK = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1200';
  const allImages = houseImages.length > 0 ? houseImages.map(i => i.image_url) : [FALLBACK];
  const priceFrom = roomTypes.length > 0 ? Math.min(...roomTypes.map(rt => rt.price_from)) : 0;

  const openLightbox = (idx: number) => { setLightboxIdx(idx); setLightboxOpen(true); };

  return (
    <main className="min-h-screen bg-white text-slate-800 font-sans">

      {/* Lightbox — full screen all-images grid */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-sm">
            <span className="text-white font-black text-sm">{house.name} — {allImages.length} ảnh</span>
            <button
              onClick={() => setLightboxOpen(false)}
              className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          {/* Selected large image */}
          <div className="px-4 md:px-12 pt-6 pb-4">
            <div className="relative w-full max-w-4xl mx-auto aspect-[16/9] overflow-hidden rounded-2xl">
              <IDBImage src={allImages[lightboxIdx]} alt="Ảnh lớn" className="w-full h-full object-cover" />
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setLightboxIdx((lightboxIdx - 1 + allImages.length) % allImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => setLightboxIdx((lightboxIdx + 1) % allImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                  <div className="absolute bottom-3 right-4 bg-black/60 text-white text-[11px] font-black px-3 py-1 rounded-full">
                    {lightboxIdx + 1} / {allImages.length}
                  </div>
                </>
              )}
            </div>
          </div>
          {/* Thumbnail strip */}
          <div className="px-4 md:px-12 pb-10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {allImages.map((src, i) => (
              <div
                key={i}
                onClick={() => setLightboxIdx(i)}
                className={`relative aspect-square overflow-hidden rounded-xl cursor-pointer ring-2 transition-all ${
                  i === lightboxIdx ? 'ring-white scale-[1.03]' : 'ring-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <IDBImage src={src} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="container mx-auto px-4 md:px-8 pt-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-[#0075de] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại
        </button>
      </div>

      {/* ── Bento Photo Grid ── */}
      <div className="container mx-auto px-4 md:px-8 mt-4">
        <div className="relative grid grid-cols-4 grid-rows-2 gap-2 h-[420px] md:h-[620px] rounded-[1.8rem] overflow-hidden">

          {/* Main large — left, spans 2 cols × 2 rows */}
          <div
            className="col-span-2 row-span-2 relative cursor-pointer group overflow-hidden"
            onClick={() => openLightbox(0)}
          >
            <IDBImage
              src={allImages[0] || FALLBACK}
              alt={house.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Top-right 1 */}
          <div 
            className="relative cursor-pointer group overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center" 
            onClick={() => allImages[1] ? openLightbox(1) : undefined}
          >
            {allImages[1] ? (
              <IDBImage
                src={allImages[1]}
                alt="Ảnh 2"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300/70 select-none">
                <Camera className="w-5 h-5 mb-1" />
                <span className="text-[9px] font-black uppercase tracking-wider">Trống</span>
              </div>
            )}
          </div>

          {/* Top-right 2 */}
          <div 
            className="relative cursor-pointer group overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center" 
            onClick={() => allImages[2] ? openLightbox(2) : undefined}
          >
            {allImages[2] ? (
              <IDBImage
                src={allImages[2]}
                alt="Ảnh 3"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300/70 select-none">
                <Camera className="w-5 h-5 mb-1" />
                <span className="text-[9px] font-black uppercase tracking-wider">Trống</span>
              </div>
            )}
          </div>

          {/* Bottom-right 1 */}
          <div 
            className="relative cursor-pointer group overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center" 
            onClick={() => allImages[3] ? openLightbox(3) : undefined}
          >
            {allImages[3] ? (
              <IDBImage
                src={allImages[3]}
                alt="Ảnh 4"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300/70 select-none">
                <Camera className="w-5 h-5 mb-1" />
                <span className="text-[9px] font-black uppercase tracking-wider">Trống</span>
              </div>
            )}
          </div>

          {/* Bottom-right 2 — "xem thêm" overlay if 5+ images */}
          <div 
            className="relative cursor-pointer group overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center" 
            onClick={() => allImages[4] ? openLightbox(4) : undefined}
          >
            {allImages[4] ? (
              <>
                <IDBImage
                  src={allImages[4]}
                  alt="Ảnh 5"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {allImages.length > 5 && (
                  <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1">
                    <LayoutGrid className="w-5 h-5 text-white" />
                    <span className="text-white font-black text-xs">+{allImages.length - 5} ảnh</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300/70 select-none">
                <Camera className="w-5 h-5 mb-1" />
                <span className="text-[9px] font-black uppercase tracking-wider">Trống</span>
              </div>
            )}
          </div>

          {/* "Xem tất cả ảnh" button floating bottom-right */}
          <button
            onClick={() => openLightbox(0)}
            className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-700 font-black text-[11px] px-3.5 py-2 rounded-full shadow-md flex items-center gap-1.5 transition-all border border-slate-200/80"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Xem tất cả {allImages.length} ảnh
          </button>
        </div>
      </div>

      {/* House Info Header */}
      <div className="container mx-auto px-4 md:px-8 mt-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="bg-[#0075de]/10 text-[#0075de] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                Nhà trọ
              </span>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-black text-slate-600">4.8 · {roomTypes.length} kiểu phòng</span>
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{house.name}</h1>
            <p className="text-sm text-slate-400 font-bold flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#0075de]/60 shrink-0" />
              {house.address}
            </p>
          </div>
          <div className="shrink-0">
            <p className="text-xs text-slate-400 font-bold">Giá thuê từ</p>
            <p className="text-2xl font-black text-[#0075de]">
              {priceFrom.toLocaleString('vi-VN')}đ
              <span className="text-sm text-slate-400 font-bold">/tháng</span>
            </p>
          </div>
        </div>

        {house.description && (
          <div className="mt-6 p-6 bg-slate-50/70 rounded-2xl border border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Giới thiệu</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{house.description}</p>
          </div>
        )}

        {house.rules && (
          <div className="mt-4 p-6 bg-blue-50/30 rounded-2xl border border-[#0075de]/10">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#0075de]/60 mb-2">Nội quy nhà trọ</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{house.rules}</p>
          </div>
        )}
      </div>

      {/* Room Types Grid */}
      <div className="container mx-auto px-4 md:px-8 mt-12 pb-24">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Danh sách phòng</span>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mt-0.5">
              Các kiểu phòng hiện có ({roomTypes.length})
            </h2>
          </div>
        </div>

        {roomTypes.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-8">
            <Home className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-black text-slate-800 mb-1">Chưa có kiểu phòng nào</h3>
            <p className="text-xs text-slate-400 font-bold">Nhà trọ này chưa thêm kiểu phòng.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
            {roomTypes.map((rt) => (
              <Link
                key={rt.id}
                href={`/rooms/${rt.id}`}
                className="group flex flex-col space-y-3.5 cursor-pointer transition-all hover:scale-[1.01]"
              >
                <div className="relative aspect-[3/4] w-full bg-slate-100 overflow-hidden rounded-[1.8rem] border border-slate-100 shadow-sm">
                  <IDBImage
                    src={roomImages[rt.id] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800'}
                    alt={rt.name}
                    className="object-cover w-full h-full absolute inset-0 group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4 bg-[#0075de]/90 text-white backdrop-blur-sm px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider z-10 shadow-sm">
                    {rt.price_from.toLocaleString('vi-VN')}đ/tháng
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    <span className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                    <span className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                  </div>
                </div>
                <div className="px-1.5 space-y-2 text-left">
                  <h3 className="font-extrabold text-slate-800 text-[14px] md:text-[15px] group-hover:text-[#0075de] transition-colors leading-tight line-clamp-1">
                    {rt.name}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                    <div className="flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5 text-[#0075de]/75" />
                      <span>{rt.area} m²</span>
                    </div>
                    <div className="w-[1px] h-3 bg-slate-200" />
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#0075de]/75" />
                      <span>Tối đa {rt.max_people} người</span>
                    </div>
                  </div>
                  {rt.utilities && rt.utilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {rt.utilities.slice(0, 3).map((ut, idx) => (
                        <span key={idx} className="bg-slate-50 text-slate-400 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                          {ut}
                        </span>
                      ))}
                      {rt.utilities.length > 3 && (
                        <span className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full text-[9px] font-bold">
                          +{rt.utilities.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-50">
                    <p className="text-xs md:text-sm font-black text-[#0075de]">
                      {rt.price_from.toLocaleString('vi-VN')}đ
                      <span className="text-[10px] text-slate-400 font-bold">/tháng</span>
                    </p>
                    <span className="text-[10px] font-black text-[#0075de]/70 uppercase tracking-wider flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                      Chi tiết <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-16 text-center p-10 bg-gradient-to-br from-[#0075de]/5 to-blue-50/30 rounded-xl border border-[#0075de]/10">
          <h3 className="text-lg font-black text-slate-800 mb-2">Cần tư vấn thêm?</h3>
          <p className="text-xs text-slate-400 font-bold mb-6">Liên hệ môi giới để được hỗ trợ xem phòng miễn phí</p>
          <Button className="bg-[#0075de] hover:bg-[#0075de]/90 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md shadow-[#0075de]/15 flex items-center gap-2 mx-auto">
            <Phone className="w-4 h-4" />
            Liên hệ ngay
          </Button>
        </div>
      </div>
    </main>
  );
}
