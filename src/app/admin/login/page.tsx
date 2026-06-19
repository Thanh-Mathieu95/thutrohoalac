'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Mail, Lock, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginAs } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('admin@salehung.com');
  const [password, setPassword] = useState('123456');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // 1. Check Demo Account
    if (email === 'admin@salehung.com') {
      loginAs('admin');
      router.push('/admin');
      router.refresh();
      setIsLoading(false);
      return;
    }

    // 2. Fallback to Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Successful login
      router.push('/admin');
      router.refresh();
    } catch (error: any) {
      alert('Lỗi đăng nhập Admin: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050A18] flex flex-col items-center justify-center p-6 relative overflow-hidden text-white">
      {/* Tech background effect */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại trang chủ
        </Link>

        <div className="bg-[#0D1528]/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden">
          <div className="p-10 md:p-12">
            <div className="mb-10 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-brand to-blue-700 rounded-xl flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-brand/40 ring-4 ring-white/5">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-2">Admin Portal</h1>
              <p className="text-gray-400 font-medium">Hệ thống quản trị Thuê Trọ Hòa Lạc</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Tài khoản quản trị</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@thuetrohoalac.vn"
                    className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 focus:border-brand/50 focus:bg-white/10 rounded-2xl outline-none transition-all font-medium text-white placeholder:text-gray-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Mật khẩu bảo mật</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 focus:border-brand/50 focus:bg-white/10 rounded-2xl outline-none transition-all font-medium text-white placeholder:text-gray-600"
                  />
                </div>
              </div>

              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand hover:bg-brand-dark text-white rounded-2xl py-7 font-black text-lg shadow-xl shadow-brand/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  'XÁC THỰC QUẢN TRỊ'
                )}
              </Button>
            </form>

            <div className="mt-10 pt-8 border-t border-white/5 text-center">
              <p className="text-xs text-gray-500 font-medium italic">
                Chỉ dành cho quản trị viên hệ thống. Truy cập trái phép sẽ bị ghi lại địa chỉ IP.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
