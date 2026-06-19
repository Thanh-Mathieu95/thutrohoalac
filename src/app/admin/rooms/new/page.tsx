'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  MapPin, 
  Video, 
  Info, 
  DollarSign, 
  Maximize, 
  Save, 
  ArrowLeft, 
  Plus, 
  X, 
  Navigation,
  Zap,
  Wifi,
  Trash2,
  Loader2,
  Users,
  CheckSquare,
  Square
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BoardingHouse } from '@/lib/supabase';
import { db } from '@/lib/db';
import { saveImageToIDB } from '@/lib/image-store';
import { IDBImage } from '@/components/idb-image';

const ALL_AMENITIES = [
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
  { key: 'Giờ giấc tự do', icon: '⏰', label: 'Giờ giấc tự do' }
];

export default function NewRoomPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [boardingHouses, setBoardingHouses] = useState<BoardingHouse[]>([]);
  const [selectedHouseId, setSelectedHouseId] = useState<string>('');
  const [isHouseLoading, setIsHouseLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    area: '',
    maxPeople: '2',
    description: '',
    videoUrl: '',
    electricity: '3500',
    service: '150000'
  });

  const [selectedUtilities, setSelectedUtilities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchHouses() {
      try {
        const list = await db.getBoardingHouses();
        setBoardingHouses(list);
        if (list.length > 0) {
          setSelectedHouseId(list[0].id.toString());
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách nhà trọ:', err);
      } finally {
        setIsHouseLoading(false);
      }
    }
    fetchHouses();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleUtility = (key: string) => {
    setSelectedUtilities(prev => 
      prev.includes(key) ? prev.filter(u => u !== key) : [...prev, key]
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImages = [...images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
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

        const finalUrl = await saveImageToIDB(base64);
        newImages.push(finalUrl);
      } catch (err: any) {
        console.error('Lỗi khi xử lý file ảnh:', err);
        alert(`Lỗi khi xử lý ảnh: ${err.message}`);
      }
    }

    setImages(newImages);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedHouseId) {
      alert("Vui lòng chọn hoặc tạo nhà trọ trước!");
      return;
    }
    if (!formData.title || !formData.price || !formData.area) {
      alert("Vui lòng điền các thông tin bắt buộc (*)");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Create Room Type
      const savedRoom = await db.createRoomType({
        boarding_house_id: Number(selectedHouseId),
        name: formData.title,
        price_from: Number(formData.price),
        service_fee: Number(formData.service) || 0,
        electricity_price: Number(formData.electricity) || 3500,
        area: Number(formData.area),
        max_people: Number(formData.maxPeople) || 2,
        description: formData.description,
        video_url: formData.videoUrl,
        utilities: selectedUtilities,
      });

      // 2. Add room type images
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          await db.addRoomTypeImage({
            room_type_id: savedRoom.id,
            image_url: images[i],
            image_type: i === 0 ? 'main' : 'bedroom',
            status: 'approved',
            sort_order: i + 1
          });
        }
      }

      alert("Đăng bài kiểu phòng mới thành công!");
      router.push('/admin');
    } catch (err: any) {
      console.error(err);
      alert("Lỗi khi lưu bài đăng: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedHouse = boardingHouses.find(h => h.id.toString() === selectedHouseId);

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <Link href="/admin" className="flex items-center gap-2 text-gray-500 hover:text-brand transition-colors text-sm font-bold mb-2 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại Dashboard
          </Link>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Đăng bài mới</h1>
          <p className="text-gray-500 mt-1 font-bold text-sm">Thêm một kiểu phòng cho thuê mới vào tòa nhà trọ.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleSave}
            disabled={isSaving || isHouseLoading || boardingHouses.length === 0}
            className="bg-brand hover:bg-brand-dark text-white rounded-2xl px-8 py-7 font-bold shadow-xl shadow-brand/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {isSaving ? 'Đang xử lý...' : <><Save className="w-5 h-5 mr-2" /> Đăng bài ngay</>}
          </Button>
        </div>
      </div>

      {isHouseLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Đang tải danh sách nhà trọ...</p>
        </div>
      ) : boardingHouses.length === 0 ? (
        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm text-center max-w-xl mx-auto space-y-5">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto">
            <MapPin className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Không tìm thấy nhà trọ nào!</h2>
            <p className="text-sm text-gray-400 mt-1">Hệ thống yêu cầu kiểu phòng phải thuộc một nhà trọ. Bạn cần tạo nhà trọ trước.</p>
          </div>
          <Link href="/owner" className="inline-block bg-[#0075de] hover:bg-[#0075de]/90 text-white rounded-2xl px-6 py-3.5 font-bold shadow-lg transition-all hover:scale-105 active:scale-95 text-sm">
            Tạo nhà trọ mới ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Main Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Section: Belonging House */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0075de]">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Nhà trọ thuộc về</h2>
                  <p className="text-sm text-gray-500">Chọn tòa nhà trọ chứa kiểu phòng này.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Chọn nhà trọ *</label>
                  <select 
                    value={selectedHouseId}
                    onChange={(e) => setSelectedHouseId(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-gray-900 cursor-pointer"
                  >
                    {boardingHouses.map(bh => (
                      <option key={bh.id} value={bh.id}>{bh.name}</option>
                    ))}
                  </select>
                </div>

                {selectedHouse && (
                  <div className="space-y-4 pt-4 border-t border-gray-50">
                    <div className="flex items-start gap-2.5">
                      <Navigation className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Địa chỉ</span>
                        <span className="text-sm font-bold text-gray-700">{selectedHouse.address}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Vĩ độ (Latitude)</span>
                        <span className="text-sm font-bold text-gray-600">{selectedHouse.latitude ?? '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Kinh độ (Longitude)</span>
                        <span className="text-sm font-bold text-gray-600">{selectedHouse.longitude ?? '—'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section: Info */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center text-brand">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Thông tin chi tiết kiểu phòng</h2>
                  <p className="text-sm text-gray-500">Tên kiểu phòng, giá cả và mô tả chi tiết.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Tên kiểu phòng *</label>
                  <input 
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="VD: Phòng Studio VIP, Phòng Deluxe ban công..." 
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Giá thuê (VNĐ/tháng) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="3500000" 
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent focus:border-brand/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-gray-900"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Diện tích (m²) *</label>
                    <div className="relative">
                      <Maximize className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        name="area"
                        value={formData.area}
                        onChange={handleInputChange}
                        placeholder="25" 
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent focus:border-brand/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-gray-900"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Số người tối đa</label>
                    <div className="relative">
                      <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        name="maxPeople"
                        value={formData.maxPeople}
                        onChange={handleInputChange}
                        placeholder="2" 
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent focus:border-brand/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Mô tả phòng</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Mô tả về không gian phòng, nội thất nổi bật, ban công phơi đồ..." 
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-gray-900 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Link Video YouTube</label>
                  <div className="relative">
                    <Video className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      name="videoUrl"
                      value={formData.videoUrl}
                      onChange={handleInputChange}
                      placeholder="https://www.youtube.com/watch?v=..." 
                      className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent focus:border-brand/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Utilities */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-gray-50 pb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Nội thất & Tiện nghi</h2>
                  <p className="text-sm text-gray-500">Tích chọn các tiện ích có sẵn trong phòng.</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSelectedUtilities(ALL_AMENITIES.map(a => a.key))}
                    className="text-[10px] font-black uppercase tracking-wider text-[#0075de] hover:underline">
                    Chọn tất cả
                  </button>
                  <span className="text-gray-200">|</span>
                  <button type="button" onClick={() => setSelectedUtilities([])}
                    className="text-[10px] font-black uppercase tracking-wider text-red-500 hover:underline">
                    Bỏ tất cả
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ALL_AMENITIES.map((amenity) => {
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
            </div>
          </div>

          {/* Right: Sidebar Form */}
          <div className="space-y-8">
            {/* Section: Images */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-brand" /> Hình ảnh thực tế
              </h3>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-100 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 hover:border-brand/20 transition-all cursor-pointer group"
              >
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-brand animate-spin mb-2" />
                    <p className="text-sm font-bold text-gray-700">Đang xử lý ảnh...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 bg-gray-50 group-hover:bg-white rounded-2xl flex items-center justify-center text-gray-300 group-hover:text-brand transition-all mb-3 shadow-sm">
                      <Plus className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-gray-700">Tải ảnh lên</p>
                    <p className="text-[11px] text-gray-400 mt-1">Hỗ trợ JPG, PNG (Max 10MB)</p>
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

              {images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ảnh đã chọn ({images.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100">
                        <IDBImage src={img} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-5 h-5 text-white" />
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 bg-[#0075de] text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                            Ảnh chính
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section: Services */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" /> Bảng giá dịch vụ
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Điện (số)</label>
                    <input name="electricity" value={formData.electricity} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-sm" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phí dịch vụ (tháng)</label>
                    <input name="service" value={formData.service} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
