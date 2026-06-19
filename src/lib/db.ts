// src/lib/db.ts
// Unified Relational Database Service (Supabase + High-Fidelity LocalStorage Fallback)

import { supabase, BoardingHouse, BoardingHouseImage, RoomType, RoomTypeImage, Lead, Appointment, UserProfile } from './supabase';
import { getImageFromIDB } from './image-store';

// Helper to convert base64 data-URL to Blob
function base64ToBlob(base64: string): Blob {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// Helper to upload a base64 (possibly stored in IDB) to Supabase Storage and return public URL
async function uploadToSupabaseStorage(imagePath: string, pathPrefix: string): Promise<string> {
  if (!imagePath.startsWith('idb:')) {
    return imagePath; // Already a direct URL or Unsplash URL
  }
  
  // 1. Retrieve the base64 from IDB
  const base64Data = await getImageFromIDB(imagePath);
  if (!base64Data || !base64Data.startsWith('data:')) {
    return imagePath; // Return original if not base64
  }

  try {
    // 2. Convert base64 to Blob
    const blob = base64ToBlob(base64Data);
    const mime = blob.type;
    const fileExt = mime.split('/').pop() || 'jpg';
    
    // 3. Generate a unique name
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${pathPrefix}/${fileName}`;

    // 4. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('thuetro_images')
      .upload(filePath, blob, {
        contentType: mime,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Failed to upload image to Supabase Storage:', error);
      throw error;
    }

    // 5. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('thuetro_images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error('Failed processing image upload:', err);
    return imagePath; // Fallback to raw path if anything throws
  }
}

const IS_SERVER = typeof window === 'undefined';

// --- SEED DATA FOR LOCALSTORAGE FALLBACK ---
const MOCK_PROFILES: UserProfile[] = [
  { id: 'admin-uuid-0001', name: 'Sale Hùng (Môi giới)', email: 'admin@salehung.com', role: 'admin', status: 'active', created_at: new Date().toISOString() },
  { id: 'owner-uuid-nam01', name: 'Anh Nam (Chủ trọ)', email: 'nam@gmail.com', role: 'owner', status: 'active', created_at: new Date().toISOString() },
  { id: 'owner-uuid-lan02', name: 'Chị Lan (Chủ trọ)', email: 'lan@gmail.com', role: 'owner', status: 'active', created_at: new Date().toISOString() },
];

const MOCK_BOARDING_HOUSES: BoardingHouse[] = [
  { id: 1, owner_id: 'owner-uuid-nam01', name: 'Chung Cư Mini Hola FPT', address: 'Khu FPT, Thôn Tân Xã, Xã Tân Xã, Thạch Thất, Hà Nội', description: 'Tòa nhà chung cư mini cao cấp, an ninh 24/7, nằm ngay trung tâm khu FPT Hòa Lạc, rất thuận tiện di chuyển tới Đại học FPT.', rules: 'Giờ giấc tự do, khóa vân tay, không nuôi thú cưng lớn, giữ gìn vệ sinh chung.', latitude: 21.0135, longitude: 105.5240, created_at: new Date().toISOString() },
  { id: 2, owner_id: 'owner-uuid-nam01', name: 'Trọ Sinh Viên ĐHQG', address: 'Khu ĐHQG, Thôn Làng, Xã Thạch Hòa, Thạch Thất, Hà Nội', description: 'Khu phòng trọ khép kín hiện đại gần Trường Đại học Quốc Gia Hà Nội cơ sở Hòa Lạc, đầy đủ tiện ích lân cận.', rules: 'Ra vào có khóa vân tay bảo mật, hạn chế làm ồn sau 23h.', latitude: 21.0370, longitude: 105.5140, created_at: new Date().toISOString() },
  { id: 3, owner_id: 'owner-uuid-nam01', name: 'Căn Hộ Dịch Vụ Thạch Hòa', address: 'Thạch Hòa, Thạch Thất, Hà Nội', description: 'Chung cư dịch vụ cao cấp có thang máy, hầm xe rộng rãi, vị trí trung tâm sát khu Công nghệ cao Hòa Lạc.', rules: 'Giờ giấc tự do, giữ vệ sinh, đóng tiền phòng đúng hạn ngày 5 hàng tháng.', latitude: 21.0260, longitude: 105.5280, created_at: new Date().toISOString() },
  { id: 4, owner_id: 'owner-uuid-lan02', name: 'Nhà Trọ Bình Yên Cozy', address: 'Bình Yên, Thạch Thất, Hà Nội', description: 'Khu nhà trọ sinh viên giá rẻ, an ninh, thoáng mát, khu vực Bình Yên yên tĩnh.', rules: 'Giờ giấc ra vào trước 23h, không tụ tập ăn uống ồn ào quá muộn.', latitude: 21.0210, longitude: 105.5350, created_at: new Date().toISOString() }
];

const MOCK_BOARDING_HOUSE_IMAGES: BoardingHouseImage[] = [
  // Trọ Nguyễn Văn Cừ
  { id: 1, boarding_house_id: 1, image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800', image_type: 'front', status: 'approved', sort_order: 1, created_at: new Date().toISOString() },
  { id: 2, boarding_house_id: 1, image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800', image_type: 'shared_area', status: 'approved', sort_order: 2, created_at: new Date().toISOString() },
  { id: 3, boarding_house_id: 1, image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800', image_type: 'parking', status: 'approved', sort_order: 3, created_at: new Date().toISOString() },
  // Trọ Võ Văn Ngân
  { id: 4, boarding_house_id: 2, image_url: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&q=80&w=800', image_type: 'front', status: 'approved', sort_order: 1, created_at: new Date().toISOString() },
  { id: 5, boarding_house_id: 2, image_url: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&q=80&w=800', image_type: 'parking', status: 'approved', sort_order: 2, created_at: new Date().toISOString() },
  // Trọ Bình Thạnh
  { id: 6, boarding_house_id: 3, image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800', image_type: 'front', status: 'approved', sort_order: 1, created_at: new Date().toISOString() },
  { id: 7, boarding_house_id: 3, image_url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800', image_type: 'hallway', status: 'approved', sort_order: 2, created_at: new Date().toISOString() },
  // Trọ Làng Đại Học
  { id: 8, boarding_house_id: 4, image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800', image_type: 'front', status: 'approved', sort_order: 1, created_at: new Date().toISOString() }
];

const MOCK_ROOM_TYPES: RoomType[] = [
  // Trọ Nguyễn Văn Cừ
  { id: 1, boarding_house_id: 1, name: 'Phòng Standard', price_from: 2800000, service_fee: 150000, electricity_price: 3500, area: 20, max_people: 2, description: 'Phòng trọ tiêu chuẩn, thiết kế tối giản, sạch sẽ, nhà vệ sinh khép kín trong phòng, có chỗ nấu ăn.', utilities: ['Điều hòa', 'Nóng lạnh', 'Giường', 'Tủ quần áo', 'Bàn', 'Ghế', 'Wifi'], video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', rooms: [{ name: 'P101', available: true }, { name: 'P102', available: false }, { name: 'P103', available: true }], created_at: new Date().toISOString() },
  { id: 2, boarding_house_id: 1, name: 'Phòng Deluxe', price_from: 3500000, service_fee: 200000, electricity_price: 3500, area: 25, max_people: 3, description: 'Căn hộ dịch vụ tiện nghi, cửa sổ lấy sáng tự nhiên, trang bị máy giặt riêng, tủ lạnh mini tiện lợi.', utilities: ['Điều hòa', 'Nóng lạnh', 'Giường', 'Đệm', 'Tủ quần áo', 'Tủ lạnh', 'Máy giặt riêng', 'Bếp / Kệ bếp', 'Bàn', 'Ghế', 'Cửa sổ', 'Wifi'], video_url: '', rooms: [{ name: 'P201', available: true }, { name: 'P202', available: true }], created_at: new Date().toISOString() },
  { id: 3, boarding_house_id: 1, name: 'Phòng Studio Cao Cấp', price_from: 4500000, service_fee: 250000, electricity_price: 3500, area: 35, max_people: 4, description: 'Studio rộng rãi đầy đủ nội thất sang trọng, trang bị sofa phòng khách, bếp ga cao cấp, thích hợp gia đình trẻ hoặc nhóm bạn sinh viên.', utilities: ['Điều hòa', 'Nóng lạnh', 'Giường', 'Đệm', 'Tủ quần áo', 'Tủ lạnh', 'Máy giặt riêng', 'Bếp / Kệ bếp', 'Bàn', 'Ghế', 'Ban công', 'Cửa sổ', 'Máy giặt chung', 'Thang máy', 'Wifi'], video_url: '', rooms: [{ name: 'P301', available: false }], created_at: new Date().toISOString() },
  
  // Trọ Võ Văn Ngân
  { id: 4, boarding_house_id: 2, name: 'Studio Tiện Nghi', price_from: 3200000, service_fee: 180000, electricity_price: 3500, area: 22, max_people: 2, description: 'Phòng khép kín đầy đủ đồ dùng, ban công phơi đồ thoáng mát rộng rãi.', utilities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường', 'Đệm', 'Tủ quần áo', 'Bàn', 'Ghế', 'Ban công', 'Wifi'], video_url: '', rooms: [{ name: 'P104', available: true }, { name: 'P105', available: true }], created_at: new Date().toISOString() },
  { id: 5, boarding_house_id: 2, name: 'Phòng Có Ban Công Rộng', price_from: 3800000, service_fee: 200000, electricity_price: 3500, area: 26, max_people: 2, description: 'Căn phòng đón gió tự nhiên tốt nhất tòa nhà, ban công rộng view đẹp, mát mẻ cả ngày.', utilities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường', 'Đệm', 'Tủ quần áo', 'Bàn', 'Ghế', 'Ban công', 'Cửa sổ', 'Wifi'], video_url: '', rooms: [{ name: 'P204', available: false }], created_at: new Date().toISOString() },
  
  // Trọ Bình Thạnh
  { id: 6, boarding_house_id: 3, name: 'Phòng Gác Lửng Hiện Đại', price_from: 4000000, service_fee: 220000, electricity_price: 3500, area: 28, max_people: 3, description: 'Căn hộ gác lửng trần cao thông thoáng, thiết kế trẻ trung, có khu giặt phơi riêng biệt.', utilities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Máy giặt riêng', 'Giường', 'Đệm', 'Tủ quần áo', 'Bàn', 'Ghế', 'Cửa sổ', 'Wifi'], video_url: '', rooms: [{ name: 'P304', available: true }], created_at: new Date().toISOString() },
  { id: 7, boarding_house_id: 3, name: 'Studio Premium Full Nội Thất', price_from: 5500000, service_fee: 300000, electricity_price: 3500, area: 38, max_people: 4, description: 'Phòng VIP nhất tòa nhà, trang bị tivi thông minh, máy giặt lồng ngang cao cấp, bếp từ âm, ghế sofa sang chảnh.', utilities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Máy giặt riêng', 'Giường', 'Đệm', 'Tủ quần áo', 'Bàn', 'Ghế', 'Bếp / Kệ bếp', 'Ban công', 'Cửa sổ', 'Máy giặt chung', 'Thang máy', 'Sạc xe điện', 'Wifi'], video_url: '', rooms: [{ name: 'P404', available: true }], created_at: new Date().toISOString() },
  
  // Trọ Làng Đại Học
  { id: 8, boarding_house_id: 4, name: 'Phòng Standard Sinh Viên', price_from: 1800000, service_fee: 100000, electricity_price: 3500, area: 18, max_people: 2, description: 'Phòng trọ giá rẻ cạnh làng đại học, phù hợp 2 sinh viên ở ghép tiết kiệm chi phí.', utilities: ['Giường', 'Tủ quần áo', 'Bàn', 'Ghế', 'Máy giặt chung', 'Wifi'], video_url: '', rooms: [{ name: 'P106', available: true }, { name: 'P107', available: true }, { name: 'P108', available: true }], created_at: new Date().toISOString() },
  { id: 9, boarding_house_id: 4, name: 'Studio Giá Rẻ Có Máy Lạnh', price_from: 2500000, service_fee: 130000, electricity_price: 3500, area: 22, max_people: 2, description: 'Phòng trọ trang bị sẵn máy lạnh và bình nóng lạnh mới tinh, giá siêu ưu đãi cho tân sinh viên.', utilities: ['Điều hòa', 'Nóng lạnh', 'Giường', 'Đệm', 'Tủ quần áo', 'Bàn', 'Ghế', 'Máy giặt chung', 'Wifi'], video_url: '', rooms: [{ name: 'P206', available: true }, { name: 'P207', available: false }], created_at: new Date().toISOString() }
];

const MOCK_ROOM_TYPE_IMAGES: RoomTypeImage[] = [
  // Trọ Nguyễn Văn Cừ - Standard (id=1)
  { id: 1, room_type_id: 1, image_url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800', image_type: 'main', status: 'approved', sort_order: 1, created_at: new Date().toISOString() },
  { id: 2, room_type_id: 1, image_url: 'https://images.unsplash.com/photo-1505691938895-1758d7eaa511?auto=format&fit=crop&q=80&w=800', image_type: 'bedroom', status: 'approved', sort_order: 2, created_at: new Date().toISOString() },
  { id: 3, room_type_id: 1, image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800', image_type: 'bathroom', status: 'approved', sort_order: 3, created_at: new Date().toISOString() },

  // Trọ Nguyễn Văn Cừ - Deluxe (id=2)
  { id: 4, room_type_id: 2, image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800', image_type: 'main', status: 'approved', sort_order: 1, created_at: new Date().toISOString() },
  { id: 5, room_type_id: 2, image_url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800', image_type: 'kitchen', status: 'approved', sort_order: 2, created_at: new Date().toISOString() },
  { id: 6, room_type_id: 2, image_url: 'https://images.unsplash.com/photo-1620626011160-9928f1b9b682?auto=format&fit=crop&q=80&w=800', image_type: 'bathroom', status: 'approved', sort_order: 3, created_at: new Date().toISOString() },

  // Trọ Nguyễn Văn Cừ - Studio (id=3)
  { id: 7, room_type_id: 3, image_url: 'https://images.unsplash.com/photo-1505691938895-1758d7eaa511?auto=format&fit=crop&q=80&w=800', image_type: 'main', status: 'approved', sort_order: 1, created_at: new Date().toISOString() },
  { id: 8, room_type_id: 3, image_url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=800', image_type: 'bedroom', status: 'approved', sort_order: 2, created_at: new Date().toISOString() },
  { id: 9, room_type_id: 3, image_url: 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&q=80&w=800', image_type: 'kitchen', status: 'approved', sort_order: 3, created_at: new Date().toISOString() },
  { id: 10, room_type_id: 3, image_url: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&q=80&w=800', image_type: 'balcony', status: 'approved', sort_order: 4, created_at: new Date().toISOString() },

  // Trọ Võ Văn Ngân - Studio (id=4)
  { id: 11, room_type_id: 4, image_url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800', image_type: 'main', status: 'approved', sort_order: 1, created_at: new Date().toISOString() },
  { id: 12, room_type_id: 4, image_url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800', image_type: 'bedroom', status: 'approved', sort_order: 2, created_at: new Date().toISOString() },

  // Trọ Võ Văn Ngân - Ban công (id=5)
  { id: 13, room_type_id: 5, image_url: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&q=80&w=800', image_type: 'main', status: 'approved', sort_order: 1, created_at: new Date().toISOString() },

  // Trọ Bình Thạnh - Gác lửng (id=6)
  { id: 14, room_type_id: 6, image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800', image_type: 'main', status: 'approved', sort_order: 1, created_at: new Date().toISOString() },
  { id: 15, room_type_id: 6, image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=800', image_type: 'bedroom', status: 'approved', sort_order: 2, created_at: new Date().toISOString() },

  // Trọ Bình Thạnh - Studio VIP (id=7)
  { id: 16, room_type_id: 7, image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800', image_type: 'main', status: 'approved', sort_order: 1, created_at: new Date().toISOString() },
  { id: 17, room_type_id: 7, image_url: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&q=80&w=800', image_type: 'bedroom', status: 'approved', sort_order: 2, created_at: new Date().toISOString() },
  { id: 18, room_type_id: 7, image_url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800', image_type: 'kitchen', status: 'approved', sort_order: 3, created_at: new Date().toISOString() },

  // Trọ Làng Đại Học - Standard (id=8)
  { id: 19, room_type_id: 8, image_url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=800', image_type: 'main', status: 'approved', sort_order: 1, created_at: new Date().toISOString() },

  // Trọ Làng Đại Học - Studio AC (id=9)
  { id: 20, room_type_id: 9, image_url: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&q=80&w=800', image_type: 'main', status: 'approved', sort_order: 1, created_at: new Date().toISOString() },
  
  // Pending images for testing moderation (Admin)
  { id: 21, room_type_id: 1, image_url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800', image_type: 'bedroom', status: 'pending', sort_order: 99, created_at: new Date().toISOString() },
  { id: 22, room_type_id: 2, image_url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800', image_type: 'kitchen', status: 'pending', sort_order: 99, created_at: new Date().toISOString() }
];

const MOCK_LEADS: Lead[] = [
  { id: 1, customer_name: 'Nguyễn Văn A', customer_phone: '0987654321', room_type_id: 2, message: 'Mình muốn đặt lịch đi xem phòng Deluxe vào lúc 15h chiều mai.', status: 'new', created_at: new Date().toISOString() },
  { id: 2, customer_name: 'Trần Thị B', customer_phone: '0901234567', room_type_id: 4, message: 'Phòng Studio bên Võ Văn Ngân còn trống không bạn, có giảm giá cho sinh viên không?', status: 'contacted', created_at: new Date(Date.now() - 86400000).toISOString() }
];

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 1, lead_id: 1, appointment_time: new Date(Date.now() + 86400000).toISOString(), status: 'scheduled', note: 'Khách hàng đi cùng bạn thân, đã gọi xác nhận lúc sáng.', created_at: new Date().toISOString() }
];

let connectionChecked = false;
let supabaseActive = false;
let useLocalDB = false;

// If we are on the client, check if force_local_db is enabled
if (typeof window !== 'undefined') {
  if (localStorage.getItem('force_local_db') === 'true') {
    useLocalDB = true;
    connectionChecked = true;
    supabaseActive = false;
  }
}

export async function isSupabaseOnline(): Promise<boolean> {
  if (IS_SERVER) return false;
  if (useLocalDB) return false;
  if (connectionChecked) return supabaseActive;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url === 'https://your-supabase-url.supabase.co' || url.includes('your-supabase-url') || url.includes('placeholder-url')) {
    useLocalDB = true;
    connectionChecked = true;
    supabaseActive = false;
    return false;
  }

  try {
    // Try to select 1 row from profiles with a fast timeout (e.g. 1500ms)
    const testPromise = supabase.from('profiles').select('id').limit(1);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase connection timeout')), 1500)
    );

    const result = await Promise.race([testPromise, timeoutPromise]) as any;
    if (result && result.error) {
      console.warn('Supabase query returned error, falling back to LocalStorage:', result.error);
      useLocalDB = true;
      supabaseActive = false;
    } else {
      supabaseActive = true;
      console.log('Supabase connection verified successfully');
    }
  } catch (err) {
    console.warn('Supabase connection failed or timed out. Falling back to LocalStorage:', err);
    useLocalDB = true;
    supabaseActive = false;
  } finally {
    connectionChecked = true;
  }
  return supabaseActive;
}

// --- INITIALIZE STORAGE DATABASE ---
function initLocalDB() {
  if (IS_SERVER) return;
  
  // Force clearing existing demo data (either if not cleared yet, or if it still contains the old demo names)
  const existingHouses = localStorage.getItem('boarding_houses');
  const hasDemoData = existingHouses && (existingHouses.includes('Hola FPT') || existingHouses.includes('ĐHQG') || existingHouses.includes('Thạch Hòa'));
  
  if (localStorage.getItem('demo_data_cleared') !== 'true' || hasDemoData) {
    localStorage.removeItem('boarding_houses');
    localStorage.removeItem('boarding_house_images');
    localStorage.removeItem('room_types');
    localStorage.removeItem('room_type_images');
    localStorage.removeItem('leads');
    localStorage.removeItem('appointments');
    localStorage.removeItem('profiles');
    localStorage.setItem('demo_data_cleared', 'true');
  }
  
  if (!localStorage.getItem('boarding_houses')) {
    localStorage.setItem('boarding_houses', JSON.stringify([]));
    localStorage.setItem('boarding_house_images', JSON.stringify([]));
    localStorage.setItem('room_types', JSON.stringify([]));
    localStorage.setItem('room_type_images', JSON.stringify([]));
    localStorage.setItem('leads', JSON.stringify([]));
    localStorage.setItem('appointments', JSON.stringify([]));
    localStorage.setItem('profiles', JSON.stringify(MOCK_PROFILES));
  }
}

// Ensure database is set up
initLocalDB();

// Helper to access LocalStorage collections
function getCollection<T>(key: string): T[] {
  if (IS_SERVER) return [];
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function saveCollection<T>(key: string, data: T[]) {
  if (IS_SERVER) return;
  localStorage.setItem(key, JSON.stringify(data));
}

// --- DATABASE SERVICE FACADE (SUPABASE + LOCALSTORAGE) ---
export const db = {
  // --- BOARDING HOUSES ---
  async getBoardingHouses(filters?: { owner_id?: string }): Promise<BoardingHouse[]> {
    try {
      // Direct database connection check
      if (await isSupabaseOnline()) {
        let query = supabase.from('boarding_houses').select('*');
        if (filters?.owner_id) {
          query = query.eq('owner_id', filters.owner_id);
        }
        const { data, error } = await query;
        if (!error && data) return data as BoardingHouse[];
      }
    } catch (e) {
      console.log('Using LocalStorage DB fallback');
    }
    
    let list = getCollection<BoardingHouse>('boarding_houses');
    if (filters?.owner_id) {
      list = list.filter(h => h.owner_id === filters.owner_id);
    }
    return list;
  },

  async getBoardingHouseById(id: number): Promise<BoardingHouse | null> {
    try {
      if (await isSupabaseOnline()) {
        const { data, error } = await supabase.from('boarding_houses').select('*').eq('id', id).single();
        if (!error && data) return data as BoardingHouse;
      }
    } catch (e) {}

    const list = getCollection<BoardingHouse>('boarding_houses');
    return list.find(h => h.id === id) || null;
  },

  async createBoardingHouse(house: Omit<BoardingHouse, 'id' | 'created_at'>): Promise<BoardingHouse> {
    try {
      if (await isSupabaseOnline()) {
        const { data, error } = await supabase.from('boarding_houses').insert(house).select().single();
        if (!error && data) return data as BoardingHouse;
      }
    } catch (e) {}

    const list = getCollection<BoardingHouse>('boarding_houses');
    const newHouse: BoardingHouse = {
      ...house,
      id: list.length > 0 ? Math.max(...list.map(h => h.id)) + 1 : 1,
      created_at: new Date().toISOString()
    };
    list.push(newHouse);
    saveCollection('boarding_houses', list);
    return newHouse;
  },

  async updateBoardingHouse(id: number, updates: Partial<BoardingHouse>): Promise<BoardingHouse> {
    try {
      if (await isSupabaseOnline()) {
        const { data, error } = await supabase.from('boarding_houses').update(updates).eq('id', id).select().single();
        if (!error && data) return data as BoardingHouse;
      }
    } catch (e) {}

    const list = getCollection<BoardingHouse>('boarding_houses');
    const idx = list.findIndex(h => h.id === id);
    if (idx === -1) throw new Error('House not found');
    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    saveCollection('boarding_houses', list);
    return updated;
  },

  async deleteBoardingHouse(id: number): Promise<boolean> {
    try {
      if (await isSupabaseOnline()) {
        const { error } = await supabase.from('boarding_houses').delete().eq('id', id);
        if (!error) return true;
      }
    } catch (e) {}

    let list = getCollection<BoardingHouse>('boarding_houses');
    list = list.filter(h => h.id !== id);
    saveCollection('boarding_houses', list);

    // Cascade delete images and room types
    let houseImages = getCollection<BoardingHouseImage>('boarding_house_images');
    saveCollection('boarding_house_images', houseImages.filter(img => img.boarding_house_id !== id));

    let roomTypes = getCollection<RoomType>('room_types');
    const typesToDelete = roomTypes.filter(rt => rt.boarding_house_id === id).map(rt => rt.id);
    saveCollection('room_types', roomTypes.filter(rt => rt.boarding_house_id !== id));

    let roomTypeImages = getCollection<RoomTypeImage>('room_type_images');
    saveCollection('room_type_images', roomTypeImages.filter(img => !typesToDelete.includes(img.room_type_id)));

    return true;
  },

  // --- HOUSE IMAGES ---
  async getBoardingHouseImages(houseId: number, status?: 'pending' | 'approved' | 'rejected'): Promise<BoardingHouseImage[]> {
    try {
      if (await isSupabaseOnline()) {
        let query = supabase.from('boarding_house_images').select('*').eq('boarding_house_id', houseId);
        if (status) query = query.eq('status', status);
        const { data, error } = await query.order('sort_order', { ascending: true });
        if (!error && data) return data as BoardingHouseImage[];
      }
    } catch (e) {}

    let list = getCollection<BoardingHouseImage>('boarding_house_images').filter(img => img.boarding_house_id === houseId);
    if (status) list = list.filter(img => img.status === status);
    return list.sort((a, b) => a.sort_order - b.sort_order);
  },

  async addBoardingHouseImage(image: Omit<BoardingHouseImage, 'id' | 'created_at'>): Promise<BoardingHouseImage> {
    try {
      if (await isSupabaseOnline()) {
        let uploadUrl = image.image_url;
        if (uploadUrl.startsWith('idb:')) {
          uploadUrl = await uploadToSupabaseStorage(uploadUrl, 'houses');
        }
        const updatedImage = { ...image, image_url: uploadUrl };
        const { data, error } = await supabase.from('boarding_house_images').insert(updatedImage).select().single();
        if (!error && data) return data as BoardingHouseImage;
      }
    } catch (e) {
      console.error('Error adding boarding house image:', e);
    }

    const list = getCollection<BoardingHouseImage>('boarding_house_images');
    const newImage: BoardingHouseImage = {
      ...image,
      id: list.length > 0 ? Math.max(...list.map(img => img.id)) + 1 : 1,
      created_at: new Date().toISOString()
    };
    list.push(newImage);
    saveCollection('boarding_house_images', list);
    return newImage;
  },

  async updateBoardingHouseImage(id: number, updates: Partial<BoardingHouseImage>): Promise<BoardingHouseImage> {
    try {
      if (await isSupabaseOnline()) {
        const { data, error } = await supabase.from('boarding_house_images').update(updates).eq('id', id).select().single();
        if (!error && data) return data as BoardingHouseImage;
      }
    } catch (e) {}

    const list = getCollection<BoardingHouseImage>('boarding_house_images');
    const idx = list.findIndex(img => img.id === id);
    if (idx === -1) throw new Error('Image not found');
    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    saveCollection('boarding_house_images', list);
    return updated;
  },

  async deleteBoardingHouseImage(id: number): Promise<boolean> {
    try {
      if (await isSupabaseOnline()) {
        const { error } = await supabase.from('boarding_house_images').delete().eq('id', id);
        if (!error) return true;
      }
    } catch (e) {}

    let list = getCollection<BoardingHouseImage>('boarding_house_images');
    list = list.filter(img => img.id !== id);
    saveCollection('boarding_house_images', list);
    return true;
  },

  // --- ROOM TYPES ---
  async getRoomTypes(filters?: { boarding_house_id?: number }): Promise<RoomType[]> {
    try {
      if (await isSupabaseOnline()) {
        let query = supabase.from('room_types').select('*');
        if (filters?.boarding_house_id) {
          query = query.eq('boarding_house_id', filters.boarding_house_id);
        }
        const { data, error } = await query;
        if (!error && data) return data as RoomType[];
      }
    } catch (e) {}

    let list = getCollection<RoomType>('room_types');
    if (filters?.boarding_house_id) {
      list = list.filter(rt => rt.boarding_house_id === filters.boarding_house_id);
    }
    return list;
  },

  async getRoomTypeById(id: number): Promise<RoomType | null> {
    try {
      if (await isSupabaseOnline()) {
        const { data, error } = await supabase.from('room_types').select('*').eq('id', id).single();
        if (!error && data) return data as RoomType;
      }
    } catch (e) {}

    const list = getCollection<RoomType>('room_types');
    return list.find(rt => rt.id === id) || null;
  },

  async createRoomType(roomType: Omit<RoomType, 'id' | 'created_at'>): Promise<RoomType> {
    try {
      if (await isSupabaseOnline()) {
        const { rooms, ...supabaseData } = roomType as any;
        const { data, error } = await supabase.from('room_types').insert(supabaseData).select().single();
        if (!error && data) return data as RoomType;
      }
    } catch (e) {}

    const list = getCollection<RoomType>('room_types');
    const newRoomType: RoomType = {
      ...roomType,
      id: list.length > 0 ? Math.max(...list.map(rt => rt.id)) + 1 : 1,
      created_at: new Date().toISOString()
    };
    list.push(newRoomType);
    saveCollection('room_types', list);
    return newRoomType;
  },

  async updateRoomType(id: number, updates: Partial<RoomType>): Promise<RoomType> {
    try {
      if (await isSupabaseOnline()) {
        const { rooms, ...supabaseData } = updates as any;
        const { data, error } = await supabase.from('room_types').update(supabaseData).eq('id', id).select().single();
        if (!error && data) return data as RoomType;
      }
    } catch (e) {}

    const list = getCollection<RoomType>('room_types');
    const idx = list.findIndex(rt => rt.id === id);
    if (idx === -1) throw new Error('Room Type not found');
    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    saveCollection('room_types', list);
    return updated;
  },

  async deleteRoomType(id: number): Promise<boolean> {
    try {
      if (await isSupabaseOnline()) {
        const { error } = await supabase.from('room_types').delete().eq('id', id);
        if (!error) return true;
      }
    } catch (e) {}

    let list = getCollection<RoomType>('room_types');
    list = list.filter(rt => rt.id !== id);
    saveCollection('room_types', list);

    // Cascade delete images
    let roomTypeImages = getCollection<RoomTypeImage>('room_type_images');
    saveCollection('room_type_images', roomTypeImages.filter(img => img.room_type_id !== id));

    return true;
  },

  // --- ROOM TYPE IMAGES ---
  async getRoomTypeImages(roomTypeId: number, status?: 'pending' | 'approved' | 'rejected'): Promise<RoomTypeImage[]> {
    try {
      if (await isSupabaseOnline()) {
        let query = supabase.from('room_type_images').select('*').eq('room_type_id', roomTypeId);
        if (status) query = query.eq('status', status);
        const { data, error } = await query.order('sort_order', { ascending: true });
        if (!error && data) return data as RoomTypeImage[];
      }
    } catch (e) {}

    let list = getCollection<RoomTypeImage>('room_type_images').filter(img => img.room_type_id === roomTypeId);
    if (status) list = list.filter(img => img.status === status);
    return list.sort((a, b) => a.sort_order - b.sort_order);
  },

  async addRoomTypeImage(image: Omit<RoomTypeImage, 'id' | 'created_at'>): Promise<RoomTypeImage> {
    try {
      if (await isSupabaseOnline()) {
        let uploadUrl = image.image_url;
        if (uploadUrl.startsWith('idb:')) {
          uploadUrl = await uploadToSupabaseStorage(uploadUrl, 'rooms');
        }
        const updatedImage = { ...image, image_url: uploadUrl };
        const { data, error } = await supabase.from('room_type_images').insert(updatedImage).select().single();
        if (!error && data) return data as RoomTypeImage;
      }
    } catch (e) {
      console.error('Error adding room type image:', e);
    }

    const list = getCollection<RoomTypeImage>('room_type_images');
    const newImage: RoomTypeImage = {
      ...image,
      id: list.length > 0 ? Math.max(...list.map(img => img.id)) + 1 : 1,
      created_at: new Date().toISOString()
    };
    list.push(newImage);
    saveCollection('room_type_images', list);
    return newImage;
  },

  async updateRoomTypeImage(id: number, updates: Partial<RoomTypeImage>): Promise<RoomTypeImage> {
    try {
      if (await isSupabaseOnline()) {
        const { data, error } = await supabase.from('room_type_images').update(updates).eq('id', id).select().single();
        if (!error && data) return data as RoomTypeImage;
      }
    } catch (e) {}

    const list = getCollection<RoomTypeImage>('room_type_images');
    const idx = list.findIndex(img => img.id === id);
    if (idx === -1) throw new Error('Image not found');
    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    saveCollection('room_type_images', list);
    return updated;
  },

  async deleteRoomTypeImage(id: number): Promise<boolean> {
    try {
      if (await isSupabaseOnline()) {
        const { error } = await supabase.from('room_type_images').delete().eq('id', id);
        if (!error) return true;
      }
    } catch (e) {}

    let list = getCollection<RoomTypeImage>('room_type_images');
    list = list.filter(img => img.id !== id);
    saveCollection('room_type_images', list);
    return true;
  },

  // --- LEADS ---
  async getLeads(): Promise<Lead[]> {
    try {
      if (await isSupabaseOnline()) {
        const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
        if (!error && data) return data as Lead[];
      }
    } catch (e) {}

    return getCollection<Lead>('leads').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createLead(lead: Omit<Lead, 'id' | 'created_at'>): Promise<Lead> {
    try {
      if (await isSupabaseOnline()) {
        const { data, error } = await supabase.from('leads').insert(lead).select().single();
        if (!error && data) return data as Lead;
      }
    } catch (e) {}

    const list = getCollection<Lead>('leads');
    const newLead: Lead = {
      ...lead,
      id: list.length > 0 ? Math.max(...list.map(l => l.id)) + 1 : 1,
      created_at: new Date().toISOString()
    };
    list.push(newLead);
    saveCollection('leads', list);
    return newLead;
  },

  async updateLeadStatus(id: number, status: Lead['status']): Promise<Lead> {
    try {
      if (await isSupabaseOnline()) {
        const { data, error } = await supabase.from('leads').update({ status }).eq('id', id).select().single();
        if (!error && data) return data as Lead;
      }
    } catch (e) {}

    const list = getCollection<Lead>('leads');
    const idx = list.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Lead not found');
    const updated = { ...list[idx], status };
    list[idx] = updated;
    saveCollection('leads', list);
    return updated;
  },

  async deleteLead(id: number): Promise<boolean> {
    try {
      if (await isSupabaseOnline()) {
        const { error } = await supabase.from('leads').delete().eq('id', id);
        if (!error) return true;
      }
    } catch (e) {}

    let list = getCollection<Lead>('leads');
    list = list.filter(l => l.id !== id);
    saveCollection('leads', list);

    // Cascade delete appointments
    let appointments = getCollection<Appointment>('appointments');
    saveCollection('appointments', appointments.filter(a => a.lead_id !== id));

    return true;
  },

  // --- APPOINTMENTS ---
  async getAppointments(): Promise<Appointment[]> {
    try {
      if (await isSupabaseOnline()) {
        const { data, error } = await supabase.from('appointments').select('*').order('appointment_time', { ascending: true });
        if (!error && data) return data as Appointment[];
      }
    } catch (e) {}

    return getCollection<Appointment>('appointments').sort((a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime());
  },

  async createAppointment(appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment> {
    try {
      if (await isSupabaseOnline()) {
        const { data, error } = await supabase.from('appointments').insert(appointment).select().single();
        if (!error && data) return data as Appointment;
      }
    } catch (e) {}

    const list = getCollection<Appointment>('appointments');
    const newAppointment: Appointment = {
      ...appointment,
      id: list.length > 0 ? Math.max(...list.map(a => a.id)) + 1 : 1,
      created_at: new Date().toISOString()
    };
    list.push(newAppointment);
    saveCollection('appointments', list);
    return newAppointment;
  },

  async updateAppointment(id: number, updates: Partial<Appointment>): Promise<Appointment> {
    try {
      if (await isSupabaseOnline()) {
        const { data, error } = await supabase.from('appointments').update(updates).eq('id', id).select().single();
        if (!error && data) return data as Appointment;
      }
    } catch (e) {}

    const list = getCollection<Appointment>('appointments');
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Appointment not found');
    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    saveCollection('appointments', list);
    return updated;
  },

  // --- MODERATION PANEL ---
  async getPendingImages(): Promise<{
    boardingHouseImages: (BoardingHouseImage & { boarding_house_name: string })[];
    roomTypeImages: (RoomTypeImage & { room_type_name: string; boarding_house_name: string })[];
  }> {
    const bhList = getCollection<BoardingHouse>('boarding_houses');
    const rtList = getCollection<RoomType>('room_types');
    const bhImages = getCollection<BoardingHouseImage>('boarding_house_images').filter(img => img.status === 'pending');
    const rtImages = getCollection<RoomTypeImage>('room_type_images').filter(img => img.status === 'pending');

    const boardingHouseImages = bhImages.map(img => {
      const bh = bhList.find(h => h.id === img.boarding_house_id);
      return {
        ...img,
        boarding_house_name: bh ? bh.name : 'Nhà trọ không xác định'
      };
    });

    const roomTypeImages = rtImages.map(img => {
      const rt = rtList.find(r => r.id === img.room_type_id);
      const bh = rt ? bhList.find(h => h.id === rt.boarding_house_id) : null;
      return {
        ...img,
        room_type_name: rt ? rt.name : 'Loại phòng không xác định',
        boarding_house_name: bh ? bh.name : 'Nhà trọ không xác định'
      };
    });

    return { boardingHouseImages, roomTypeImages };
  },

  // --- OWNERS LIST & AUTH PROFILE HELPERS ---
  async getOwners(): Promise<UserProfile[]> {
    try {
      if (await isSupabaseOnline()) {
        const { data, error } = await supabase.from('profiles').select('*').eq('role', 'owner').eq('status', 'active');
        if (!error && data) return data as UserProfile[];
      }
    } catch (e) {}
    const list = getCollection<UserProfile>('profiles');
    return list.filter(p => p.role === 'owner' && p.status === 'active');
  },

  async getPendingOwners(): Promise<UserProfile[]> {
    try {
      if (await isSupabaseOnline()) {
        const { data, error } = await supabase.from('profiles').select('*').eq('role', 'owner').eq('status', 'pending');
        if (!error && data) return data as UserProfile[];
      }
    } catch (e) {}
    const list = getCollection<UserProfile>('profiles');
    return list.filter(p => p.role === 'owner' && p.status === 'pending');
  },

  async getAllOwners(): Promise<UserProfile[]> {
    try {
      if (await isSupabaseOnline()) {
        const { data, error } = await supabase.from('profiles').select('*').eq('role', 'owner');
        if (!error && data) return data as UserProfile[];
      }
    } catch (e) {}
    const list = getCollection<UserProfile>('profiles');
    return list.filter(p => p.role === 'owner');
  },

  async getProfileByEmail(email: string): Promise<UserProfile | null> {
    try {
      if (await isSupabaseOnline()) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email.trim().toLowerCase())
          .single();
        if (!error && data) return data as UserProfile;
      }
    } catch (e) {}

    const list = getCollection<UserProfile>('profiles');
    return list.find(p => p.email.trim().toLowerCase() === email.trim().toLowerCase()) || null;
  },

  async createOwnerProfile(profile: UserProfile): Promise<boolean> {
    // LocalStorage fallback
    const list = getCollection<UserProfile>('profiles');
    if (!list.some(p => p.email.trim().toLowerCase() === profile.email.trim().toLowerCase())) {
      list.push(profile);
      saveCollection('profiles', list);
    }

    // Supabase
    try {
      if (await isSupabaseOnline()) {
        const { error } = await supabase.from('profiles').upsert({
          id: profile.id,
          name: profile.name,
          phone: profile.phone,
          email: profile.email,
          role: 'owner',
          status: profile.status
        });
        if (error) throw error;
      }
    } catch (e) {
      console.error('Error creating owner profile in Supabase:', e);
      return false;
    }
    return true;
  },

  async updateOwnerStatus(ownerId: string, status: 'active' | 'pending' | 'rejected' | 'inactive'): Promise<boolean> {
    // LocalStorage
    const list = getCollection<UserProfile>('profiles');
    const idx = list.findIndex(p => p.id === ownerId);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], status };
    saveCollection('profiles', list);

    // Supabase
    try {
      if (await isSupabaseOnline()) {
        await supabase.from('profiles').update({ status }).eq('id', ownerId);
      }
    } catch (e) {}

    return true;
  },

  // --- DEV TOOLS & DATABASE TOGGLES ---
  async isSupabaseActive(): Promise<boolean> {
    return await isSupabaseOnline();
  },
  
  setUseLocalDB(val: boolean) {
    if (IS_SERVER) return;
    useLocalDB = val;
    localStorage.setItem('force_local_db', val ? 'true' : 'false');
    // Force connection check reset
    connectionChecked = false;
  },

  getUseLocalDB(): boolean {
    if (IS_SERVER) return false;
    return localStorage.getItem('force_local_db') === 'true';
  },

  resetDatabase() {
    if (IS_SERVER) return;
    localStorage.removeItem('boarding_houses');
    localStorage.removeItem('boarding_house_images');
    localStorage.removeItem('room_types');
    localStorage.removeItem('room_type_images');
    localStorage.removeItem('leads');
    localStorage.removeItem('appointments');
    localStorage.removeItem('profiles');
    initLocalDB();
  }
};
