// src/components/demo-switcher.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentUser, loginAs, AuthUser } from '@/lib/auth';
import { Shield, User, Users, Check, Database, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';

export function DemoSwitcher() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [forceLocal, setForceLocal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    setForceLocal(db.getUseLocalDB());
    
    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
    };
    
    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  const handleToggleLocalDB = () => {
    const newVal = !forceLocal;
    db.setUseLocalDB(newVal);
    setForceLocal(newVal);
    window.location.reload();
  };

  const handleResetDB = () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại cơ sở dữ liệu mẫu về mặc định? Toàn bộ các thay đổi cục bộ của bạn sẽ bị xóa.')) {
      db.resetDatabase();
      alert('Đã khôi phục dữ liệu mẫu thành công!');
      window.location.reload();
    }
  };

  const handleRoleChange = (roleKey: 'guest' | 'admin' | 'owner_nam' | 'owner_lan') => {
    loginAs(roleKey);
    setIsOpen(false);
    
    // Redirect based on selected role to show dashboards immediately
    if (roleKey === 'admin') {
      router.push('/admin');
    } else if (roleKey.startsWith('owner')) {
      router.push('/owner');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-brand text-white font-bold p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border-2 border-white"
        style={{ backgroundColor: '#0075de' }}
      >
        <Shield className="w-5 h-5" />
        <span className="text-xs uppercase tracking-wider font-extrabold hidden md:inline">Demo Switcher</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-xl border border-gray-100 shadow-2xl p-6 w-80 text-left transition-all scale-100 duration-200">
          <div className="border-b border-gray-50 pb-4 mb-4">
            <h4 className="font-heading font-black text-gray-900 text-lg">Giả lập Vai trò (Demo Mode)</h4>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">Kiểm thử nhanh phân quyền website</p>
          </div>

          <div className="space-y-2">
            {/* Guest */}
            <button
              onClick={() => handleRoleChange('guest')}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                !currentUser ? 'bg-brand/5 border border-brand/20 text-brand' : 'hover:bg-gray-50 border border-transparent text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${!currentUser ? 'bg-brand/10' : 'bg-gray-100'}`}>
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black">Khách Thuê</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Xem phòng, đặt lịch hẹn</div>
                </div>
              </div>
              {!currentUser && <Check className="w-4 h-4 text-brand" style={{ color: '#0075de' }} />}
            </button>

            {/* Admin / Broker */}
            <button
              onClick={() => handleRoleChange('admin')}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                currentUser?.role === 'admin' ? 'bg-brand/5 border border-brand/20 text-brand' : 'hover:bg-gray-50 border border-transparent text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${currentUser?.role === 'admin' ? 'bg-brand/10' : 'bg-gray-100'}`}>
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black">Môi Giới (Admin)</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Duyệt ảnh, xem Leads, Lịch hẹn</div>
                </div>
              </div>
              {currentUser?.role === 'admin' && <Check className="w-4 h-4 text-brand" style={{ color: '#0075de' }} />}
            </button>

            {/* Owner - Anh Nam */}
            <button
              onClick={() => handleRoleChange('owner_nam')}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                currentUser?.role === 'owner' && currentUser.email === 'nam@gmail.com' ? 'bg-brand/5 border border-brand/20 text-brand' : 'hover:bg-gray-50 border border-transparent text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${currentUser?.role === 'owner' && currentUser.email === 'nam@gmail.com' ? 'bg-brand/10' : 'bg-gray-100'}`}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black">Chủ Trọ (Anh Nam)</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Quản lý 3 nhà trọ Q5, Thủ Đức, BT</div>
                </div>
              </div>
              {currentUser?.role === 'owner' && currentUser.email === 'nam@gmail.com' && <Check className="w-4 h-4 text-brand" style={{ color: '#0075de' }} />}
            </button>

            {/* Owner - Chị Lan */}
            <button
              onClick={() => handleRoleChange('owner_lan')}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                currentUser?.role === 'owner' && currentUser.email === 'lan@gmail.com' ? 'bg-brand/5 border border-brand/20 text-brand' : 'hover:bg-gray-50 border border-transparent text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${currentUser?.role === 'owner' && currentUser.email === 'lan@gmail.com' ? 'bg-brand/10' : 'bg-gray-100'}`}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black">Chủ Trọ (Chị Lan)</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Quản lý trọ sinh viên Làng Đại Học</div>
                </div>
              </div>
              {currentUser?.role === 'owner' && currentUser.email === 'lan@gmail.com' && <Check className="w-4 h-4 text-brand" style={{ color: '#0075de' }} />}
            </button>
          </div>

          {/* Database Control Section */}
          <div className="border-t border-gray-100 mt-4 pt-4 space-y-3">
            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cơ sở dữ liệu (Database)</h5>
            
            {/* Toggle Force LocalStorage */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100/50 cursor-pointer transition-colors">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-[11px] font-bold text-gray-700">Chỉ dùng LocalStorage</span>
              </div>
              <input 
                type="checkbox"
                checked={forceLocal}
                onChange={handleToggleLocalDB}
                className="w-4 h-4 rounded border-gray-300 focus:ring-[#0075de] accent-[#0075de]"
              />
            </label>

            {/* Reset Database Button */}
            <button
              onClick={handleResetDB}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-red-200 text-red-500 hover:bg-red-50/50 hover:border-red-300 active:scale-95 transition-all text-[11px] font-black uppercase tracking-wider"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Khôi Phục Dữ Liệu Mẫu</span>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-50 text-[10px] font-bold text-gray-400 leading-relaxed text-center">
            * Nhấn để chuyển quyền truy cập hệ thống và tự động lọc dữ liệu.
          </div>
        </div>
      )}
    </div>
  );
}
