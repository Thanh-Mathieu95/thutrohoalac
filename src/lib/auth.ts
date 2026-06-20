// src/lib/auth.ts
// Mock Authentication Service for Rental Brokerage System Demo
import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'admin' | 'owner' | 'guest';
  status: 'active' | 'inactive' | 'pending' | 'rejected';
}

export const DEMO_USERS: Record<string, AuthUser> = {
  admin: {
    id: 'admin-uuid-0001',
    name: 'Sale Hùng (Môi giới)',
    phone: '0912345678',
    email: 'enhousetrohoalac@gmail.com',
    role: 'admin',
    status: 'active',
  },
  owner_nam: {
    id: 'owner-uuid-nam01',
    name: 'Anh Nam (Chủ trọ)',
    phone: '0988888888',
    email: 'nam@gmail.com',
    role: 'owner',
    status: 'active',
  },
  owner_lan: {
    id: 'owner-uuid-lan02',
    name: 'Chị Lan (Chủ trọ)',
    phone: '0977777777',
    email: 'lan@gmail.com',
    role: 'owner',
    status: 'active',
  },
};

const IS_SERVER = typeof window === 'undefined';
const STORAGE_KEY = 'rental_brokerage_demo_user';

export function getCurrentUser(): AuthUser | null {
  if (IS_SERVER) return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    // Default is guest
    return null;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return null;
  }
}

export function loginAs(roleKey: 'admin' | 'owner_nam' | 'owner_lan' | 'guest') {
  if (IS_SERVER) return;
  if (roleKey === 'guest') {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_USERS[roleKey]));
  }
  // Dispatch custom event to notify all components of auth change
  window.dispatchEvent(new Event('auth-change'));
}

export function loginWithProfile(user: AuthUser) {
  if (IS_SERVER) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('auth-change'));
}

export function logout() {
  loginAs('guest');
  try {
    supabase.auth.signOut().catch(err => console.warn('Supabase signOut error:', err));
  } catch (e) {}
}
