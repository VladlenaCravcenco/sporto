// Next admin data calls use a same-origin endpoint with a server-side role check.
// Auth and Realtime still use Supabase's cookie-aware client and user credentials.
export const adminTransport: typeof fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (typeof window !== 'undefined' && /^\/admin(?:\/|$)/.test(window.location.pathname)
      && configured && url.origin === new URL(configured).origin
      && /^\/(?:rest|storage)\/v1\//.test(url.pathname)) {
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
    headers.delete('authorization'); headers.delete('apikey');
    const target = `/api/admin/supabase${url.pathname}${url.search}`;
    const request = input instanceof Request ? new Request(new URL(target, window.location.origin), input) : target;
    return fetch(request, { ...init, headers, credentials: 'same-origin' });
  }
  return fetch(input, init);
};
