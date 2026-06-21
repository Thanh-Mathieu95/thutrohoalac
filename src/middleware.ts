import { NextRequest, NextResponse } from 'next/server';

const SESSION_TOKEN = process.env.ADMIN_SESSION_TOKEN || 'enhouse_admin_s3cr3t_2026';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Chỉ bảo vệ các route /admin (trừ /admin/login)
  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginPage  = pathname === '/admin/login';

  if (!isAdminRoute || isLoginPage) {
    return NextResponse.next();
  }

  // Kiểm tra cookie
  const session = request.cookies.get('admin_session')?.value;

  if (session !== SESSION_TOKEN) {
    // Chưa đăng nhập → redirect về trang login
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Áp dụng middleware cho tất cả route /admin/* nhưng bỏ qua static files
  matcher: ['/admin/:path*'],
};
