import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /bargainballoons/* except the login page itself
  if (
    pathname.startsWith('/bargainballoons') &&
    !pathname.endsWith('login.html')
  ) {
    const auth = request.cookies.get('bb-auth');
    if (!auth || auth.value !== 'authenticated') {
      return NextResponse.redirect(
        new URL('/bargainballoons/login.html', request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/bargainballoons/:path*'],
};
