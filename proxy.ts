import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from './lib/supabase/database.types';
import { legacyContentRedirect } from './app/_lib/legacy-redirects';

export async function proxy(request: NextRequest) {
  if (request.method === 'GET' || request.method === 'HEAD') {
    const target = legacyContentRedirect(request.nextUrl.pathname, request.nextUrl.search);
    if (target) return NextResponse.redirect(new URL(target, request.url), 308);
  }
  const locale = request.nextUrl.pathname.match(/^\/(ro|ru)(?:\/|$)/)?.[1] ?? 'ro';
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-sporto-locale', locale);
  requestHeaders.set('x-sporto-pathname', request.nextUrl.pathname);
  requestHeaders.set('x-sporto-search', request.nextUrl.search);
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Refresh the session when Supabase is configured. Local builds may omit
  // credentials, but that should not make public routes return HTTP 500.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Public content has no account-dependent rendering; refresh only where sessions are used.
  const publicContent = /^\/(ro|ru)(?:\/|$)/.test(request.nextUrl.pathname)
    && !/^\/(ro|ru)\/(order-request|account|login|register|callback|forgot-password|reset-password)(?:\/|$)/.test(request.nextUrl.pathname);
  if (!publicContent && supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          requestHeaders.set('cookie', request.headers.get('cookie') || '');
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    await supabase.auth.getUser();
  }

  // Extract and set locale header
  response.headers.set('x-sporto-locale', locale);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
