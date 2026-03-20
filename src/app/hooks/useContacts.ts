import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CONTACTS } from '../../lib/contacts';

export type ContactsData = typeof CONTACTS;

// Фолбек — значения из contacts.ts
const FALLBACK: ContactsData = { ...CONTACTS };

let cache: ContactsData | null = null;
const listeners: Set<(data: ContactsData) => void> = new Set();

async function fetchContacts(): Promise<ContactsData> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value');

  if (error || !data || data.length === 0) return FALLBACK;

  const obj = Object.fromEntries(data.map(r => [r.key, r.value]));
  return { ...FALLBACK, ...obj } as ContactsData;
}

// Глобальная загрузка — один запрос на всё приложение
let loadingPromise: Promise<void> | null = null;

function loadOnce() {
  if (cache) return;
  if (loadingPromise) return;
  loadingPromise = fetchContacts().then(data => {
    cache = data;
    listeners.forEach(fn => fn(data));
  });
}

export function useContacts(): ContactsData {
  const [contacts, setContacts] = useState<ContactsData>(cache ?? FALLBACK);

  useEffect(() => {
    if (cache) {
      setContacts(cache);
      return;
    }
    const handler = (data: ContactsData) => setContacts(data);
    listeners.add(handler);
    loadOnce();
    return () => { listeners.delete(handler); };
  }, []);

  return contacts;
}

// Для AdminContacts — сохранить и сбросить кеш
export async function saveContacts(data: Partial<ContactsData>): Promise<void> {
  const entries = Object.entries(data).map(([key, value]) => ({ key, value: value as string }));
  await supabase.from('site_settings').upsert(entries, { onConflict: 'key' });
  // сбрасываем кеш чтобы следующий useContacts() перечитал
  cache = null;
  loadingPromise = null;
}