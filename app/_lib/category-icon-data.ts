import 'server-only';
import type { ReactNode } from 'react';
import { getCategoryIcon } from '../../src/app/lib/category-icons';
import type { CatalogNavigationCategory } from './catalog-data';

/** Render configured icons on the server; do not ship the admin's complete picker. */
export function getCategoryIconData(categories: CatalogNavigationCategory[]): Record<string, ReactNode> {
  return Object.fromEntries(categories.map(category => [category.id, getCategoryIcon(category.icon)]));
}
