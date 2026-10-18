#!/usr/bin/env node
// Read-only configuration check. Never print credentials or contact addresses.
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const env = process.env;
const present = value => typeof value === 'string' && value.trim() !== '' && !['...', 'YOUR_KEY', 'REPLACE_ME'].includes(value.trim());
const required = {
  SUPABASE_SERVER_KEY: present(env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY),
  SUPABASE_URL: present(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL),
};
const email = {
  service: present(env.EMAILJS_SERVICE_ID || env.VITE_EMAILJS_SERVICE_ID),
  publicKey: present(env.EMAILJS_PUBLIC_KEY || env.VITE_EMAILJS_PUBLIC_KEY),
  customerTemplate: present(env.EMAILJS_TEMPLATE_ORDER_CONFIRMATION),
  adminTemplate: present(env.EMAILJS_TEMPLATE_ADMIN || env.VITE_EMAILJS_TEMPLATE_ADMIN),
  adminRecipient: present(env.ORDER_ADMIN_EMAIL || env.VITE_ADMIN_EMAIL),
};
let publicKeyUsedAsServerKey = false;
if (required.SUPABASE_SERVER_KEY) {
  const key = (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY).trim();
  publicKeyUsedAsServerKey = key.startsWith('sb_publishable_');
  if (key.split('.').length === 3) {
    try { publicKeyUsedAsServerKey ||= JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon'; }
    catch { /* Authentication must still be confirmed with the actual server. */ }
  }
}
const ready = Object.values(required).every(Boolean) && !publicKeyUsedAsServerKey;
const resend = { apiKey: present(env.RESEND_API_KEY), sender: present(env.ORDER_EMAIL_FROM), adminRecipient: email.adminRecipient };
const provider = env.ORDER_EMAIL_PROVIDER || 'emailjs';
const emailReady = provider === 'resend' ? Object.values(resend).every(Boolean) : provider === 'emailjs' && Object.values(email).every(Boolean);
console.log(JSON.stringify({ orderStorageConfigured: ready, required, publicKeyUsedAsServerKey, emailConfigured: emailReady, emailProvider: ['resend','emailjs'].includes(provider) ? provider : 'unsupported', email, resend }, null, 2));
if (!ready) {
  console.error('Order submission is not configured. Set the server-only SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY) and Supabase URL; do not put the secret in NEXT_PUBLIC_/VITE_ variables.');
  process.exitCode = 1;
} else if (!emailReady) {
  console.error('Order storage is configured, but customer/admin email configuration is incomplete. Requests may be saved without email notifications.');
}
if (process.argv.includes('--require-email') && !emailReady) process.exitCode = 1;
