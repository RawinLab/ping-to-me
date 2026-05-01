import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

function stripLocalePrefix(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(`/${locale}`.length) || '/';
    }
  }
  return pathname;
}

export default async function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token');
  const pathnameWithoutLocale = stripLocalePrefix(request.nextUrl.pathname);

  const isAuthPage =
    pathnameWithoutLocale.startsWith('/login') ||
    pathnameWithoutLocale.startsWith('/register') ||
    pathnameWithoutLocale.startsWith('/forgot-password') ||
    pathnameWithoutLocale.startsWith('/reset-password');

  if (
    !refreshToken &&
    !isAuthPage &&
    pathnameWithoutLocale.startsWith('/dashboard')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (refreshToken && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
    '/',
    '/(th|en)/:path*',
  ],
};
