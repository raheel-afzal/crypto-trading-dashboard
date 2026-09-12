import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/features/auth/session';

// Optimistic gate only: it keeps signed-out visitors off the dashboard, while the
// API still verifies the token on every request it serves.
export function proxy(request: NextRequest) {
  const signedIn = request.cookies.has(SESSION_COOKIE);
  const { pathname } = request.nextUrl;
  const onAuthRoute = pathname === '/login' || pathname === '/signup';

  if (!signedIn && !onAuthRoute) return NextResponse.redirect(new URL('/login', request.url));
  if (signedIn && onAuthRoute) return NextResponse.redirect(new URL('/', request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/signup'],
};
