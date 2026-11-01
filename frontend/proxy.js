import { NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

// Next.js 16 renamed `middleware` to `proxy`; this is the auth gate.
// - /dashboard/** requires a signed-in user (else -> /login?next=...)
// - /login and /signup bounce signed-in users to /dashboard
export async function proxy(request) {
  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (!user && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return redirectWithCookies(url, response);
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return redirectWithCookies(url, response);
  }

  return response;
}

// Keep any refreshed auth cookies when redirecting.
function redirectWithCookies(url, response) {
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
