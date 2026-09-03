import { createClient } from '@supabase/supabase-js';

export const PROMO_POPUP_ENABLED = false;

export interface PopupData {
  active: boolean;
  title_ro: string;
  title_ru: string;
  body_ro: string;
  body_ru: string;
  cta_label_ro: string;
  cta_label_ru: string;
  cta_url: string;
  show_once: boolean;
  delay_seconds: number;
}

const defaultPopup: PopupData = {
  active: false,
  title_ro: 'Echipament sportiv\nla cel mai bun preț',
  title_ru: 'Спортивное оборудование\nпо лучшей цене',
  body_ro: 'Catalog de produse sportive pentru cluburi, școli și instituții.',
  body_ru: 'Каталог спортивных товаров для клубов, школ и учреждений.',
  cta_label_ro: 'Vezi catalogul',
  cta_label_ru: 'Смотреть каталог',
  cta_url: '/catalog',
  show_once: true,
  delay_seconds: 5,
};

function parsePopup(value: unknown): PopupData | null {
  if (typeof value !== 'string') return null;
  try {
    const parsed = JSON.parse(value) as Partial<PopupData>;
    if (typeof parsed.active !== 'boolean') return null;
    return { ...defaultPopup, ...parsed };
  } catch {
    return null;
  }
}

export async function getPopupData(): Promise<PopupData | null> {
  if (!PROMO_POPUP_ENABLED) return null;

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from('page_content')
    .select('value')
    .eq('page', 'site:popup')
    .eq('key', 'data')
    .maybeSingle();

  if (error) return null;
  return parsePopup(data?.value);
}
