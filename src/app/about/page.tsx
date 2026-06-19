'use client';

import React from 'react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Home, Shield, Users, Heart, Star, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="pt-24 md:pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-8">
          {/* Hero Section */}
          <div className="max-w-3xl mx-auto text-center mb-20">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              Về <span className="text-airbnb">Thuê Trọ Hòa Lạc</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Chúng tôi là nền tảng kết nối người thuê và chủ nhà hàng đầu tại khu vực Hòa Lạc, 
              mang đến trải nghiệm tìm kiếm minh bạch, an toàn và hiệu quả nhất.
            </p>
          </div>

          {/* Vision/Mission Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-32 items-center">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1000" 
                alt="Modern Apartment" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-gray-900">Sứ mệnh của chúng tôi</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Tại Thuê Trọ Hòa Lạc, chúng tôi tin rằng mọi người đều xứng đáng có một không gian sống lý tưởng. 
                Sứ mệnh của chúng tôi là giải quyết những khó khăn trong việc tìm kiếm phòng trọ bằng cách cung cấp 
                thông tin chính xác, hình ảnh thực tế và dịch vụ hỗ trợ tận tâm.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: <CheckCircle2 className="w-5 h-5 text-airbnb" />, text: "Thông tin xác thực 100%" },
                  { icon: <CheckCircle2 className="w-5 h-5 text-airbnb" />, text: "Hỗ trợ xem phòng 24/7" },
                  { icon: <CheckCircle2 className="w-5 h-5 text-airbnb" />, text: "Giá cả công khai minh bạch" },
                  { icon: <CheckCircle2 className="w-5 h-5 text-airbnb" />, text: "Hợp đồng pháp lý rõ ràng" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                    {item.icon}
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats/Values */}
          <div className="bg-gray-50 rounded-[3rem] p-12 md:p-20 mb-32">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">Giá trị cốt lõi</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { 
                  icon: <Shield className="w-10 h-10 text-airbnb" />, 
                  title: "Tin cậy", 
                  desc: "Chúng tôi kiểm duyệt khắt khe mọi tin đăng để đảm bảo an toàn tuyệt đối cho người dùng." 
                },
                { 
                  icon: <Heart className="w-10 h-10 text-airbnb" />, 
                  title: "Tận tâm", 
                  desc: "Đội ngũ Sale Hùng luôn sẵn sàng đồng hành cùng bạn trong suốt quá trình tìm và thuê phòng." 
                },
                { 
                  icon: <Users className="w-10 h-10 text-airbnb" />, 
                  title: "Cộng đồng", 
                  desc: "Xây dựng một cộng đồng thuê trọ văn minh, hiện đại và hỗ trợ lẫn nhau tại Hòa Lạc." 
                },
              ].map((val, i) => (
                <div key={i} className="text-center space-y-4">
                  <div className="w-20 h-20 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-6">
                    {val.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{val.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{val.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-[#FF385C] rounded-[3rem] py-20 px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Bạn đang tìm phòng trọ ưng ý?</h2>
            <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto">
              Hãy để Thuê Trọ Hòa Lạc giúp bạn tìm thấy không gian sống hoàn hảo chỉ trong vài phút.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild className="bg-white text-airbnb hover:bg-gray-50 px-8 py-7 rounded-2xl font-bold text-lg shadow-xl">
                <Link href="/rooms">Xem danh sách phòng</Link>
              </Button>
              <Button asChild variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 px-8 py-7 rounded-2xl font-bold text-lg">
                <Link href="/ban-do">Khám phá bản đồ</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
