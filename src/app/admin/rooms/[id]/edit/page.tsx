'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Save, ArrowLeft, Loader2, DollarSign, Zap, Wrench,
  Info, Video, Users, Maximize, CheckSquare, Square, Plus,
  Camera, Trash2, Check
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/db';
import { RoomType, RoomTypeImage } from '@/lib/supabase';
import { saveImageToIDB, compressImage } from '@/lib/image-store';
import { IDBImage } from '@/components/idb-image';

export default function EditRoomPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    price_from: '',
    service_fee: '',
    electricity_price: '',
    area: '',
    max_people: '',
    description: '',
    video_url: '',
  });

  const [selectedUtilities, setSelectedUtilities] = useState<string[]>([]);
  const [roomImages, setRoomImages] = useState<RoomTypeImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customAmenities, setCustomAmenities] = useState([
    { key: 'Điều hòa', icon: '❄️', label: 'Điều hòa' },
    { key: 'Nóng lạnh', icon: '🚿', label: 'Nóng lạnh' },
    { key: 'Giường', icon: '🛏️', label: 'Giường' },
    { key: 'Đệm', icon: '🟫', label: 'Đệm' },
    { key: 'Tủ quần áo', icon: '🚪', label: 'Tủ quần áo' },
    { key: 'Bàn', icon: '🪑', label: 'Bàn' },
    { key: 'Ghế', icon: '💺', label: 'Ghế' },
    { key: 'Máy giặt riêng', icon: '🫧', label: 'Máy giặt riêng' },
    { key: 'Bếp / Kệ bếp', icon: '🍳', label: 'Bếp / Kệ bếp' },
    { key: 'Ban công', icon: '🌿', label: 'Ban công' },
    { key: 'Cửa sổ', icon: '🪟', label: 'Cửa sổ' },
    { key: 'Máy giặt chung', icon: '🧺', label: 'Máy giặt chung' },
    { key: 'Thang máy', icon: '🛗', label: 'Thang máy' },
    { key: 'Tủ lạnh', icon: '🧊', label: 'Tủ lạnh' },
    { key: 'Sạc xe điện', icon: '⚡', label: 'Sạc xe điện' },
    { key: 'Wifi', icon: '📶', label: 'Wifi' },
    { key: 'Khóa vân tay', icon: '🫵', label: 'Khóa vân tay' },
    { key: 'Giờ giấc tự do', icon: '⏰', label: 'Giờ giấc tự do' },
    { key: 'Kệ tivi', icon: '📺', label: 'Kệ tivi' },
    { key: 'Bếp nấu ăn', icon: '🍳', label: 'Bếp nấu ăn' },
    { key: 'Sofa', icon: '🛋️', label: 'Sofa' },
  ]);
  const [newAmenityInput, setNewAmenityInput] = useState('');

  const handleAddNewAmenity = () => {
    const trimmed = newAmenityInput.trim();
    if (!trimmed) return;
    
    // Add to selectable list if not present
    if (!customAmenities.some(a => a.key.toLowerCase() === trimmed.toLowerCase())) {
      setCustomAmenities(prev => [...prev, { key: trimmed, icon: '✨', label: trimmed }]);
    }
    
    // Auto-select
    if (!selectedUtilities.includes(trimmed)) {
      setSelectedUtilities(prev => [...prev, trimmed]);
    }
    
    setNewAmenityInput('');
  };

  const loadImages = async () => {
    try {
      const imgs = await db.getRoomTypeImages(id);
      setRoomImages(imgs);
    } catch (err) {
      console.error('Lỗi khi tải ảnh kiểu phòng:', err);
    }
  };

  useEffect(() => {
    async function fetchRoom() {
      if (!id) return;
      try {
        const room = await db.getRoomTypeById(id);
        if (room) {
          setFormData({
            name: room.name || '',
            price_from: room.price_from?.toString() || '',
            service_fee: room.service_fee?.toString() || '0',
            electricity_price: room.electricity_price?.toString() || '3500',
            area: room.area?.toString() || '',
            max_people: room.max_people?.toString() || '2',
            description: room.description || '',
            video_url: room.video_url || '',
          });
          const utils = room.utilities || [];
          setSelectedUtilities(utils);
          
          // Merge custom amenities
          setCustomAmenities(prev => {
            const keys = prev.map(a => a.key.toLowerCase());
            const extra = utils
              .filter(u => !keys.includes(u.toLowerCase()))
              .map(u => ({
                key: u,
                icon: '✨',
                label: u
              }));
            return [...prev, ...extra];
          });

          // Fetch Room Images
          const imgs = await db.getRoomTypeImages(id);
          setRoomImages(imgs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRoom();
  }, [id]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleUtility = (key: string) => {
    setSelectedUtilities(prev =>
      prev.includes(key) ? prev.filter(u => u !== key) : [...prev, key]
    );
  };

  const MAX_IMAGES = 6;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (roomImages.length >= MAX_IMAGES) {
      alert(`Chỉ được đăng tối đa ${MAX_IMAGES} ảnh!`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    const remaining = MAX_IMAGES - roomImages.length;
    const filesToProcess = Array.from(files).slice(0, remaining);

    if (files.length > remaining) {
      alert(`Bạn chỉ có thể thêm ${remaining} ảnh nữa (giới hạn ${MAX_IMAGES} ảnh). Chỉ ${remaining} ảnh đầu tiên sẽ được tải lên.`);
    }

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh!');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File quá lớn! Vui lòng chọn ảnh dưới 10MB.');
        continue;
      }

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });

        const compressed = await compressImage(base64);
        const finalUrl = await saveImageToIDB(compressed);
        const hasMain = roomImages.some(img => img.image_type === 'main');

        await db.addRoomTypeImage({
          room_type_id: id,
          image_url: finalUrl,
          image_type: hasMain ? 'bedroom' : 'main',
          status: 'approved',
          sort_order: roomImages.length + 1
        });
      } catch (err: any) {
        console.error(err);
        alert(`Lỗi tải ảnh: ${err.message}`);
      }
    }
    
    await loadImages();
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ảnh này?')) return;
    try {
      await db.deleteRoomTypeImage(imageId);
      await loadImages();
    } catch (err) {
      alert('Lỗi khi xóa ảnh!');
    }
  };

  const handleSetMainImage = async (imageId: number) => {
    try {
      for (const img of roomImages) {
        if (img.id === imageId) {
          await db.updateRoomTypeImage(img.id, { image_type: 'main', sort_order: 1 });
        } else {
          await db.updateRoomTypeImage(img.id, { 
            image_type: img.image_type === 'main' ? 'bedroom' : img.image_type,
            sort_order: img.sort_order <= 1 ? img.sort_order + 1 : img.sort_order 
          });
        }
      }
      await loadImages();
      alert('Đã đặt làm ảnh chính thành công!');
    } catch (err) {
      alert('Lỗi khi đổi ảnh chính!');
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price_from) {
      alert('Vui lòng điền tên phòng và giá thuê!');
      return;
    }
    setIsSaving(true);
    try {
      await db.updateRoomType(id, {
        name: formData.name,
        price_from: Number(formData.price_from),
        service_fee: Number(formData.service_fee) || 0,
        electricity_price: Number(formData.electricity_price) || 3500,
        area: Number(formData.area) || 0,
        max_people: Number(formData.max_people) || 2,
        description: formData.description,
        video_url: formData.video_url,
        utilities: selectedUtilities,
      } as Partial<RoomType>);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        router.push('/admin');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      alert('Lỗi khi lưu: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-[#0075de] animate-spin" />
        <p className="text-gray-400 font-bold text-sm uppercase tracking-wider">Đang tải thông tin phòng...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <Link href="/admin" className="flex items-center gap-2 text-gray-400 hover:text-[#0075de] transition-colors text-xs font-black uppercase tracking-widest mb-3 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại Dashboard
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Chỉnh sửa kiểu phòng</h1>
          <p className="text-gray-400 mt-1 font-bold text-sm">ID phòng: #{id}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/admin')}
            className="rounded-2xl px-6 h-12 font-bold border-gray-200 hover:bg-gray-50">
            Hủy bỏ
          </Button>
          <Button onClick={handleSave} disabled={isSaving}
            className={`rounded-2xl px-8 h-12 font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 ${
              saveSuccess ? 'bg-emerald-600 text-white' : 'bg-[#0075de] text-white hover:bg-[#0075de]/90 shadow-[#0075de]/20'
            }`}>
            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</>
              : saveSuccess ? '✓ Đã lưu!'
              : <><Save className="w-4 h-4 mr-2" />Lưu thay đổi</>}
          </Button>
        </div>
      </div>

      <div className="space-y-6">

        {/* ── THÔNG TIN CƠ BẢN ── */}
        <SectionCard icon={<Info className="w-5 h-5" />} title="Thông tin cơ bản" color="blue">
          <div className="space-y-5">
            <Field label="Tên kiểu phòng *">
              <input name="name" value={formData.name} onChange={handleInput}
                placeholder="VD: Phòng Deluxe, Studio Cao Cấp..."
                className="input-base" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Diện tích (m²)">
                <div className="relative">
                  <Maximize className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input name="area" value={formData.area} onChange={handleInput}
                    type="number" placeholder="20" className="input-base pl-10" />
                </div>
              </Field>
              <Field label="Số người tối đa">
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input name="max_people" value={formData.max_people} onChange={handleInput}
                    type="number" placeholder="2" className="input-base pl-10" />
                </div>
              </Field>
            </div>
            <Field label="Mô tả phòng">
              <textarea name="description" value={formData.description} onChange={handleInput}
                rows={4} placeholder="Mô tả chi tiết về phòng trọ..."
                className="input-base resize-none" />
            </Field>
            <Field label="Link Video YouTube">
              <div className="relative">
                <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input name="video_url" value={formData.video_url} onChange={handleInput}
                  placeholder="https://www.youtube.com/watch?v=..." className="input-base pl-10" />
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* ── CHI PHÍ HÀNG THÁNG ── */}
        <SectionCard icon={<DollarSign className="w-5 h-5" />} title="Chi phí hàng tháng" color="green">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Field label="💰 Giá phòng (đ/tháng) *">
              <input name="price_from" value={formData.price_from} onChange={handleInput}
                type="number" placeholder="3500000"
                className="input-base font-black text-[#0075de]" />
              <p className="text-[10px] text-gray-400 font-bold mt-1 ml-1">
                {Number(formData.price_from) > 0 ? Number(formData.price_from).toLocaleString('vi-VN') + 'đ' : ''}
              </p>
            </Field>
            <Field label="🧾 Phí dịch vụ (đ/tháng)">
              <input name="service_fee" value={formData.service_fee} onChange={handleInput}
                type="number" placeholder="150000"
                className="input-base font-black text-emerald-700" />
              <p className="text-[10px] text-gray-400 font-bold mt-1 ml-1">
                {Number(formData.service_fee) > 0 ? Number(formData.service_fee).toLocaleString('vi-VN') + 'đ' : ''}
              </p>
            </Field>
            <Field label="⚡ Giá điện (đ/kWh)">
              <input name="electricity_price" value={formData.electricity_price} onChange={handleInput}
                type="number" placeholder="3500"
                className="input-base font-black text-amber-700" />
              <p className="text-[10px] text-gray-400 font-bold mt-1 ml-1">
                {Number(formData.electricity_price) > 0 ? Number(formData.electricity_price).toLocaleString('vi-VN') + 'đ/kWh' : ''}
              </p>
            </Field>
          </div>
          {/* Live total */}
          {(Number(formData.price_from) > 0) && (
            <div className="mt-4 bg-gray-50 rounded-2xl px-5 py-3.5 flex justify-between items-center border border-gray-100">
              <span className="text-xs font-black text-gray-500 uppercase tracking-wide">Ước tính tổng/tháng (80 kWh)</span>
              <span className="text-sm font-black text-gray-900">
                {(Number(formData.price_from) + Number(formData.service_fee || 0) + Number(formData.electricity_price || 3500) * 80).toLocaleString('vi-VN')}đ+
              </span>
            </div>
          )}
        </SectionCard>

        {/* ── NỘI THẤT & TIỆN NGHI ── */}
        <SectionCard icon={<Wrench className="w-5 h-5" />} title="Nội thất & Tiện nghi" color="purple">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-bold">
              Đã chọn: <span className="text-[#0075de] font-black">{selectedUtilities.length}/{customAmenities.length}</span>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setSelectedUtilities(customAmenities.map(a => a.key))}
                className="text-[10px] font-black uppercase tracking-wider text-[#0075de] hover:underline">
                Chọn tất cả
              </button>
              <span className="text-gray-200">|</span>
              <button onClick={() => setSelectedUtilities([])}
                className="text-[10px] font-black uppercase tracking-wider text-red-400 hover:underline">
                Bỏ tất cả
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {customAmenities.map((amenity) => {
              const isSelected = selectedUtilities.includes(amenity.key);
              return (
                <button
                  key={amenity.key}
                  type="button"
                  onClick={() => toggleUtility(amenity.key)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                    isSelected
                      ? 'bg-[#0075de]/5 border-[#0075de]/30 shadow-sm'
                      : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <span className={`text-xl transition-all ${isSelected ? '' : 'grayscale opacity-40'}`}>
                    {amenity.icon}
                  </span>
                  <span className={`text-xs font-black flex-1 ${isSelected ? 'text-[#0075de]' : 'text-gray-400'}`}>
                    {amenity.label}
                  </span>
                  {isSelected
                    ? <CheckSquare className="w-4 h-4 text-[#0075de] shrink-0" />
                    : <Square className="w-4 h-4 text-gray-200 shrink-0" />
                  }
                </button>
              );
            })}
          </div>
          {/* Form tự thêm tiện nghi */}
          <div className="flex gap-2 max-w-sm mt-5 pt-3 border-t border-gray-50">
            <input
              type="text"
              placeholder="Thêm tiện nghi tự nhập khác..."
              value={newAmenityInput}
              onChange={(e) => setNewAmenityInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNewAmenity();
                }
              }}
              className="flex-1 bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-xl px-4 py-2 text-xs font-bold outline-none text-gray-700 shadow-sm"
            />
            <button
              type="button"
              onClick={handleAddNewAmenity}
              className="bg-[#0075de] hover:bg-blue-600 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-md shadow-blue-500/10"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm
            </button>
          </div>
        </SectionCard>

        {/* ── QUẢN LÝ HÌNH ẢNH ── */}
        <SectionCard icon={<Camera className="w-5 h-5" />} title="Hình ảnh kiểu phòng" color="blue">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div 
                onClick={() => roomImages.length < MAX_IMAGES ? fileInputRef.current?.click() : undefined}
                className={`border-2 border-dashed rounded-2xl p-6 flex items-center justify-center gap-2 transition-all ${
                  roomImages.length >= MAX_IMAGES
                    ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                    : 'border-gray-200 hover:border-[#0075de] cursor-pointer active:scale-95 bg-gray-50/50'
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 text-[#0075de] animate-spin" />
                    <span className="text-xs font-bold text-gray-500">Đang tải ảnh lên...</span>
                  </>
                ) : roomImages.length >= MAX_IMAGES ? (
                  <>
                    <Plus className="w-4 h-4 text-gray-300" />
                    <span className="text-xs font-bold text-gray-400">Đã đạt giới hạn {MAX_IMAGES} ảnh — Xóa ảnh cũ để thêm mới</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-[#0075de]" />
                    <span className="text-xs font-bold text-[#0075de]">Tải ảnh thực tế mới lên • Còn {MAX_IMAGES - roomImages.length}/{MAX_IMAGES} ảnh</span>
                  </>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                multiple 
                className="hidden" 
              />
              <p className="text-[11px] text-gray-400 font-bold">Hỗ trợ định dạng JPG, PNG. Ảnh đầu tiên được thiết lập làm ảnh đại diện chính của phòng.</p>
            </div>

            {roomImages.length === 0 ? (
              <div className="py-10 text-center border rounded-2xl border-dashed border-gray-100 bg-gray-50/20">
                <Camera className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-400">Kiểu phòng này hiện tại chưa có hình ảnh nào.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {roomImages.map((img) => (
                  <div key={img.id} className="relative aspect-[4/3] rounded-2xl overflow-hidden group border border-gray-100">
                    <IDBImage src={img.image_url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-end">
                        <button 
                          type="button" 
                          onClick={() => handleDeleteImage(img.id)}
                          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {img.image_type !== 'main' ? (
                        <button 
                          type="button" 
                          onClick={() => handleSetMainImage(img.id)}
                          className="w-full py-2 bg-white text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#0075de] hover:text-white transition-all text-center"
                        >
                          Đặt làm ảnh chính
                        </button>
                      ) : (
                        <div className="w-full py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider text-center flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Ảnh chính hiện tại
                        </div>
                      )}
                    </div>
                    {img.image_type === 'main' && (
                      <span className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm">
                        Ảnh chính
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

      </div>
    </div>
  );
}

// ── Sub-components ──

function SectionCard({ icon, title, color, children }: {
  icon: React.ReactNode;
  title: string;
  color: 'blue' | 'green' | 'purple';
  children: React.ReactNode;
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-50 pb-5">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <h2 className="text-lg font-black text-gray-900 tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      {children}
    </div>
  );
}
