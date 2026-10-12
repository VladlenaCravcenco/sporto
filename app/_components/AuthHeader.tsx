'use client';

import { useSearchParams } from 'next/navigation';
import { PageBreadcrumbs } from './PageBreadcrumbs';
import { HeaderPreview } from './HeaderPreview';
import type { CatalogNavigationCategory } from '../_lib/catalog-data';
import type { FooterData } from '../_lib/footer-data';

export function AuthHeader({ categories, contacts }: {
  categories: CatalogNavigationCategory[]; contacts: FooterData;
}) {
  const search = useSearchParams();
  return <><HeaderPreview language={search.get('lang') === 'ru' ? 'ru' : 'ro'} categories={categories} contacts={contacts} /><PageBreadcrumbs categories={categories} /></>;
}
