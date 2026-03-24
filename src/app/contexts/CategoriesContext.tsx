import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import { categories as staticCategories, type Category } from '../data/products';

interface CategoriesContextValue {
  categories: Category[];
  refetchCategories: () => void;
}

const CategoriesContext = createContext<CategoriesContextValue>({
  categories: staticCategories,
  refetchCategories: () => {},
});

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(staticCategories);

  const fetchCategories = useCallback(async () => {
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

    const mapped: Category[] = (catData as {
      slug: string; name_ro: string; name_ru: string;
      description_ro: string | null; description_ru: string | null;
    }[]).map(cat => ({
      id: cat.slug,
      name: { ro: cat.name_ro, ru: cat.name_ru },
      description: {
        ro: cat.description_ro || '',
        ru: cat.description_ru || '',
      },
      subcategories: subs
        .filter(s => s.category_slug === cat.slug)
        .map(s => ({ id: s.slug, name: { ro: s.name_ro, ru: s.name_ru } })),
    }));

    setCategories(mapped);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const channel = supabase
      .channel('categories-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchCategories)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, fetchCategories)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCategories]);

  return (
    <CategoriesContext.Provider value={{ categories, refetchCategories: fetchCategories }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories(): Category[] {
  return useContext(CategoriesContext).categories;
}

export function useCategoriesContext() {
  return useContext(CategoriesContext);
}
