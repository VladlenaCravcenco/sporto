import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import { categories as staticCategories, type Category } from '../data/products';

type CategoryWithActive = Category & { active?: boolean };

interface CategoriesContextValue {
  categories: Category[];
  allCategories: CategoryWithActive[];
  refetchCategories: () => void;
}

const CategoriesContext = createContext<CategoriesContextValue>({
  categories: staticCategories,
  allCategories: staticCategories,
  refetchCategories: () => {},
});

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [allCategories, setAllCategories] = useState<CategoryWithActive[]>(
    staticCategories.map((category) => ({ ...category, active: true }))
  );

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

    setAllCategories(mapped);
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
    <CategoriesContext.Provider
      value={{
        categories: allCategories.filter((category) => category.active !== false),
        allCategories,
        refetchCategories: fetchCategories,
      }}
    >
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
