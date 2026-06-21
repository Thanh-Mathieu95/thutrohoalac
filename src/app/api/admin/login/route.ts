import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'enhousetrohoalac@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'enhouse1811';
const SESSION_TOKEN = process.env.ADMIN_SESSION_TOKEN || 'enhouse_admin_s3cr3t_2026';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const emailOk = email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const passOk  = password === ADMIN_PASSWORD;

    if (!emailOk || !passOk) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng!' },
        { status: 401 }
      );
    }

    // Tạo response và set cookie httpOnly
    const response = NextResponse.json({ success: true });

    response.cookies.set('admin_session', SESSION_TOKEN, {
      httpOnly: true,          // JS không đọc được cookie này
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,    // 8 giờ
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
