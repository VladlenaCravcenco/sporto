'use client';
import { ArrowDownUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { CatalogQuery } from '../_lib/catalog-filters';

export function CatalogSortControl({ query, language }: { query: CatalogQuery; language: 'ro' | 'ru' }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const ro = language === 'ro';
  return <label className="relative inline-flex h-10 items-center gap-2 rounded-[5px] border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900">
    <ArrowDownUp className="h-4 w-4" />{ro ? 'Sortare' : 'Сортировка'}
    <select aria-label={ro ? 'Sortare' : 'Сортировка'} disabled={pending} value={typeof query.sort === 'string' ? query.sort : 'recommended'}
      className="absolute inset-0 w-full cursor-pointer opacity-0"
      onChange={event => {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(query)) {
          if (key === 'sort' || key === 'page' || value === undefined) continue;
          for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
        }
        if (event.target.value !== 'recommended') params.set('sort', event.target.value);
        startTransition(() => router.push('/' + language + '/catalog?' + params, { scroll: false }));
      }}>
      <option value="recommended">{ro ? 'Recomandate' : 'Рекомендуемые'}</option>
      <option value="price-asc">{ro ? 'Preț crescător' : 'Сначала дешевле'}</option>
      <option value="price-desc">{ro ? 'Preț descrescător' : 'Сначала дороже'}</option>
      <option value="name-asc">{ro ? 'După denumire' : 'По названию'}</option>
    </select>
  </label>;
}
