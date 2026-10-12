const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://ruvhllbbytjkxkzvusyb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const MAX_BODY_BYTES = 48_000;
const MAX_ITEMS = 100;
const RATE_WINDOW_SECONDS = 10 * 60;

type CartItem = {
  id: string;
  name_ro: string;
  name_ru: string;
  sku: string | null;
  price: number;
  qty: number;
  image_url: string | null;
};

type Submission = {
  name?: unknown;
  company?: unknown;
  email?: unknown;
  phone?: unknown;
  clientType?: unknown;
  deliveryAddress?: unknown;
  notes?: unknown;
  language?: unknown;
  website?: unknown;
  items?: unknown;
};

type ApiRequest = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => { json: (body: unknown) => void };
};

function text(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function normalizeEmail(value: unknown): string {
  return text(value, 254).toLowerCase();
}

function normalizePhone(value: unknown): string {
  return text(value, 40);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseItems(value: unknown): CartItem[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_ITEMS) return null;

  const items: CartItem[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') return null;
    const item = raw as Record<string, unknown>;
    const id = text(item.id, 120);
    const nameRo = text(item.name_ro, 500);
    const nameRu = text(item.name_ru, 500);
    const price = Number(item.price);
    const qty = Math.floor(Number(item.qty));

    if (!id || (!nameRo && !nameRu) || !Number.isFinite(price) || price < 0 || !Number.isFinite(qty) || qty < 1 || qty > 999) {
      return null;
    }

    items.push({
      id,
      name_ro: nameRo,
      name_ru: nameRu,
      sku: text(item.sku, 120) || null,
      price: Math.round(price * 100) / 100,
      qty,
      image_url: text(item.image_url, 2_000) || null,
    });
  }
  return items;
}

function getHeader(req: ApiRequest, name: string): string {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function getClientIp(req: ApiRequest): string {
  const forwarded = getHeader(req, 'x-forwarded-for').split(',')[0]?.trim();
  return forwarded || getHeader(req, 'x-real-ip') || 'unknown';
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function supabaseRest(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

async function consumeRateLimit(keyHash: string, limit: number): Promise<boolean> {
  const response = await supabaseRest('rpc/consume_order_request_rate_limit', {
    method: 'POST',
    body: JSON.stringify({
      p_key_hash: keyHash,
      p_limit: limit,
      p_window_seconds: RATE_WINDOW_SECONDS,
    }),
  });
  if (!response.ok) throw new Error(`Rate limit RPC failed: ${response.status}`);
  return response.json() as Promise<boolean>;
}

async function linkClient(orderId: string, submission: Required<Omit<Submission, 'items' | 'website'>>): Promise<string | null> {
  // Anonymous phone-only leads stay on the request; never merge contacts by an empty email.
  if (!submission.email) return null;
  const response = await supabaseRest('rpc/link_order_request_client', {
    method: 'POST',
    body: JSON.stringify({
      p_order_id: orderId,
      p_name: submission.name,
      p_company: submission.company,
      p_email: submission.email,
      p_phone: submission.phone,
      p_address: submission.deliveryAddress,
      p_client_type: submission.clientType,
    }),
  });
  if (!response.ok) throw new Error(`Client linking RPC failed: ${response.status}`);
  return response.json() as Promise<string | null>;
}

// EmailJS limits sends to one per second. Serialize within this server process.
let emailQueue: Promise<unknown> = Promise.resolve();
async function sendOrderEmails(orderId: string, submission: {
  name: string; email: string; phone: string; company: string;
  clientType: string; deliveryAddress: string; notes: string; language: string;
}, items: CartItem[], totalPrice: number) {
  const env = process.env;
  const service = env.EMAILJS_SERVICE_ID || env.VITE_EMAILJS_SERVICE_ID;
  const publicKey = env.EMAILJS_PUBLIC_KEY || env.VITE_EMAILJS_PUBLIC_KEY;
  const clientTemplate = env.EMAILJS_TEMPLATE_ORDER_CONFIRMATION;
  const adminTemplate = env.EMAILJS_TEMPLATE_ADMIN || env.VITE_EMAILJS_TEMPLATE_ADMIN;
  const adminEmail = env.ORDER_ADMIN_EMAIL || env.VITE_ADMIN_EMAIL;
  const ru = submission.language === 'ru';
  const delivery = totalPrice >= 500 ? 0 : 100;
  const params = {
    order_id: orderId.slice(0, 8).toUpperCase(),
    order_date: new Intl.DateTimeFormat(ru ? 'ru-RU' : 'ro-RO', {dateStyle:'medium', timeStyle:'short', timeZone:'Europe/Chisinau'}).format(new Date()),
    client_name: submission.name, client_email: submission.email,
    client_phone: submission.phone, client_company: submission.company || '—',
    client_type: submission.clientType === 'company' ? (ru ? 'Юрлицо' : 'Persoană juridică') : (ru ? 'Физлицо' : 'Persoană fizică'),
    delivery_address: submission.deliveryAddress || '—', notes: submission.notes || '—',
    total_items: items.reduce((sum, item) => sum + item.qty, 0),
    total_price: totalPrice.toFixed(2), delivery_price: delivery.toFixed(2),
    total_with_delivery: (totalPrice + delivery).toFixed(2),
    items_list: items.map((item, i) => `${i + 1}. ${ru ? item.name_ru || item.name_ro : item.name_ro || item.name_ru}${item.sku ? ` [${item.sku}]` : ''}\n${item.qty} × ${item.price.toFixed(2)} MDL = ${(item.qty * item.price).toFixed(2)} MDL`).join('\n\n'),
    confirmation_note: ru ? 'Заявка получена. Менеджер подтвердит наличие, итоговую цену и доставку. Это не подтверждение оплаты.' : 'Cererea a fost primită. Managerul va confirma disponibilitatea, prețul final și livrarea. Aceasta nu este o confirmare de plată.',
    language: submission.language,
  };
  async function send(template: string | undefined, to: string | undefined): Promise<'sent' | 'failed' | 'not_configured'> {
    if (!service || !publicKey || !template || !to) return 'not_configured';
    const job = emailQueue.then(async () => {
      try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          signal: AbortSignal.timeout(10_000),
          body: JSON.stringify({service_id:service, template_id:template, user_id:publicKey,
            ...(env.EMAILJS_PRIVATE_KEY ? {accessToken:env.EMAILJS_PRIVATE_KEY} : {}),
            template_params:{...params, to_email:to, to_name:submission.name}}),
        });
        if (!response.ok) console.error('[order-request] email rejected', orderId, response.status);
        return response.ok ? 'sent' as const : 'failed' as const;
      } catch {
        console.error('[order-request] email transport failed', orderId);
        return 'failed' as const;
      } finally {
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
    });
    emailQueue = job.catch(() => undefined);
    return job;
  }
  const client = await send(clientTemplate, submission.email);
  const admin = await send(adminTemplate, adminEmail);
  return {client, admin};
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[order-request] SUPABASE_SERVICE_ROLE_KEY is not configured');
    return res.status(503).json({ error: 'service_unavailable' });
  }

  const contentLength = Number(getHeader(req, 'content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'payload_too_large' });
  }

  let parsedBody: unknown = req.body;
  if (typeof parsedBody === 'string') {
    try {
      parsedBody = JSON.parse(parsedBody);
    } catch {
      return res.status(400).json({ error: 'invalid_json' });
    }
  }
  const body = (parsedBody && typeof parsedBody === 'object' ? parsedBody : {}) as Submission;
  if (text(body.website, 200)) {
    // Honeypot submissions receive a neutral response and are not stored.
    return res.status(200).json({ accepted: true });
  }

  const submission = {
    name: text(body.name, 200),
    company: text(body.company, 250),
    email: normalizeEmail(body.email),
    phone: normalizePhone(body.phone),
    clientType: body.clientType === 'individual' ? 'individual' : 'company',
    deliveryAddress: text(body.deliveryAddress, 500),
    notes: text(body.notes, 3_000),
    language: body.language === 'ru' ? 'ru' : 'ro',
  } as const;
  const phoneDigits = submission.phone.replace(/\D/g, '');
  const items = parseItems(body.items);

  if (!submission.name || !isEmail(submission.email) || (submission.clientType === 'company' && !submission.company) || phoneDigits.length < 8 || !items) {
    return res.status(400).json({ error: 'invalid_submission' });
  }

  try {
    const ipHash = await sha256(`ip:${getClientIp(req)}`);
    const contactHash = await sha256(`contact:${submission.email}:${phoneDigits}`);
    const [ipAllowed, contactAllowed] = await Promise.all([
      consumeRateLimit(ipHash, 10),
      consumeRateLimit(contactHash, 4),
    ]);

    if (!ipAllowed || !contactAllowed) {
      res.setHeader('Retry-After', String(RATE_WINDOW_SECONDS));
      return res.status(429).json({ error: 'rate_limited', retryAfter: RATE_WINDOW_SECONDS });
    }

    const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = Math.round(items.reduce((sum, item) => sum + item.price * item.qty, 0) * 100) / 100;
    const insertResponse = await supabaseRest('order_requests?select=id', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        client_name: submission.name,
        client_company: submission.company || null,
        client_email: submission.email,
        client_phone: submission.phone,
        client_type: submission.clientType,
        delivery_address: submission.deliveryAddress || null,
        notes: submission.notes || null,
        cart_items: items,
        total_price: totalPrice,
        total_items: totalItems,
        status: 'new',
      }),
    });

    if (!insertResponse.ok) {
      console.error('[order-request] insert failed', insertResponse.status, await insertResponse.text());
      return res.status(500).json({ error: 'request_not_saved' });
    }

    const inserted = await insertResponse.json() as Array<{ id: string }>;
    const orderId = inserted[0]?.id;
    if (!orderId) return res.status(500).json({ error: 'request_not_saved' });

    let clientId: string | null = null;
    try {
      clientId = await linkClient(orderId, submission);
    } catch (error) {
      // The lead is already stored. CRM linking must never turn it into a failed submission.
      console.error('[order-request] client linking failed', error);
    }

    const notifications = await sendOrderEmails(orderId, submission, items, totalPrice);
    return res.status(201).json({ accepted: true, orderId, clientId, notifications });
  } catch (error) {
    console.error('[order-request] submission failed', error);
    return res.status(500).json({ error: 'service_error' });
  }
}
