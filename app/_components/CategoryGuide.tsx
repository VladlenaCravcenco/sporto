import type { CategoryGuide as Guide } from '../_lib/category-guides';
import type { CatalogNavigationCategory } from '../_lib/catalog-data';
import { CatalogLink } from './CatalogLink';
export function CategoryGuide({ guide, category, language }: { guide: Guide; category: CatalogNavigationCategory; language: 'ro' | 'ru' }) {
  return <section aria-labelledby="category-guide-heading" className="mt-8 border-t border-gray-200">
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm text-gray-700 hover:text-black [&::-webkit-details-marker]:hidden">
        <h2 id="category-guide-heading" className="font-medium">{language === 'ru' ? 'Как выбрать' : 'Cum alegeți'}</h2>
        <span aria-hidden="true" className="text-lg leading-none group-open:rotate-45">+</span>
      </summary>
      <div className="pb-5">
        <p className="text-sm font-medium text-gray-900">{guide.heading}</p>
    <div className="mt-5 grid gap-5 xl:grid-cols-3">
      {guide.points.map(point => <div key={point.title}><h3 className="text-base font-medium text-gray-900">{point.title}</h3><p className="mt-2 text-sm leading-6 text-gray-600">{point.text}</p></div>)}
    </div>
    <nav aria-label={language === 'ru' ? 'Связанные разделы' : 'Categorii conexe'} className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm">
      {category.subcategories.slice(0, 6).map(child => <CatalogLink key={child.id} className="underline underline-offset-4 text-gray-700 hover:text-black" href={`/${language}/catalog?${new URLSearchParams({category:category.id,subcategory:child.id})}`}>{child.name[language]}</CatalogLink>)}
      <CatalogLink href={`/${language}/delivery-terms`} className="underline underline-offset-4 text-gray-700">{language === 'ru' ? 'Условия доставки' : 'Condiții de livrare'}</CatalogLink>
      <CatalogLink href={`/${language}/contacts`} className="underline underline-offset-4 text-gray-700">{language === 'ru' ? 'Помощь с выбором' : 'Ajutor la alegere'}</CatalogLink>
    </nav>
      </div>
    </details>
  </section>;
}
