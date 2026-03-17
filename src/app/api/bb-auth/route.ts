import { NextRequest, NextResponse } from 'next/server';

const PASSWORD = 'AUDCOMP2026';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password === PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set('bb-auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return response;
  }

  return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 });
}
