import { supabase } from '../../lib/supabase';

const PAGE = 'site:popup';
const KEY = 'data';

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

export const DEFAULT_POPUP: PopupData = {
  active: false,
  title_ro: 'Echipament sportiv\nla cel mai bun preț',
  title_ru: 'Спортивное оборудование\nпо лучшей цене',
  body_ro: 'Catalog de peste 8 000 de produse din Italia și UE. Prețuri angro pentru cluburi, școli și instituții.',
  body_ru: 'Каталог более 8 000 товаров из Италии и ЕС. Оптовые цены для клубов, школ и учреждений.',
  cta_label_ro: 'Vezi Catalogul',
  cta_label_ru: 'Смотреть каталог',
  cta_url: '/catalog',
  show_once: true,
  delay_seconds: 5,
};

function parsePopupConfig(value: unknown): PopupData | null {
  if (typeof value !== 'string') return null;

  try {
    const parsed = JSON.parse(value) as Partial<PopupData>;
    if (!parsed || typeof parsed.active !== 'boolean') return null;
    return { ...DEFAULT_POPUP, ...parsed };
  } catch {
    return null;
  }
}

export async function loadPopupConfig(): Promise<PopupData | null> {
  const { data, error } = await supabase
    .from('page_content')
    .select('value')
    .eq('page', PAGE)
    .eq('key', KEY)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return parsePopupConfig(data?.value);
}

export async function savePopupConfig(config: PopupData): Promise<void> {
  const { error } = await supabase.from('page_content').upsert(
    { page: PAGE, key: KEY, value: JSON.stringify(config) },
    { onConflict: 'page,key' },
  );

  if (error) throw new Error(error.message);
}

export function subscribeToPopupConfig(onChange: (config: PopupData | null) => void) {
  const channel = supabase
    .channel('site-popup-config')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'page_content', filter: `page=eq.${PAGE}` },
      async () => {
        try {
          onChange(await loadPopupConfig());
        } catch {
          onChange(null);
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
