import { supabase } from './supabase';
import { categories as staticCategories, type Category } from '../app/data/products';

type CategoryWithActive = Category & { active?: boolean };
const fallback: CategoryWithActive[] = staticCategories.map(category => ({ ...category, active: true }));
let snapshot = fallback;
const listeners = new Set<() => void>();
let channel: ReturnType<typeof supabase.channel> | undefined;
let generation = 0;
let pending: Promise<void> | undefined;

export const getCategoriesSnapshot = () => snapshot;
export const getCategoriesServerSnapshot = () => fallback;

async function loadCategories() {
    const { data: catData, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !catData?.length) return; // keep static fallback

    const { data: subData } = await supabase
      .from('subcategories')
      .select('*')
      .order('sort_order', { ascending: true });

    const subs = (subData || []) as {
      category_slug: string; slug: string; name_ro: string; name_ru: string;
    }[];

    const mapped: CategoryWithActive[] = (catData as {
      slug: string; active?: boolean; name_ro: string; name_ru: string;
      description_ro: string | null; description_ru: string | null;
      icon?: string | null;
    }[]).map(cat => ({
      id: cat.slug,
      active: cat.active !== false,
      icon: cat.icon ?? undefined,
      name: { ro: cat.name_ro, ru: cat.name_ru },
      description: {
        ro: cat.description_ro || '',
        ru: cat.description_ru || '',
      },
      subcategories: subs
        .filter(s => s.category_slug === cat.slug)
        .map(s => ({ id: s.slug, name: { ro: s.name_ro, ru: s.name_ru } })),
    }));

    snapshot = mapped;
    listeners.forEach(notify => notify());
}

export function refetchCategories(): Promise<void> {
  if (!pending) {
    pending = loadCategories().catch(() => {
      // Retain the last successful snapshot if the network is unavailable.
    }).finally(() => { pending = undefined; });
  }
  return pending;
}

export function subscribeCategories(notify: () => void) {
  // Each consumer owns its listener, but all consumers share one channel.
  const listener = () => notify();
  listeners.add(listener);
  if (listeners.size === 1) {
    void refetchCategories();
    // A previous channel can still be closing during an immediate remount.
    channel = supabase.channel(`categories-realtime-${++generation}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, refetchCategories)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, refetchCategories)
      .subscribe();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && channel) {
      const previous = channel;
      channel = undefined;
      void supabase.removeChannel(previous).catch(() => {});
    }
  };
}
