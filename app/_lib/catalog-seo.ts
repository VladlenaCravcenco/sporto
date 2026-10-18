import { getCategoryGuide } from './category-guides';
import { cache } from 'react';
import { getCatalogNavigationForSeo } from './catalog-data';
import type { CatalogQuery } from './catalog-filters';

/** Only one existing category and its child qualify as a search landing page. */
export const getCategoryLanding = cache(async (query: CatalogQuery, language: 'ro' | 'ru') => {
  const categories = await getCatalogNavigationForSeo();
  const category = typeof query.category === 'string' ? categories.find(item => item.id === query.category) : undefined;
  const child = category && typeof query.subcategory === 'string' ? category.subcategories.find(item => item.id === query.subcategory) : undefined;
  const selected = query.category === undefined ? [] : Array.isArray(query.category) ? query.category : [query.category];
  const children = query.subcategory === undefined ? [] : Array.isArray(query.subcategory) ? query.subcategory : [query.subcategory];
  const invalid = selected.some(id => !categories.some(item => item.id === id))
    || children.some(id => !categories.filter(item => selected.includes(item.id)).some(item => item.subcategories.some(sub => sub.id === id)));
  const landing = category && (query.subcategory === undefined || child) ? { category, child } : null;
  const guide = landing ? getCategoryGuide(category?.id, child?.id, language) : null;
  const name = guide?.name || child?.name[language] || category?.name[language];
  const path = landing ? '/catalog?' + new URLSearchParams({ category: category!.id, ...(child ? { subcategory: child.id } : {}) }) : '/catalog';
  const description = name ? guide?.summary || (child ? '' : category?.description[language]?.trim()) || (language === 'ro'
    ? `${name} în Moldova: descoperă produsele disponibile în catalogul SPORTO, caracteristicile și prețurile. Solicită informații despre comandă și livrare.`
    : `${name} в Молдове: товары из каталога SPORTO, характеристики и цены. Узнайте условия заказа и доставки.`) : '';
  return { categories, landing, invalid: Boolean(invalid), name, path, description, guide };
});

export function hasAdditionalFilters(query: CatalogQuery) {
  return Object.entries(query).some(([key, value]) => !['category', 'subcategory', 'page', 'sort'].includes(key) && value !== undefined);
}
