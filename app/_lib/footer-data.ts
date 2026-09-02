import { createClient } from '@supabase/supabase-js';
import { CONTACTS } from '../../src/lib/contacts';

export type SocialType =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'telegram'
  | 'whatsapp'
  | 'viber';

export interface FooterSocial {
  id: string;
  type: SocialType;
  url: string;
}

export interface FooterData {
  phone: string;
  phoneDisplay: string;
  email: string;
  address_ro: string;
  address_ru: string;
  hours_ro: string;
  hours_ru: string;
  mapsDirectionsUrl: string;
  telegram: string;
  whatsapp: string;
  viber: string;
  socials: FooterSocial[];
}

const defaultSocials: FooterSocial[] = [
  { id: 'telegram', type: 'telegram', url: CONTACTS.telegram },
  { id: 'whatsapp', type: 'whatsapp', url: CONTACTS.whatsapp },
  { id: 'viber', type: 'viber', url: CONTACTS.viber },
];

const fallback: FooterData = {
  phone: CONTACTS.phone,
  phoneDisplay: CONTACTS.phoneDisplay,
  email: CONTACTS.email,
  address_ro: CONTACTS.address_ro,
  address_ru: CONTACTS.address_ru,
  hours_ro: CONTACTS.hours_ro,
  hours_ru: CONTACTS.hours_ru,
  mapsDirectionsUrl: CONTACTS.mapsDirectionsUrl,
  telegram: CONTACTS.telegram,
  whatsapp: CONTACTS.whatsapp,
  viber: CONTACTS.viber,
  socials: defaultSocials,
};

const supportedSocials = new Set<SocialType>([
  'instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'telegram', 'whatsapp', 'viber',
]);

export async function getFooterData(): Promise<FooterData> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return fallback;

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.from('site_settings').select('key,value');
  if (error || !data?.length) return fallback;

  const settings = Object.fromEntries(data.map(row => [row.key, row.value ?? ''])) as Record<string, string>;
  let socials = defaultSocials;

  if (settings.socials) {
    try {
      const parsed = JSON.parse(settings.socials) as Array<Partial<FooterSocial>>;
      socials = parsed
        .filter((social): social is FooterSocial => Boolean(
          social.id && social.type && supportedSocials.has(social.type) && social.url,
        ))
        .map(social => ({ id: String(social.id), type: social.type, url: social.url }));
    } catch {
      socials = defaultSocials;
    }
  }

  return {
    phone: settings.phone || fallback.phone,
    phoneDisplay: settings.phoneDisplay || settings.phone || fallback.phoneDisplay,
    email: settings.email || fallback.email,
    address_ro: settings.address_ro || fallback.address_ro,
    address_ru: settings.address_ru || fallback.address_ru,
    hours_ro: settings.hours_ro || fallback.hours_ro,
    hours_ru: settings.hours_ru || fallback.hours_ru,
    mapsDirectionsUrl: settings.mapsDirectionsUrl || fallback.mapsDirectionsUrl,
    telegram: settings.telegram || socials.find(social => social.type === 'telegram')?.url || fallback.telegram,
    whatsapp: settings.whatsapp || socials.find(social => social.type === 'whatsapp')?.url || fallback.whatsapp,
    viber: settings.viber || socials.find(social => social.type === 'viber')?.url || fallback.viber,
    socials: socials.filter(social => social.url),
  };
}
