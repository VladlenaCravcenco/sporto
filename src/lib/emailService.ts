/**
 * ─── EmailJS Email Service ────────────────────────────────────────────────────
 *
 * 2 шаблона:
 *   Template 1 — «welcome»      → клиенту при регистрации (подтверждение)
 *   Template 2 — «order_admin»  → админу при новой заявке
 *
 * .env:
 *   VITE_EMAILJS_PUBLIC_KEY=your_public_key
 *   VITE_EMAILJS_SERVICE_ID=service_odgatyo
 *   VITE_EMAILJS_TEMPLATE_WELCOME=template_xxxxxxx
 *   VITE_EMAILJS_TEMPLATE_ADMIN=template_xxxxxxx
 *   VITE_ADMIN_EMAIL=sportoadmin@gmail.com
 */

import emailjs from '@emailjs/browser';

// ─── Config ───────────────────────────────────────────────────────────────────
export const EMAILJS = {
  publicKey:  import.meta.env.VITE_EMAILJS_PUBLIC_KEY       || '',
  serviceId:  import.meta.env.VITE_EMAILJS_SERVICE_ID       || 'service_odgatyo',
  tplWelcome: import.meta.env.VITE_EMAILJS_TEMPLATE_WELCOME || '',
  tplAdmin:   import.meta.env.VITE_EMAILJS_TEMPLATE_ADMIN   || '',
  adminEmail: import.meta.env.VITE_ADMIN_EMAIL              || 'sportoadmin@gmail.com',
};

export const isEmailConfigured = () =>
  !!(EMAILJS.publicKey && EMAILJS.serviceId);

// Init once
let _inited = false;
function init() {
  if (_inited || !EMAILJS.publicKey) return;
  emailjs.init({ publicKey: EMAILJS.publicKey });
  _inited = true;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate() {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date());
}

function fmtItems(items: OrderEmailData['items']): string {
  return items
    .map((it, i) => {
      const name = it.name_ru || it.name_ro;
      const sku  = it.sku ? ` [${it.sku}]` : '';
      const sub  = (it.price * it.qty).toLocaleString('ru-RU');
      return `${i + 1}. ${name}${sku}\n   ${it.qty} шт. × ${it.price.toLocaleString('ru-RU')} MDL = ${sub} MDL`;
    })
    .join('\n\n');
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface OrderEmailData {
  orderId:         string;
  clientName:      string;
  clientEmail:     string;
  clientPhone:     string;
  clientCompany:   string;
  deliveryAddress: string;
  notes:           string;
  totalPrice:      number;
  totalItems:      number;
  items: Array<{
    name_ru: string;
    name_ro: string;
    sku:     string | null;
    price:   number;
    qty:     number;
  }>;
  language: 'ru' | 'ro';
}

// ─── 1. Клиенту — подтверждение регистрации ──────────────────────────────────
export async function sendWelcomeEmail(params: {
  email:            string;
  name:             string;
  verificationLink: string;
  language:         'ru' | 'ro';
}) {
  if (!isEmailConfigured() || !EMAILJS.tplWelcome) return;
  init();
  try {
    await emailjs.send(EMAILJS.serviceId, EMAILJS.tplWelcome, {
      to_email:          params.email,
      to_name:           params.name,
      verification_link: params.verificationLink,
      site_url:          window.location.origin,
    });
  } catch (err) {
    console.warn('[EmailJS] Welcome email failed:', err);
  }
}

// ─── 2. Админу — уведомление о новой заявке ──────────────────────────────────
export async function sendAdminOrderNotification(data: OrderEmailData) {
  if (!isEmailConfigured() || !EMAILJS.tplAdmin) return;
  init();
  try {
    await emailjs.send(EMAILJS.serviceId, EMAILJS.tplAdmin, {
      to_email:         EMAILJS.adminEmail,
      order_id:         data.orderId.slice(0, 8).toUpperCase(),
      order_date:       fmtDate(),
      client_name:      data.clientName,
      client_email:     data.clientEmail,
      client_phone:     data.clientPhone     || '—',
      client_company:   data.clientCompany   || '—',
      delivery_address: data.deliveryAddress || '—',
      notes:            data.notes           || '—',
      total_items:      data.totalItems,
      total_price:      data.totalPrice.toLocaleString('ru-RU'),
      items_list:       fmtItems(data.items),
      admin_url:        `${window.location.origin}/admin/requests`,
    });
  } catch (err) {
    console.warn('[EmailJS] Admin order notification failed:', err);
  }
}

// Заглушка для обратной совместимости (больше не используется)
export async function sendOrderConfirmation(_data: OrderEmailData) { return; }
