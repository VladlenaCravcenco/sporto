const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://ruvhllbbytjkxkzvusyb.supabase.co';
const SUPABASE_SERVER_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
      apikey: SUPABASE_SERVER_KEY,
      // New secret keys are API keys, not JWTs. Only legacy role JWTs use Bearer.
      ...(SUPABASE_SERVER_KEY.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${SUPABASE_SERVER_KEY}` }),
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
  // Resend is selected explicitly; an incomplete setup must not send via another service.
  if (env.ORDER_EMAIL_PROVIDER === 'resend') {
    const escape = (value: string) => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
    const number = params.order_id;
    const customerSubject = ru ? `Sporto — заявка №${number} получена` : `Sporto — cererea nr. ${number} a fost primită`;
    const adminSubject = `Sporto — новая заявка №${number}`;
    const details = [
      `${ru ? 'Заявка' : 'Cerere'}: ${number}`, params.order_date,
      `${ru ? 'Клиент' : 'Client'}: ${submission.name}`,
      `Email: ${submission.email}`, `${ru ? 'Телефон' : 'Telefon'}: ${submission.phone}`,
      `${ru ? 'Компания' : 'Companie'}: ${params.client_company}`,
      `${ru ? 'Адрес доставки' : 'Adresa de livrare'}: ${params.delivery_address}`,
      `${ru ? 'Комментарий' : 'Comentariu'}: ${params.notes}`,
      '', params.items_list, '',
      `${ru ? 'Товары' : 'Produse'}: ${params.total_price} MDL`,
      `${ru ? 'Расчёт доставки' : 'Livrare estimată'}: ${params.delivery_price} MDL`,
      `${ru ? 'Итого предварительно' : 'Total estimat'}: ${params.total_with_delivery} MDL`,
      '', params.confirmation_note,
    ].join('\n');
    const label = (russian: string, romanian: string) => ru ? russian : romanian;
    const safeImage = (value: string | null) => {
      if (!value) return null;
      try {
        const url = new URL(value);
        return url.protocol === 'https:' && !url.username && !url.password ? escape(url.href) : null;
      } catch { return null; }
    };
    const rows = items.map(item => {
      const name = (ru ? item.name_ru || item.name_ro : item.name_ro || item.name_ru) || item.sku || 'SPORTO';
      const image = safeImage(item.image_url);
      return `<tr><td width="64" valign="top" style="padding:18px 12px 18px 0;border-bottom:1px solid #e8e8e8">${image ? `<img src="${image}" alt="${escape(name)}" width="64" height="64" style="display:block;width:64px;height:64px;object-fit:contain;background:#fff;border:1px solid #eee;border-radius:8px">` : `<div style="width:64px;height:64px;background:#f2f2f2;border-radius:8px;text-align:center;line-height:64px;font-size:10px;color:#666">Sporto</div>`}</td><td valign="top" style="padding:18px 8px 18px 0;border-bottom:1px solid #e8e8e8;font-size:14px;line-height:1.5;overflow-wrap:anywhere"><strong>${escape(name)}</strong>${item.sku ? `<br><span style="color:#666;font-size:12px">SKU ${escape(item.sku)}</span>` : ''}<br><span style="color:#666">${item.qty} × ${item.price.toFixed(2)} MDL</span></td><td width="90" align="right" valign="top" style="padding:18px 0;border-bottom:1px solid #e8e8e8;font-size:14px;line-height:1.5;font-weight:bold">${(item.qty * item.price).toFixed(2)}<br><span style="font-weight:normal;font-size:12px;color:#666">MDL</span></td></tr>`;
    }).join('');
    const contact = env.ORDER_EMAIL_REPLY_TO || adminEmail;
    const contactLink = contact && isEmail(contact) ? `<a href="mailto:${escape(contact)}" style="color:#222;text-decoration:underline">${escape(contact)}</a>` : '';
    const field = (title: string, value: string) => `<p style="margin:0 0 16px;font-size:14px;line-height:1.6"><span style="color:#666;font-size:12px">${title}</span><br><span style="white-space:pre-wrap;overflow-wrap:anywhere">${escape(value)}</span></p>`;
    const customerHtml = `<!doctype html><html lang="${ru ? 'ru' : 'ro'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(customerSubject)}</title></head><body style="margin:0;padding:0;background:#fff;color:#222;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${escape(label('Заявка получена. Менеджер свяжется с вами для подтверждения.', 'Cererea a fost primită. Managerul vă va contacta pentru confirmare.'))}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff"><tr><td style="padding:24px 24px 16px;border-bottom:1px solid #e8e8e8"><span style="font-size:18px;font-weight:bold">Sporto</span><br><span style="font-size:13px;color:#666">Sport · Fitness · Wellness</span></td></tr><tr><td style="padding:28px 24px"><p style="margin:0 0 12px;font-size:12px;color:#666">${label('Заявка', 'Cerere')} №${escape(number)} · ${escape(params.order_date)}</p><h1 style="margin:0 0 16px;font-size:20px;line-height:1.4">${label('Спасибо! Ваша заявка получена.', 'Mulțumim! Cererea dvs. a fost primită.')}</h1><p style="margin:0 0 24px;font-size:15px;line-height:1.7">${escape(submission.name)}, ${label('мы сохранили вашу заявку. Менеджер свяжется с вами, чтобы подтвердить наличие товаров, итоговую стоимость и доставку.', 'am înregistrat cererea dvs. Managerul vă va contacta pentru a confirma disponibilitatea produselor, costul final și livrarea.')}</p><h2 style="font-size:16px;margin:0 0 4px">${label('Товары в заявке', 'Produsele solicitate')}</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed">${rows}</table><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;font-size:14px;line-height:1.6"><tr><td style="padding:4px 0;color:#666">${label('Товары', 'Produse')}</td><td align="right">${params.total_price} MDL</td></tr><tr><td style="padding:4px 0;color:#666">${label('Расчёт доставки', 'Livrare estimată')}</td><td align="right">${delivery === 0 ? label('Бесплатно', 'Gratuită') : `${params.delivery_price} MDL`}</td></tr><tr><td style="padding-top:12px;font-weight:bold">${label('Предварительный итог', 'Total estimat')}</td><td align="right" style="padding-top:12px;font-size:18px;font-weight:bold">${params.total_with_delivery} MDL</td></tr></table><p style="padding:0;font-size:14px;line-height:1.6;margin:0 0 24px">${escape(params.confirmation_note)}</p><h2 style="font-size:16px;margin:0 0 16px">${label('Ваши данные', 'Datele dvs.')}</h2>${field(label('Имя', 'Nume'), submission.name)}${field('Email', submission.email)}${field(label('Телефон', 'Telefon'), submission.phone)}${submission.company ? field(label('Компания', 'Companie'), submission.company) : ''}${submission.deliveryAddress ? field(label('Адрес доставки', 'Adresa de livrare'), submission.deliveryAddress) : ''}${submission.notes ? field(label('Комментарий', 'Comentariu'), submission.notes) : ''}<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #eee;font-size:14px;line-height:1.7">${label('Есть вопросы? Ответьте на это письмо.', 'Aveți întrebări? Răspundeți la acest email.')}<br>${contactLink}</p></td></tr></table><p style="margin:16px 0 0;color:#666;font-size:12px">Sporto · ${label('Спортивное оборудование', 'Echipamente sportive')}</p></td></tr></table></body></html>`;
    let adminLink = '';
    if (env.ORDER_ADMIN_URL) {
      try {
        const url = new URL(env.ORDER_ADMIN_URL);
        if (url.protocol === 'https:' && !url.username && !url.password) {
          adminLink = `<p style="margin:24px 0"><a href="${escape(url.href)}" style="color:#222;text-decoration:underline;font-size:14px">Открыть заявки в админке</a></p>`;
        }
      } catch { /* Invalid optional admin URL must not prevent notification delivery. */ }
    }
    const adminHtml = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(adminSubject)}</title></head><body style="margin:0;padding:0;background:#fff;color:#222;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden;mso-hide:all">Новая заявка №${escape(number)} · ${escape(submission.name)} · ${params.total_with_delivery} MDL</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff"><tr><td style="padding:24px 24px 16px;border-bottom:1px solid #e8e8e8"><span style="font-size:18px;font-weight:bold">Sporto</span><br><span style="font-size:13px;color:#666">Уведомление о новой заявке</span></td></tr><tr><td style="padding:28px 24px"><p style="margin:0 0 12px;font-size:12px;color:#666">№${escape(number)} · ${escape(params.order_date)}</p><h1 style="margin:0 0 16px;font-size:20px;line-height:1.4">Новая заявка получена</h1><p style="margin:0 0 24px;font-size:14px;line-height:1.7">Заявка сохранена в админке. Свяжитесь с клиентом, чтобы подтвердить наличие, итоговую стоимость и доставку.</p><div style="margin-bottom:24px"><h2 style="font-size:16px;margin:0 0 14px">Контакты клиента</h2>${field('Имя', submission.name)}${field('Тип клиента', submission.clientType === 'company' ? 'Юрлицо' : 'Физлицо')}${submission.company ? field('Компания', submission.company) : ''}<p style="margin:0 0 12px;font-size:14px;line-height:1.7"><span style="color:#666;font-size:12px">Email</span><br><a href="mailto:${escape(submission.email)}" style="color:#222;overflow-wrap:anywhere">${escape(submission.email)}</a></p><p style="margin:0;font-size:14px;line-height:1.7"><span style="color:#666;font-size:12px">Телефон</span><br><a href="tel:${escape(submission.phone.replace(/[^+\d]/g, ''))}" style="color:#222">${escape(submission.phone)}</a></p></div><h2 style="font-size:16px;margin:0 0 4px">Товары (${params.total_items})</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed">${rows}</table><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;font-size:14px;line-height:1.6"><tr><td style="padding:4px 0;color:#666">Товары</td><td align="right">${params.total_price} MDL</td></tr><tr><td style="padding:4px 0;color:#666">Расчёт доставки</td><td align="right">${delivery === 0 ? 'Бесплатно' : `${params.delivery_price} MDL`}</td></tr><tr><td style="padding-top:12px;font-weight:bold">Предварительный итог</td><td align="right" style="padding-top:12px;font-size:18px;font-weight:bold">${params.total_with_delivery} MDL</td></tr></table>${field('Адрес доставки', submission.deliveryAddress || 'Не указан')}${field('Комментарий клиента', submission.notes || 'Не указан')}${adminLink}<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #eee;font-size:13px;line-height:1.7">Нажмите «Ответить» на это письмо, чтобы написать клиенту.<br>Заявка не является подтверждением оплаты.</p><p style="margin:16px 0 0;color:#666;font-size:11px;line-height:1.5;overflow-wrap:anywhere">Полный ID: ${escape(orderId)}</p></td></tr></table><p style="margin:16px 0 0;color:#666;font-size:12px">Sporto · Уведомление администратору</p></td></tr></table></body></html>`;
    async function sendResend(kind: 'client' | 'admin', to: string | undefined): Promise<'sent' | 'failed' | 'not_configured'> {
      if (!env.RESEND_API_KEY || !env.ORDER_EMAIL_FROM || !to) return 'not_configured';
      const subject = kind === 'client' ? customerSubject : adminSubject;
      const content = kind === 'client' ? details : `Новая заявка сохранена в админке.\nПолный ID: ${orderId}\n\n${details}`;
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST', signal: AbortSignal.timeout(10_000),
          headers: {'Content-Type':'application/json', Authorization:`Bearer ${env.RESEND_API_KEY}`, 'Idempotency-Key':`order-${orderId}-${kind}`},
          body: JSON.stringify({from:env.ORDER_EMAIL_FROM, to:[to], subject,
            text:content, html:kind === 'client' ? customerHtml : adminHtml,
            ...(kind === 'admin' ? {reply_to:submission.email} : env.ORDER_EMAIL_REPLY_TO ? {reply_to:env.ORDER_EMAIL_REPLY_TO} : {}),
          }),
        });
        if (!response.ok) { console.error('[order-request] resend rejected', orderId, kind, response.status); return 'failed'; }
        const receipt = await response.json() as {id?: string};
        return typeof receipt.id === 'string' && receipt.id ? 'sent' : 'failed';
      } catch {
        console.error('[order-request] resend transport failed', orderId, kind);
        return 'failed';
      }
    }
    const client = await sendResend('client', submission.email);
    const admin = await sendResend('admin', adminEmail);
    return {client, admin};
  }
  if (env.ORDER_EMAIL_PROVIDER && env.ORDER_EMAIL_PROVIDER !== 'emailjs') {
    return {client:'not_configured' as const, admin:'not_configured' as const};
  }
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

  if (!SUPABASE_SERVER_KEY) {
    console.error('[order-request] Supabase server key is not configured');
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
