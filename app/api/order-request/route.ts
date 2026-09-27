import handler from '../../../api/order-request';

export async function POST(request: Request) {
  // Bound the streamed body before parsing, including requests without a
  // Content-Length header. The existing handler retains validation/rate limits.
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 48_000) {
        await reader.cancel();
        return Response.json({ error: 'payload_too_large' }, { status: 413 });
      }
      chunks.push(value);
    }
  }
  const headers = new Headers();
  let status = 500;
  let body: unknown = { error: 'service_error' };
  await handler({
    method: 'POST',
    headers: Object.fromEntries(request.headers),
    body: Buffer.concat(chunks).toString('utf8'),
  }, {
    setHeader: (name, value) => { headers.set(name, value); },
    status: code => ({ json: value => { status = code; body = value; } }),
  });
  return Response.json(body, { status, headers });
}
