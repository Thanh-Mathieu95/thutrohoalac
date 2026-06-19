'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Home, DollarSign, PlusCircle, Map, Settings, LogOut, Search, Bell, Loader2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, loginAs } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      // 1. First, check mock auth (Demo Mode Switcher / Local Storage)
      const mockUser = getCurrentUser();
      if (mockUser && mockUser.role === 'admin') {
        setUser(mockUser);
        setIsLoading(false);
        return;
      }

      // 2. Fallback to Supabase Auth
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.log("Supabase getSession failed, using demo auth fallback.");
      }
      
      // If neither is authenticated, redirect to login
      if (pathname !== '/admin/login') {
        router.push('/admin/login');
      } else {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, [pathname, router]);

  const handleLogout = async () => {
    // Clear mock auth
    loginAs('guest');
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050A18] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
        <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  // If we are on login page, don't show the layout shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#001a3d] text-white flex flex-col shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-white/5 gap-3">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center font-black text-white shadow-lg text-lg">
            SH
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-tight leading-none">Admin Panel</h1>
            <span className="text-[10px] text-brand uppercase font-bold tracking-widest mt-1">Thuê Trọ Hòa Lạc</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-5 py-3.5 bg-brand text-white rounded-2xl font-bold shadow-lg shadow-brand/20 transition-all">
            <LayoutDashboard className="w-5 h-5" /> Tổng quan
          </Link>
          <Link href="/admin/rooms" className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 rounded-2xl font-bold text-gray-400 hover:text-white transition-all">
            <Home className="w-5 h-5" /> Quản lý phòng
          </Link>
          <Link href="/admin/rooms/new" className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 rounded-2xl font-bold text-gray-400 hover:text-white transition-all">
            <PlusCircle className="w-5 h-5" /> Đăng bài mới
          </Link>
          <Link href="/admin/poi" className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 rounded-2xl font-bold text-gray-400 hover:text-white transition-all">
            <Map className="w-5 h-5" /> Điều chỉnh Map
          </Link>
          <Link href="/admin/revenue" className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 rounded-2xl font-bold text-gray-400 hover:text-white transition-all">
            <DollarSign className="w-5 h-5" /> Doanh thu
          </Link>
          <div className="pt-6 pb-2 px-5">
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Hệ thống</span>
          </div>
          <Link href="/admin/settings" className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 rounded-2xl font-bold text-gray-400 hover:text-white transition-all">
            <Settings className="w-5 h-5" /> Cài đặt
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl font-bold transition-all"
          >
            <LogOut className="w-5 h-5" /> Đăng xuất Admin
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 shrink-0">
          <div className="relative w-96 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm nhanh..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-brand/30 transition-all text-sm font-medium"
            />
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-400 hover:text-brand transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-gray-100"></div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="font-bold text-gray-900 text-sm">Sale Hùng</span>
                <span className="text-[10px] text-brand font-black uppercase">Administrator</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center text-brand font-black shadow-sm">
                SH
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-10 bg-[#f8fafc]">
          {children}
        </div>
      </main>
    </div>
  );
}
