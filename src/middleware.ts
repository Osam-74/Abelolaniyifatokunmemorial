import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export const config = { matcher: ['/admin/:path*'] };

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/admin/login') return NextResponse.next();

  const token = request.cookies.get('memorial_admin')?.value;
  const secret = process.env.AUTH_SECRET;

  if (token && secret && secret.length >= 24) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
      if (payload.role === 'admin') return NextResponse.next();
    } catch {
      // fall through to the sign-in page
    }
  }

  const url = request.nextUrl.clone();
  url.pathname = '/admin/login';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}
