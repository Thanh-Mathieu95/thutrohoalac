import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ENHOUSE',
  description: 'Tìm kiếm phòng trọ, chung cư mini, căn hộ dịch vụ tại khu vực Hòa Lạc với bộ lọc thông minh theo giá và diện tích.',
};

export default function RoomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
