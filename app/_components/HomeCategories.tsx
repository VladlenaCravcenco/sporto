import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { getCategoryIcon } from '../../src/app/lib/category-icons';
import type { CatalogNavigationCategory } from '../_lib/catalog-data';

export function HomeCategories({ categories = [], language }: {
  categories?: CatalogNavigationCategory[]; language: 'ro' | 'ru';
}) {
  if (!categories.length) return null;
  return <section className="py-12 md:py-16">
    <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900">{language === 'ro' ? 'Categorii de produse' : 'Категории товаров'}</h2>
        <a href={`/${language}/catalog`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-black">{language === 'ro' ? 'Toate' : 'Все'}<ArrowRight className="h-4 w-4" /></a>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {categories.map((category, index) => <a key={category.id}
          href={`/${language}/catalog?${new URLSearchParams({ category: category.id })}`}
          className={`group flex min-w-0 gap-4 border p-5 transition-colors hover:border-black hover:bg-black hover:text-white ${index === 0 ? 'col-span-2 flex-row items-center border-black bg-black text-white md:p-7' : 'flex-col border-gray-200 bg-white text-gray-900'}`}>
          <div className={`flex ${index === 0 ? 'shrink-0' : 'items-start justify-between'}`}>
            <div className={`flex shrink-0 items-center justify-center transition-colors ${index === 0 ? 'h-12 w-12 bg-white/10 text-white' : 'h-9 w-9 bg-gray-100 text-gray-500 group-hover:bg-white/10 group-hover:text-white'}`}>{getCategoryIcon(category.icon)}</div>
            {index !== 0 && <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-white" aria-hidden="true" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold leading-snug">{category.name[language]}</h3>
            <p className="mt-1 text-xs text-gray-400">{category.subcategories.length} {language === 'ro' ? 'sub.' : 'подкат.'}</p>
          </div>
          {index === 0 && <ArrowUpRight className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-white" aria-hidden="true" />}
        </a>)}
      </div>
    </div>
  </section>;
}
