import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CONTACTS } from '../../lib/contacts';

// ── Social types ──────────────────────────────────────────────────────────────
export type SocialType =
  | 'instagram' | 'facebook' | 'tiktok' | 'youtube'
  | 'linkedin'  | 'telegram' | 'whatsapp' | 'viber';

export interface SocialEntry {
  id: string;
  type: SocialType;
  url: string;
}

export const SOCIAL_CONFIG: Record<SocialType, { label: string; color: string; hoverClass: string }> = {
  instagram: { label: 'Instagram', color: '#E1306C', hoverClass: 'hover:text-pink-400'   },
  facebook:  { label: 'Facebook',  color: '#1877F2', hoverClass: 'hover:text-blue-400'   },
  tiktok:    { label: 'TikTok',    color: '#111111', hoverClass: 'hover:text-white'       },
  youtube:   { label: 'YouTube',   color: '#FF0000', hoverClass: 'hover:text-red-400'     },
  linkedin:  { label: 'LinkedIn',  color: '#0A66C2', hoverClass: 'hover:text-blue-300'   },
  telegram:  { label: 'Telegram',  color: '#29A8EB', hoverClass: 'hover:text-sky-400'    },
  whatsapp:  { label: 'WhatsApp',  color: '#25D366', hoverClass: 'hover:text-green-400'  },
  viber:     { label: 'Viber',     color: '#7360F2', hoverClass: 'hover:text-purple-400' },
};

export const SOCIAL_ICON_IMAGE_SRC: Partial<Record<SocialType, string>> = {
  viber: 'https://cdn.simpleicons.org/viber/white',
};

// SVG path data for each social (fill-current)
export const SOCIAL_SVG_PATHS: Record<SocialType, string> = {
  whatsapp:
    'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.116.555 4.104 1.523 5.826L.044 23.428a.5.5 0 0 0 .612.612l5.602-1.479A11.946 11.946 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.868 9.868 0 0 1-5.034-1.376l-.36-.214-3.733.985.999-3.642-.235-.374A9.869 9.869 0 0 1 2.118 12C2.118 6.533 6.533 2.118 12 2.118c5.467 0 9.882 4.415 9.882 9.882 0 5.467-4.415 9.882-9.882 9.882z',
  telegram:
    'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.5l-2.95-.924c-.64-.203-.654-.64.135-.954l11.566-4.458c.537-.194 1.006.131.973.057z',
  viber:
    'M11.4 0C6.143.04 2.76 2.018 2.76 2.018 0 4.246 0 8.553 0 8.553l-.001.614c-.018 3.45.172 6.753 2.467 8.868 0 0 .265.24.533.416v2.75c0 .025-.003.05-.003.075 0 .424.348.768.776.768.213 0 .404-.083.548-.218l2.31-2.145c.52.07 1.055.11 1.612.122l.155.003c.172 0 .343-.004.514-.01l-.033.002c5.174-.195 10.013-2.888 10.013-2.888C21.168 16.77 24 11.643 24 7.163v-.11C24 1.753 19.188.175 15.3.05A21.01 21.01 0 0 0 11.4 0zm.09 2.32c.947-.006 1.985.085 3.06.32 0 0 4.762 1.094 4.762 4.532 0 3.44-2.14 8.15-6.378 9.942 0 0-4.158 2.2-8.12 2.384l-2.56 2.383V18.89c-.226-.14-.422-.302-.422-.302-1.753-1.623-1.82-4.485-1.804-7.572l.001-.567c0-3.439 2.263-5.222 4.03-5.915C5.76 4.034 8.25 2.35 11.49 2.32z',
  instagram:
    'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z',
  facebook:
    'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  tiktok:
    'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  youtube:
    'M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z',
  linkedin:
    'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
};

// ── ContactsData type ─────────────────────────────────────────────────────────
export interface ContactsData {
  phone: string;
  phoneDisplay: string;
  phone_2?: string;
  email: string;
  address_ro: string;
  address_ru: string;
  hours_ro: string;
  hours_ru: string;
  legal_name: string;
  legal_idno: string;
  mapsDirectionsUrl: string;
  mapsEmbedUrl: string;
  viber: string;
  telegram: string;
  whatsapp: string;
  socials: SocialEntry[];
}

// Default socials from hardcoded CONTACTS
const DEFAULT_SOCIALS: SocialEntry[] = [
  { id: 'tg', type: 'telegram', url: CONTACTS.telegram },
  { id: 'wa', type: 'whatsapp', url: CONTACTS.whatsapp },
  { id: 'vb', type: 'viber',    url: CONTACTS.viber    },
];

const FALLBACK: ContactsData = {
  ...CONTACTS,
  phone_2: '',
  socials: DEFAULT_SOCIALS,
};

// ── Fetch ────────────────────────────────────────────────────────────────────
async function fetchContacts(): Promise<ContactsData> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value');

  if (error || !data || data.length === 0) return { ...FALLBACK };

  const obj = Object.fromEntries(data.map(r => [r.key, r.value]));

  let socials: SocialEntry[] = DEFAULT_SOCIALS;
  if (obj.socials) {
    try { socials = JSON.parse(obj.socials); } catch {}
  }

  if (!obj.socials) {
    socials = [
      { id: 'tg', type: 'telegram' as const, url: obj.telegram || CONTACTS.telegram },
      { id: 'wa', type: 'whatsapp' as const, url: obj.whatsapp || CONTACTS.whatsapp },
      { id: 'vb', type: 'viber' as const, url: obj.viber || CONTACTS.viber },
    ].filter(entry => entry.url);
  }

  // phoneDisplay fallback
  if (!obj.phoneDisplay && obj.phone) obj.phoneDisplay = obj.phone;

  return {
    ...FALLBACK,
    ...obj,
    telegram: obj.telegram || socials.find(s => s.type === 'telegram')?.url || FALLBACK.telegram,
    whatsapp: obj.whatsapp || socials.find(s => s.type === 'whatsapp')?.url || FALLBACK.whatsapp,
    viber: obj.viber || socials.find(s => s.type === 'viber')?.url || FALLBACK.viber,
    socials,
  } as ContactsData;
}

// ── Global singleton cache ───────────────────────────────────────────────────
let cache: ContactsData | null = null;
const listeners: Set<(data: ContactsData) => void> = new Set();
let loadingPromise: Promise<void> | null = null;

function loadOnce() {
  if (cache || loadingPromise) return;
  loadingPromise = fetchContacts().then(data => {
    cache = data;
    listeners.forEach(fn => fn(data));
  });
}

export function useContacts(): ContactsData {
  const [contacts, setContacts] = useState<ContactsData>(cache ?? FALLBACK);

  useEffect(() => {
    if (cache) { setContacts(cache); return; }
    const handler = (data: ContactsData) => setContacts(data);
    listeners.add(handler);
    loadOnce();
    return () => { listeners.delete(handler); };
  }, []);

  return contacts;
}

// ── Save (called by AdminContacts) ───────────────────────────────────────────
export async function saveContacts(data: Record<string, string>): Promise<void> {
  const entries = Object.entries(data).map(([key, value]) => ({ key, value }));
  await supabase.from('site_settings').upsert(entries, { onConflict: 'key' });
  // Reset cache and re-fetch, then notify ALL mounted components in real time
  cache = null;
  loadingPromise = null;
  const fresh = await fetchContacts();
  cache = fresh;
  loadingPromise = Promise.resolve(); // Mark as loaded
  listeners.forEach(fn => fn(fresh));
}
