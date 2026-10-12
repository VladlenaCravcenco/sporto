import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from './lib/supabase/database.types';

export async function proxy(request: NextRequest) {
  const locale = request.nextUrl.pathname.match(/^\/(ro|ru)(?:\/|$)/)?.[1] ?? 'ro';
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-sporto-locale', locale);
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Refresh the session when Supabase is configured. Local builds may omit
  // credentials, but that should not make public routes return HTTP 500.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnonKey) {
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
