import { getAdminUser } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
const MAX_BODY = 25 * 1024 * 1024;

async function handle(request: Request, context: { params: Promise<{ path: string[] }> }) {
  // Cookie-authenticated writes are accepted only from this site's origin.
  if (!['GET', 'HEAD'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || new URL(request.url).host;
    const protocol = request.headers.get('x-forwarded-proto') || new URL(request.url).protocol.replace(':', '');
    if (!origin || origin !== `${protocol}://${host}`) return Response.json({ message: 'Forbidden origin' }, { status: 403 });
  }
  if (!await getAdminUser()) return Response.json({ message: 'Требуется вход администратора.' }, { status: 403 });
  const { path } = await context.params;
  if (!['rest', 'storage'].includes(path[0]) || path[1] !== 'v1'
      || path.length < 3 || path.some(p => !p || p === '.' || p === '..' || /[\\/\u0000]/.test(p))) {
    return Response.json({ message: 'Invalid path' }, { status: 400 });
  }
  if (path[0] === 'storage' && path[2] !== 'object') return Response.json({ message: 'Unsupported storage operation' }, { status: 400 });
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return Response.json({ message: 'Сессия истекла.' }, { status: 401 });
  const headers = new Headers({
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${session.access_token}`,
  });
  for (const name of ['content-type', 'prefer', 'range', 'range-unit', 'accept', 'x-upsert', 'cache-control']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  let body: Uint8Array | undefined;
  if (request.body) {
    if (Number(request.headers.get('content-length')) > MAX_BODY) return Response.json({ message: 'Файл слишком большой (максимум 25 МБ).' }, { status: 413 });
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_BODY) { await reader.cancel(); return Response.json({ message: 'Файл слишком большой (максимум 25 МБ).' }, { status: 413 }); }
      chunks.push(chunk.value);
    }
    body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  }
  const target = new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, '')}/${path.map(encodeURIComponent).join('/')}`);
  target.search = new URL(request.url).search;
  try {
    // User token preserves RLS. Never elevate admin requests to service-role access.
    const upstream = await fetch(target, { method: request.method, headers, body: body as BodyInit | undefined, cache: 'no-store', redirect: 'manual' });
    const responseHeaders = new Headers({ 'Cache-Control': 'no-store' });
    for (const name of ['content-type', 'content-range', 'range-unit', 'preference-applied']) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({ message: 'Не удалось связаться с базой данных. Попробуйте ещё раз.' }, { status: 502 });
  }
}

export { handle as GET, handle as HEAD, handle as POST, handle as PATCH, handle as PUT, handle as DELETE };
