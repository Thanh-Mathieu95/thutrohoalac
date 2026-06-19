import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id: string;
  name: string;
  phone?: string;
  email: string;
  role: 'admin' | 'owner';
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  created_at: string;
}

export interface Owner {
  id: string;
  user_id: string;
  note?: string;
  created_at: string;
}

export interface BoardingHouse {
  id: number;
  owner_id: string;
  name: string;
  address: string;
  description?: string;
  rules?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface BoardingHouseImage {
  id: number;
  boarding_house_id: number;
  image_url: string;
  image_type: 'front' | 'parking' | 'hallway' | 'shared_area' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  sort_order: number;
  created_at: string;
}

export interface RoomType {
  id: number;
  boarding_house_id: number;
  name: string;
  price_from: number;
  service_fee: number;
  electricity_price: number;
  area: number;
  max_people: number;
  description?: string;
  utilities: string[];
  video_url?: string;
  rooms?: { name: string; available: boolean }[];
  created_at: string;
}

export interface RoomTypeImage {
  id: number;
  room_type_id: number;
  image_url: string;
  image_type: 'main' | 'bedroom' | 'bathroom' | 'balcony' | 'kitchen' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  sort_order: number;
  created_at: string;
}

export interface Lead {
  id: number;
  customer_name: string;
  customer_phone: string;
  room_type_id: number;
  message?: string;
  status: 'new' | 'contacted' | 'lost' | 'won';
  created_at: string;
}

export interface Appointment {
  id: number;
  lead_id: number;
  appointment_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  note?: string;
  created_at: string;
}

