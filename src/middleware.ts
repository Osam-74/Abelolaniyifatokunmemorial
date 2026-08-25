import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { ADMIN_PATH_HEADER, DEFAULT_ADMIN_PATH, normaliseAdminPath } from '@/lib/adminPath';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|audio/|api/).*)'],
};

async function signedIn(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('memorial_admin')?.value;
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret || secret.length < 24) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminPath = normaliseAdminPath(process.env.ADMIN_PATH);
  const custom = adminPath !== DEFAULT_ADMIN_PATH;

  // When a custom path is in use, /admin should not exist at all.
  if (custom && (pathname === DEFAULT_ADMIN_PATH || pathname.startsWith(`${DEFAULT_ADMIN_PATH}/`))) {
    return NextResponse.rewrite(new URL('/_not-found-admin', request.url));
  }

  const isAdmin = pathname === adminPath || pathname.startsWith(`${adminPath}/`);
  if (!isAdmin) return NextResponse.next();

  // Map the public address onto the real routes and tell the pages what it was.
  const rest = pathname.slice(adminPath.length);
  const target = request.nextUrl.clone();
  target.pathname = `${DEFAULT_ADMIN_PATH}${rest}`;

  const headers = new Headers(request.headers);
  headers.set(ADMIN_PATH_HEADER, adminPath);

  const loginPath = `${adminPath}/login`;
  const openPaths = [loginPath, `${adminPath}/reset`];
  if (openPaths.includes(pathname)) {
    return NextResponse.rewrite(target, { request: { headers } });
  }

  if (await signedIn(request)) {
    return NextResponse.rewrite(target, { request: { headers } });
  }

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = loginPath;
  redirectTo.searchParams.set('next', pathname);
  return NextResponse.redirect(redirectTo);
}
