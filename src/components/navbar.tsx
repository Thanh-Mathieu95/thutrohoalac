'use client';

import Link from 'next/link';
import { Search, Menu, User, LogOut, LayoutDashboard, MapPin, X, Shield, Users, Lock } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { getCurrentUser, logout, loginAs, AuthUser } from '@/lib/auth';

// Suspended search bar nested component to avoid App Router build de-opt
function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');

  useEffect(() => {
    setQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set('search', query.trim());
    } else {
      params.delete('search');
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearchSubmit} className="flex-1 flex justify-center max-w-sm md:max-w-md mx-2 sm:mx-6 md:mx-8">
      {/* High-contrast Search Bar with light Notion border and soft shadow */}
      <div className="relative w-full flex items-center bg-white border border-[#e6e6e6] hover:border-gray-300 shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-full pl-5 pr-1.5 py-1 hover:shadow-md focus-within:ring-2 focus-within:ring-[#0075de]/20 focus-within:border-[#0075de] transition-all duration-200 group">
        <MapPin className="w-4 h-4 text-[#0075de]/60 mr-2.5 shrink-0 group-focus-within:text-[#0075de] transition-colors" />
        <input 
          type="text" 
          placeholder="Tìm theo Trường (FPT, ĐHQG) hoặc Khu vực..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-700 placeholder-slate-400"
        />
        {/* Prominent circular Navy action search button */}
        <button 
          type="submit"
          className="bg-[#0075de] hover:bg-[#005bab] text-white w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm shrink-0 ml-2"
        >
          <Search className="w-4 h-4 text-white" />
        </button>
      </div>
    </form>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    setCurrentUser(getCurrentUser());

    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
      setShowDropdown(false);
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  // Hide navbar on admin and owner dashboard layout
  if (pathname.startsWith('/admin') || pathname.startsWith('/owner')) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 h-20 md:h-24">
      <div className="container mx-auto px-4 md:px-8 h-full flex items-center justify-between">

        {/* Logo Section */}
        <Link href="/" className="flex items-center justify-center group shrink-0 overflow-hidden h-20 w-20 md:h-24 md:w-24 relative bg-white">
          <img 
            src="/logo.png" 
            alt="En House Logo" 
            className="absolute inset-0 w-full h-full object-cover scale-[1.7] transition-transform duration-200 group-hover:scale-[1.8]" 
          />
        </Link>


        {/* Centralized Pill Search Bar (Airbnb-style) */}
        {pathname !== '/' && !pathname.startsWith('/rooms/') && !pathname.startsWith('/boarding-house/') && (
          <Suspense fallback={<div className="flex-1 max-w-md mx-8 h-10 bg-slate-100/50 rounded-full animate-pulse" />}>
            <SearchBar />
          </Suspense>
        )}

        {/* Right Menu / User Profile Pill */}
        <div className="flex items-center gap-4 shrink-0 relative">
          <div 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 p-2.5 pl-4 border border-slate-200 rounded-full hover:shadow-md hover:border-slate-300 transition-all cursor-pointer bg-white active:scale-95 shadow-sm"
          >
            <Menu className="w-4 h-4 text-slate-600" />
            {currentUser ? (
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black"
                style={{ backgroundColor: '#0075de' }}
              >
                {currentUser.name.charAt(0)}
              </div>
            ) : (
              <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* User Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 top-14 w-60 bg-white rounded-xl border border-slate-100 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {currentUser ? (
                <div className="space-y-1">
                  <div className="px-3 py-2 border-b border-slate-50 mb-2">
                    <p className="text-xs font-black text-slate-900 truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                  </div>
                  
                  {currentUser.role === 'admin' ? (
                    <Link 
                      href="/admin"
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#0075de]" />
                      Bảng quản trị Môi giới
                    </Link>
                  ) : (
                    <Link 
                      href="/owner"
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#0075de]" />
                      Quản lý nhà trọ của tôi
                    </Link>
                  )}
                  
                  <button 
                    onClick={() => {
                      logout();
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất demo
                  </button>
                </div>
              ) : (
                <div className="space-y-1 py-1">
                  <button 
                    onClick={() => {
                      setShowDropdown(false);
                      setShowLoginModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black text-slate-800 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    Đăng nhập
                  </button>
                  <Link 
                    href="/owner" 
                    onClick={() => setShowDropdown(false)}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-left block"
                  >
                    Đăng ký làm chủ trọ
                  </Link>
                  <div className="border-t border-slate-100 my-1" />
                  <Link 
                    href="/owner"
                    onClick={() => setShowDropdown(false)}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-left block"
                  >
                    Cho thuê nhà trên En House
                  </Link>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      alert('Tính năng hỗ trợ trực tuyến đang được xây dựng!');
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    Trợ giúp & Hỗ trợ
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Elegant, modern Demo Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-200 text-left relative">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-50 text-[#0075de] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Đăng nhập Demo</h3>
              <p className="text-xs text-slate-400 font-semibold">Chọn tài khoản mẫu để trải nghiệm nhanh các tính năng</p>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: Admin */}
              <button
                onClick={() => {
                  loginAs('admin');
                  setShowLoginModal(false);
                  router.push('/admin');
                }}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/20 transition-all text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Shield className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800">Môi giới (Admin)</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Duyệt ảnh, xem Leads, quản lý lịch hẹn</p>
                </div>
              </button>

              {/* Option 2: Anh Nam */}
              <button
                onClick={() => {
                  loginAs('owner_nam');
                  setShowLoginModal(false);
                  router.push('/owner');
                }}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/20 transition-all text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0075de] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800">Chủ trọ (Anh Nam)</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Quản lý 3 chung cư mini tại Hòa Lạc</p>
                </div>
              </button>

              {/* Option 3: Chị Lan */}
              <button
                onClick={() => {
                  loginAs('owner_lan');
                  setShowLoginModal(false);
                  router.push('/owner');
                }}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/20 transition-all text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800">Chủ trọ (Chị Lan)</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Quản lý trọ sinh viên Bình Yên</p>
                </div>
              </button>
            </div>
            
            <div className="text-center pt-2">
              <span className="text-[10px] text-slate-400 font-semibold">
                * Bạn cũng có thể đăng ký tài khoản mới bằng cách chọn "Đăng ký làm chủ trọ" ở menu.
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

