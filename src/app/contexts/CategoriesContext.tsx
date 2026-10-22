import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import { getCategoriesSnapshot, getCategoriesServerSnapshot, subscribeCategories, refetchCategories } from '../../lib/categories-store';
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
  const allCategories = useSyncExternalStore(
    subscribeCategories, getCategoriesSnapshot, getCategoriesServerSnapshot
  );

  return (
    <CategoriesContext.Provider
      value={{
        categories: allCategories.filter((category) => category.active !== false),
        allCategories,
        refetchCategories,
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
