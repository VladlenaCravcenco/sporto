import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export type PageContentType = 'terms' | 'delivery' | 'privacy';

export interface PageContent {
  title_ro: string;
  title_ru: string;
  content_ro: string;
  content_ru: string;
}

const cache = new Map<PageContentType, PageContent | null>();
const listeners = new Map<PageContentType, Set<(data: PageContent | null) => void>>();
const promises = new Map<PageContentType, Promise<void>>();

function pageKey(type: PageContentType) {
  return `legal:${type}`;
}

export async function loadPageContent(type: PageContentType): Promise<PageContent | null> {
  const { data } = await supabase
    .from('page_content')
    .select('value')
    .eq('page', pageKey(type))
    .eq('key', 'data')
    .maybeSingle();

  if (!data?.value) return null;

  try {
    const parsed = JSON.parse(data.value);
    if (parsed && parsed.content_ro && parsed.content_ru) return parsed as PageContent;
    return null;
  } catch {
    return null;
  }
}

export async function savePageContent(type: PageContentType, data: PageContent): Promise<void> {
  await supabase.from('page_content').upsert(
    { page: pageKey(type), key: 'data', value: JSON.stringify(data) },
    { onConflict: 'page,key' }
  );
}

export function invalidatePageContent(type: PageContentType, data: PageContent) {
  cache.set(type, data);
  listeners.get(type)?.forEach(fn => fn(data));
}

export function usePageContent(type: PageContentType): PageContent | null {
  const [data, setData] = useState<PageContent | null>(cache.get(type) ?? null);

  useEffect(() => {
    if (cache.has(type)) {
      setData(cache.get(type) ?? null);
      return;
    }

    const set = listeners.get(type) ?? new Set<(data: PageContent | null) => void>();
    set.add(setData);
    listeners.set(type, set);

    if (!promises.has(type)) {
      promises.set(
        type,
        loadPageContent(type).then(result => {
          cache.set(type, result);
          listeners.get(type)?.forEach(fn => fn(result));
        })
      );
    }

    return () => { listeners.get(type)?.delete(setData); };
  }, [type]);

  return data;
}
