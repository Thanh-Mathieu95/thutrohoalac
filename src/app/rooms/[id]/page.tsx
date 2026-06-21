// src/app/rooms/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, Maximize2, Users, ChevronLeft, ChevronRight, Share2, Heart, Star,
  LayoutGrid, Phone, MessageSquare, Calendar, ShieldCheck, Play, X, CheckCircle,
  Snowflake, ShowerHead, BedDouble, Bed, DoorClosed, Table, Sofa, WashingMachine,
  CookingPot, Fence, Grid, ArrowUpDown, Refrigerator, PlugZap, ZoomIn, ZoomOut,
  Wifi, Fingerprint, Clock, Tv, Sparkles, Camera
} from 'lucide-react';
import { db } from '@/lib/db';
import { RoomType, BoardingHouse, RoomTypeImage, BoardingHouseImage, UserProfile } from '@/lib/supabase';
import { IDBImage } from '@/components/idb-image';

const AreaMap = dynamic(() => import('@/components/area-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400 animate-pulse">
      ĐANG TẢI BẢN ĐỒ KHU VỰC...
    </div>
  ),
});

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [house, setHouse] = useState<BoardingHouse | null>(null);
  const [approvedImages, setApprovedImages] = useState<RoomTypeImage[]>([]);
  const [bhImages, setBhImages] = useState<BoardingHouseImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [houseRoomTypes, setHouseRoomTypes] = useState<RoomType[]>([]);
  const [owner, setOwner] = useState<UserProfile | null>(null);


  // UI States
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  // Booking Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [message, setMessage] = useState('Tôi muốn hẹn lịch xem phòng trọ này.');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('14:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const rt = await db.getRoomTypeById(id);
        if (rt) {
          setRoomType(rt);
          const bh = await db.getBoardingHouseById(rt.boarding_house_id);
          setHouse(bh);

          if (bh && bh.owner_id) {
            const own = await db.getOwnerById(bh.owner_id);
            setOwner(own);
          }
          
          // Get approved images for room type
          const rtImgs = await db.getRoomTypeImages(rt.id, 'approved');
          setApprovedImages(rtImgs);

          // Get approved house images
          const bhImgs = await db.getBoardingHouseImages(rt.boarding_house_id, 'approved');
          setBhImages(bhImgs);

          // Get all room types inside the same house
          const allHouseRoomTypes = await db.getRoomTypes({ boarding_house_id: rt.boarding_house_id });
          setHouseRoomTypes(allHouseRoomTypes);
        }
      } catch (e) {
        console.error('Failed to load room details', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);


  useEffect(() => {
    if (id) {
      const favs = JSON.parse(localStorage.getItem('salehung_favorites') || '[]');
      setIsFavorite(favs.includes(id));
    }
  }, [id]);

  const toggleFavorite = () => {
    if (!id) return;
    const favs = JSON.parse(localStorage.getItem('salehung_favorites') || '[]');
    let nextFavs;
    if (isFavorite) {
      nextFavs = favs.filter((fId: number) => fId !== id);
    } else {
      nextFavs = [...favs, id];
    }
    localStorage.setItem('salehung_favorites', JSON.stringify(nextFavs));
    setIsFavorite(!isFavorite);
  };

  const allDisplayImages = approvedImages.map(i => i.image_url);
  const displayImages = allDisplayImages.slice(0, 5);
  const mainImage = displayImages[0] || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800';
  const lightboxImages = allDisplayImages.length > 0 ? allDisplayImages : [mainImage];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowRight') {
        setIsZoomed(false);
        setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
      } else if (e.key === 'ArrowLeft') {
        setIsZoomed(false);
        setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, lightboxImages.length]);

  const handlePrev = () => {
    setIsZoomed(false);
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  };

  const handleNext = () => {
    setIsZoomed(false);
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };


  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomType || !customerName || !customerPhone || !appointmentDate) return;

    setIsSubmitting(true);
    try {
      // 1. Create Lead
      const lead = await db.createLead({
        customer_name: customerName,
        customer_phone: customerPhone,
        room_type_id: roomType.id,
        message: `${message} (Hẹn xem vào: ${appointmentDate} lúc ${appointmentTime})`,
        status: 'new'
      });

      // 2. Create Appointment
      const appointmentDateTime = `${appointmentDate}T${appointmentTime}:00`;
      await db.createAppointment({
        lead_id: lead.id,
        appointment_time: new Date(appointmentDateTime).toISOString(),
        status: 'scheduled',
        note: 'Đặt lịch trực tiếp từ website của khách thuê.'
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
        setCustomerName('');
        setCustomerPhone('');
        setAppointmentDate('');
      }, 3000);
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4 font-bold text-xs text-gray-400">
        <div className="w-10 h-10 border-4 border-[#0075de] border-t-transparent rounded-full animate-spin" />
        <span>ĐANG TẢI CHI TIẾT PHÒNG TRỌ...</span>
      </div>
    );
  }

  if (!roomType || !house) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-black text-gray-900 mb-2">Không tìm thấy phòng trọ</h2>
        <p className="text-sm text-gray-500 mb-8 max-w-sm">Phòng trọ này có thể đã bị gỡ bỏ hoặc thông tin không chính xác.</p>
        <Button onClick={() => router.push('/rooms')} className="bg-[#0075de] text-white rounded-xl">Quay lại danh sách</Button>
      </div>
    );
  }



  // Broker contact info (fixed)
  const brokerPhone = '0392788026';
  const brokerName = 'Nguyễn Đức Hùng';
  const ownerPhone = owner?.phone || '0912345678';
  const ownerName = owner?.name || 'Sale Hùng';

  return (
    <div className="min-h-screen bg-[#f6f5f4] pb-24">
      {/* Container */}
      <main className="container mx-auto px-4 md:px-8 pt-8">
        
        {/* Breadcrumbs & Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-1.5 text-xs font-black uppercase text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={copyShareLink} 
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-xs font-black text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" /> 
              <span>{copiedLink ? 'Đã copy!' : 'Chia sẻ'}</span>
            </button>
            
            <button 
              onClick={toggleFavorite} 
              className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-black transition-all active:scale-95 ${
                isFavorite 
                  ? 'border-red-100 bg-red-50 text-red-500' 
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} /> 
              <span>{isFavorite ? 'Đã lưu' : 'Lưu tin'}</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#0075de] bg-[#0075de]/10 px-4 py-1.5 rounded-full inline-block">
            {house.name}
          </span>
          <h1 className="text-2xl md:text-3xl font-heading font-black text-gray-900 tracking-tight leading-tight">
            {roomType.name} — Diện tích {roomType.area}m²
          </h1>
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{house.address}</span>
          </div>
        </div>

        {/* Asymmetric Gallery Layout (1 big left, 4 small right) */}
        <div className="relative group rounded-xl overflow-hidden mb-12 border border-gray-100 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[300px] md:h-[480px]">
            {/* 1 Big Main Image (Left) */}
            <div className="md:col-span-2 relative h-full bg-gray-50">
              <IDBImage 
                src={mainImage} 
                alt="Main view" 
                className="object-cover w-full h-full absolute inset-0 cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => { setLightboxIndex(0); setIsLightboxOpen(true); }}
                loading="eager"
              />
            </div>
            
            {/* 4 Small Images (Right) */}
            <div className="hidden md:grid grid-cols-2 col-span-2 gap-2 h-full">
              {[1, 2, 3, 4].map((i) => {
                const img = displayImages[i];
                return (
                  <div key={i} className="relative h-full bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center">
                    {img ? (
                      <IDBImage 
                        src={img} 
                        alt={`Detail view ${i}`} 
                        className="object-cover w-full h-full absolute inset-0 cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => { setLightboxIndex(i); setIsLightboxOpen(true); }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300/70 select-none">
                        <Camera className="w-5 h-5 mb-1" />
                        <span className="text-[9px] font-black uppercase tracking-wider">Trống</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            onClick={() => { setLightboxIndex(0); setIsLightboxOpen(true); }}
            className="absolute bottom-6 right-6 bg-white border border-gray-200 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-gray-50 shadow-lg"
          >
            <LayoutGrid className="w-4 h-4 text-gray-500" /> 
            Xem tất cả ảnh ({allDisplayImages.length} ảnh)
          </button>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column (Main details) */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Overview specs */}
            <div className="border-b border-gray-100 pb-8 flex flex-wrap gap-8 justify-start">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Diện tích</span>
                <span className="text-lg font-black text-gray-900 mt-1 flex items-center gap-1.5">
                  <Maximize2 className="w-4 h-4 text-[#0075de]" /> {roomType.area} m²
                </span>
              </div>
              <div className="w-px h-8 bg-gray-100 hidden sm:block align-middle my-auto" />
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Số người ở tối đa</span>
                <span className="text-lg font-black text-gray-900 mt-1 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#0075de]" /> {roomType.max_people} người
                </span>
              </div>

            </div>

            {/* Room description */}
            <div className="space-y-4">
              <h3 className="text-xl font-heading font-black text-gray-900 tracking-tight">Mô Tả Căn Phòng</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-line">
                {roomType.description || 'Chưa có thông tin mô tả chi tiết cho loại phòng này.'}
              </p>
            </div>

            {/* Danh sách phòng trống thực tế trong tòa */}
            <div className="space-y-5 pt-8 border-t border-gray-100">
              <h3 className="text-xl font-heading font-black text-gray-900 tracking-tight flex items-center gap-2">
                🏢 Tình Trạng Các Phòng Chi Tiết
              </h3>
              {(!roomType.rooms || roomType.rooms.length === 0) ? (
                <p className="text-sm text-gray-500 font-medium bg-white border border-[#e6e6e6] p-5 rounded-xl shadow-sm">
                  Hiện tại tòa nhà chưa cấu hình danh sách phòng cụ thể, vui lòng liên hệ Sale Hùng để nhận thông tin cập nhật mới nhất.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Hiện trạng chi tiết ({roomType.rooms.filter((r: any) => r.available).length} phòng trống / {roomType.rooms.length} phòng):
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {roomType.rooms.map((pRoom: any, idx: number) => (
                      <div
                        key={idx}
                        className={`px-4 py-3.5 border rounded-2xl flex items-center gap-2.5 text-xs font-black uppercase tracking-wider shadow-sm ${
                          pRoom.available
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-700'
                            : 'bg-gray-100 border-gray-200 text-gray-400 opacity-70'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${pRoom.available ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                        <span>{pRoom.name}</span>
                        <span className="text-[10px] font-bold lowercase tracking-normal">
                          ({pRoom.available ? 'Còn trống' : 'Đã thuê'})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Video walkthrough if exists */}
            {roomType.video_url && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-xl font-heading font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <Play className="w-5 h-5 text-red-500 fill-current" /> Video Thực Tế Căn Phòng
                </h3>
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg relative border border-gray-100">
                  <iframe 
                    className="w-full h-full border-0"
                    src={roomType.video_url.includes('embed') ? roomType.video_url : `https://www.youtube.com/embed/${roomType.video_url.split('v=')[1]?.split('&')[0] || 'dQw4w9WgXcQ'}`}
                    title={`${roomType.name} Video walkthrough`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <p className="text-[10px] font-bold text-gray-400 italic">
                  * Video được môi giới Sale Hùng quay trực tiếp tại hiện trường căn hộ, đảm bảo hình ảnh đúng thực tế 100%.
                </p>
              </div>
            )}



            {/* ── AMENITIES FULL GRID ── */}
            <div className="space-y-5 pt-8 border-t border-gray-100">
              <h3 className="text-xl font-heading font-black text-gray-900 tracking-tight">
                🛋️ Nội Thất & Tiện Nghi
              </h3>
              {(() => {
                const ALL_AMENITIES = [
                  { key: 'Điều hòa', icon: <Snowflake className="w-5 h-5 text-sky-500" />, label: 'Điều hòa' },
                  { key: 'Nóng lạnh', icon: <ShowerHead className="w-5 h-5 text-blue-500" />, label: 'Nóng lạnh' },
                  { key: 'Giường', icon: <BedDouble className="w-5 h-5 text-amber-700" />, label: 'Giường' },
                  { key: 'Đệm', icon: <Bed className="w-5 h-5 text-amber-500" />, label: 'Đệm' },
                  { key: 'Tủ quần áo', icon: <DoorClosed className="w-5 h-5 text-rose-600" />, label: 'Tủ quần áo' },
                  { key: 'Bàn', icon: <Table className="w-5 h-5 text-stone-500" />, label: 'Bàn' },
                  { key: 'Ghế', icon: <Sofa className="w-5 h-5 text-indigo-500" />, label: 'Ghế' },
                  { key: 'Máy giặt riêng', icon: <WashingMachine className="w-5 h-5 text-teal-500" />, label: 'Máy giặt riêng' },
                  { key: 'Bếp / Kệ bếp', icon: <CookingPot className="w-5 h-5 text-orange-500" />, label: 'Bếp / Kệ bếp' },
                  { key: 'Ban công', icon: <Fence className="w-5 h-5 text-emerald-500" />, label: 'Ban công' },
                  { key: 'Cửa sổ', icon: <Grid className="w-5 h-5 text-sky-500" />, label: 'Cửa sổ' },
                  { key: 'Máy giặt chung', icon: <WashingMachine className="w-5 h-5 text-teal-400" />, label: 'Máy giặt chung' },
                  { key: 'Thang máy', icon: <ArrowUpDown className="w-5 h-5 text-purple-500" />, label: 'Thang máy' },
                  { key: 'Tủ lạnh', icon: <Refrigerator className="w-5 h-5 text-cyan-600" />, label: 'Tủ lạnh' },
                  { key: 'Sạc xe điện', icon: <PlugZap className="w-5 h-5 text-yellow-500" />, label: 'Sạc xe điện' },
                  { key: 'Wifi', icon: <Wifi className="w-5 h-5 text-blue-400" />, label: 'Wifi' },
                  { key: 'Khóa vân tay', icon: <Fingerprint className="w-5 h-5 text-indigo-600" />, label: 'Khóa vân tay' },
                  { key: 'Giờ giấc tự do', icon: <Clock className="w-5 h-5 text-green-500" />, label: 'Giờ giấc tự do' },
                  { key: 'Kệ tivi', icon: <Tv className="w-5 h-5 text-red-500" />, label: 'Kệ tivi' },
                  { key: 'Bếp nấu ăn', icon: <CookingPot className="w-5 h-5 text-orange-500" />, label: 'Bếp nấu ăn' },
                  { key: 'Sofa', icon: <Sofa className="w-5 h-5 text-indigo-500" />, label: 'Sofa' },
                ];

                const roomUtils = roomType.utilities || [];
                
                // Available are all the utilities present in the room type
                const available = roomUtils.map((ut: string) => {
                  const matched = ALL_AMENITIES.find(a => a.key.toLowerCase() === ut.toLowerCase());
                  return {
                    key: ut,
                    label: ut,
                    icon: matched ? matched.icon : <Sparkles className="w-5 h-5 text-indigo-500" />
                  };
                });

                return (
                  <div className="space-y-4">
                    {/* Available */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {available.map((a) => (
                        <div key={a.key} className="flex items-center gap-3 bg-white border border-[#e6e6e6] px-4 py-3 rounded-xl shadow-sm">
                          <span className="flex items-center justify-center shrink-0">{a.icon}</span>
                          <span className="text-xs font-bold text-slate-700 capitalize">{a.label}</span>
                          <span className="ml-auto text-[#0075de] text-sm font-black">✓</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Boarding house general details */}
            <div className="space-y-4 pt-8 border-t border-gray-100 p-8 bg-white rounded-xl border border-[#e6e6e6] shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0075de]">Chi tiết tòa nhà trọ</span>
              <h3 className="text-xl font-heading font-black text-gray-900 tracking-tight mt-1">Thông Tin Chung & Quy Định</h3>
              
              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Mô tả tòa nhà</h4>
                  <p className="text-xs font-bold text-gray-600 mt-1 leading-relaxed">{house.description || 'Tòa nhà đầy đủ tiện nghi, môi trường sạch sẽ an ninh.'}</p>
                </div>
                
                {house.rules && (
                  <div>
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Nội quy & Quy định chung</h4>
                    <p className="text-xs font-bold text-gray-600 mt-1 leading-relaxed">{house.rules}</p>
                  </div>
                )}

                {/* Common area images thumbnail grid */}
                {bhImages.length > 1 && (
                  <div>
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">Ảnh khu vực chung</h4>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {bhImages.slice(1, 5).map((img, idx) => (
                        <div key={idx} className="relative w-20 h-16 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                          <IDBImage src={img.image_url} alt="common area" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* ── BẢN ĐỒ VỊ TRÍ KHU VỰC ── */}
            {house.latitude && house.longitude && (
              <div className="space-y-4 pt-8 border-t border-gray-100 p-8 bg-white rounded-xl border border-[#e6e6e6] shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0075de]">Bản đồ & Di chuyển</span>
                <h3 className="text-xl font-heading font-black text-gray-900 tracking-tight mt-1">Vị Trí Bản Đồ</h3>
                <p className="text-xs text-slate-500 font-semibold italic">
                  * Bản đồ định vị khu vực nhà trọ và tính toán khoảng cách thực tế đến các trường đại học lân cận.
                </p>
                <div className="mt-4">
                  <AreaMap latitude={house.latitude} longitude={house.longitude} />
                </div>
              </div>
            )}



          </div>

          {/* Right Column (Sticky CTA Booking box) */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              
              {/* House Room Types Switcher Card */}
              {houseRoomTypes.length > 1 && (
                <Card className="border border-[#e6e6e6] shadow-sm rounded-xl overflow-hidden bg-white animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center gap-2 border-b border-gray-50 pb-4">
                      <span className="text-sm font-black text-gray-900 uppercase tracking-wider">Danh sách kiểu phòng</span>
                      <span className="text-[10px] font-black uppercase text-[#0075de] bg-[#0075de]/10 px-2.5 py-1 rounded-full shrink-0">
                        {houseRoomTypes.length} kiểu
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {houseRoomTypes.map((rt) => {
                        const isCurrent = rt.id === roomType.id;
                        return (
                          <button
                            key={rt.id}
                            onClick={() => {
                              if (!isCurrent) {
                                router.push(`/rooms/${rt.id}`);
                              }
                            }}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all active:scale-95 cursor-pointer ${
                              isCurrent
                                ? 'border-[#0075de] bg-[#0075de] text-white shadow-sm'
                                : 'border-[#e6e6e6] bg-white hover:bg-slate-50 text-gray-800'
                            }`}
                          >
                            <span className="text-xs font-black truncate w-full">{rt.name}</span>
                            <span className={`text-[10px] font-bold mt-1 ${isCurrent ? 'text-white/80' : 'text-gray-400'}`}>
                              {rt.price_from.toLocaleString('vi-VN')}đ
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Main Booking Card */}
              <Card className="border border-[#e6e6e6] shadow-sm rounded-xl overflow-hidden bg-white">
                <CardContent className="p-8">
                  {/* Detailed Pricing info */}
                  <div className="pb-6 border-b border-gray-100 mb-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Chi phí hàng tháng</span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-500">Giá phòng</span>
                        <span className="text-sm font-black text-[#0075de]">
                          {roomType.price_from.toLocaleString('vi-VN')}đ<span className="text-[10px] text-gray-400 font-medium">/tháng</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-500">Phí dịch vụ</span>
                        <span className="text-sm font-black text-emerald-600">
                          {(roomType.service_fee ?? 0).toLocaleString('vi-VN')}đ<span className="text-[10px] text-gray-400 font-medium">/tháng</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-500">Tiền điện</span>
                        <span className="text-sm font-black text-amber-600">
                          {(roomType.electricity_price ?? 3500).toLocaleString('vi-VN')}đ<span className="text-[10px] text-gray-400 font-medium">/kWh</span>
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#f6f5f4] rounded-xl p-4 flex flex-col gap-1 border border-[#e6e6e6]">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ước tính tổng chi phí/tháng</span>
                      <span className="text-sm font-black text-slate-900">
                        {(roomType.price_from + (roomType.service_fee ?? 0) + (roomType.electricity_price ?? 3500) * 80).toLocaleString('vi-VN')}đ+
                      </span>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Thông tin phòng đã được xác minh thực tế</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                      <Star className="w-5 h-5 text-yellow-500 shrink-0 fill-current" />
                      <span>Hỗ trợ xem phòng trực tiếp miễn phí 100%</span>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="space-y-2">
                    <Button 
                      onClick={() => setIsModalOpen(true)}
                      className="w-full bg-[#0075de] hover:bg-[#005bab] text-white font-black h-14 rounded-full text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <Calendar className="w-4 h-4" /> Đặt lịch xem phòng trọ
                    </Button>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        asChild 
                        variant="outline"
                        className="border border-[#e6e6e6] text-gray-700 font-black h-12 rounded-full text-[10px] uppercase tracking-wider hover:bg-slate-50 flex items-center justify-center gap-1.5 active:scale-95 transition-all bg-white shadow-sm"
                      >
                        <a href={`tel:${brokerPhone}`}>
                          <Phone className="w-3.5 h-3.5 text-[#0075de]" /> Gọi điện
                        </a>
                      </Button>
                      <Button 
                        asChild 
                        variant="outline"
                        className="border border-[#e6e6e6] text-gray-700 font-black h-12 rounded-full text-[10px] uppercase tracking-wider hover:bg-slate-50 flex items-center justify-center gap-1.5 active:scale-95 transition-all bg-white shadow-sm"
                      >
                        <a href={`https://zalo.me/${brokerPhone}`} target="_blank" rel="noopener noreferrer">
                          <MessageSquare className="w-3.5 h-3.5 text-sky-500 fill-sky-500/10" /> Nhắn Zalo
                        </a>
                      </Button>
                      <Button 
                        asChild 
                        variant="outline"
                        className="border border-[#e6e6e6] text-gray-700 font-black h-12 rounded-full text-[10px] uppercase tracking-wider hover:bg-slate-50 flex items-center justify-center gap-1.5 active:scale-95 transition-all bg-white shadow-sm"
                      >
                        <a href="https://www.facebook.com/profile.php?id=61590882011264" target="_blank" rel="noopener noreferrer">
                          <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> Facebook
                        </a>
                      </Button>
                    </div>
                  </div>

                  <p className="text-center text-[10px] font-bold text-gray-400 mt-6 uppercase tracking-wider">
                    Liên hệ môi giới: {brokerName} ({brokerPhone})
                  </p>
                </CardContent>
              </Card>


            </div>
          </div>

        </div>

      </main>

      {/* 1. PREMIUM ZOOMABLE LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex flex-col p-4 animate-in fade-in duration-200">
          {/* Header */}
          <div className="h-16 flex items-center justify-between text-white border-b border-white/10 shrink-0 px-4">
            <div className="flex flex-col">
              <h4 className="font-heading font-black text-sm uppercase tracking-wider">
                {roomType.name}
              </h4>
              <span className="text-[10px] text-gray-400 font-bold">
                Ảnh {lightboxIndex + 1} / {lightboxImages.length}
              </span>
            </div>
            
            {/* Keyboard hints (desktop) */}
            <span className="hidden md:inline text-[10px] text-gray-500 font-bold bg-white/5 px-3 py-1.5 rounded-full">
              Dùng phím ← → để chuyển ảnh • ESC để đóng
            </span>

            <div className="flex items-center gap-2">
              {/* Zoom Button */}
              <button 
                onClick={() => setIsZoomed(!isZoomed)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
                title={isZoomed ? "Thu nhỏ" : "Phóng to"}
              >
                {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
                <span className="hidden sm:inline">{isZoomed ? 'Thu nhỏ' : 'Phóng to'}</span>
              </button>

              {/* Close Button */}
              <button 
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Main Slider Area */}
          <div className="flex-1 flex items-center justify-between relative px-2 sm:px-12 my-4">
            {/* Prev Button */}
            {lightboxImages.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-4 z-10 p-3 bg-black/40 hover:bg-black/60 active:scale-95 text-white rounded-full transition-all border border-white/10 hover:border-white/20"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Zoomable Image Container */}
            <div 
              onMouseMove={handleMouseMove}
              onClick={() => setIsZoomed(!isZoomed)}
              className={`relative flex-1 flex items-center justify-center overflow-hidden w-full h-[65vh] select-none ${
                isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
            >
              <IDBImage 
                src={lightboxImages[lightboxIndex]} 
                alt={`Room view ${lightboxIndex + 1}`}
                className="max-h-full max-w-full object-contain transition-transform duration-200 ease-out pointer-events-none"
                style={{
                  transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
                  transformOrigin: isZoomed ? `${mousePos.x}% ${mousePos.y}%` : 'center',
                }}
              />
            </div>

            {/* Next Button */}
            {lightboxImages.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-4 z-10 p-3 bg-black/40 hover:bg-black/60 active:scale-95 text-white rounded-full transition-all border border-white/10 hover:border-white/20"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Thumbnail Strip */}
          <div className="flex gap-2 justify-center overflow-x-auto pb-4 pt-2 shrink-0 px-4 max-w-full">
            {lightboxImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsZoomed(false);
                  setLightboxIndex(idx);
                }}
                className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border transition-all ${
                  idx === lightboxIndex 
                    ? 'border-[#0075de] ring-2 ring-[#0075de]/30 scale-105' 
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <IDBImage src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. CTA BOOKING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-xl p-8 border border-[#e6e6e6] shadow-xl relative animate-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>

            {submitSuccess ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-heading font-black text-gray-900 tracking-tight">Đặt Lịch Hẹn Thành Công!</h3>
                <p className="text-xs text-gray-500 font-bold max-w-sm mx-auto leading-relaxed">
                  Thông tin lịch hẹn đã được gửi tới hệ thống. Môi giới **Sale Hùng** sẽ liên hệ lại với bạn trong vòng 5 phút để xác nhận. Cảm ơn bạn!
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-6">
                <div>
                  <h3 className="text-2xl font-heading font-black text-gray-900 tracking-tight">Đặt Lịch Xem Phòng</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mt-1">Hỗ trợ đưa đón xem phòng hoàn toàn miễn phí</p>
                </div>

                <div className="space-y-4">
                  {/* Name input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Họ và tên của bạn</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Nguyễn Văn A" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-white border border-[#e6e6e6] focus:border-[#0075de] rounded-md px-4 py-3 text-xs font-bold outline-none text-gray-700 shadow-sm"
                    />
                  </div>

                  {/* Phone input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Số điện thoại liên hệ</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="09xxxxxxxx" 
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-white border border-[#e6e6e6] focus:border-[#0075de] rounded-md px-4 py-3 text-xs font-bold outline-none text-gray-700 shadow-sm"
                    />
                  </div>

                  {/* Message input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Lời nhắn yêu cầu</label>
                    <textarea 
                      rows={2}
                      placeholder="Tôi muốn xem phòng Deluxe..." 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-white border border-[#e6e6e6] focus:border-[#0075de] rounded-md px-4 py-3 text-xs font-bold outline-none text-gray-700 shadow-sm resize-none"
                    />
                  </div>

                  {/* Appointment DateTime */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Ngày muốn xem</label>
                      <input 
                         type="date" 
                        required
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="w-full bg-white border border-[#e6e6e6] focus:border-[#0075de] rounded-md px-4 py-3 text-xs font-bold outline-none text-gray-700 shadow-sm cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Giờ hẹn xem</label>
                      <input 
                        type="time" 
                        required
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="w-full bg-white border border-[#e6e6e6] focus:border-[#0075de] rounded-md px-4 py-3 text-xs font-bold outline-none text-gray-700 shadow-sm cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-[#0075de] hover:bg-[#005bab] text-white font-black h-14 rounded-full text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
                >
                  {isSubmitting ? 'ĐANG GỬI ĐĂNG KÝ...' : 'XÁC NHẬN ĐẶT LỊCH HẸN'}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
