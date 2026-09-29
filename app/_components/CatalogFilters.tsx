'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { CatalogSortControl } from './CatalogSortControl';
import { useRouter } from 'next/navigation';
import * as Slider from '@radix-ui/react-slider';
import { Minus, Plus, SlidersHorizontal } from 'lucide-react';
import { valuesOf, type CatalogFacets, type CatalogQuery, type FilterGroup } from '../_lib/catalog-filters';

function Options({ group, query, language }: { group: FilterGroup; query: CatalogQuery; language: 'ro' | 'ru' }) {
  const [expanded, setExpanded] = useState(false);
  const selected = valuesOf(query, group.key);
  return <details open className="group/filter border-t border-gray-200 p-5">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-semibold text-gray-950 [&::-webkit-details-marker]:hidden">
      {group.label}<Minus className="hidden h-4 w-4 group-open/filter:block" /><Plus className="h-4 w-4 group-open/filter:hidden" />
    </summary>
    <div className="mt-4 space-y-3">
      {group.options.map((option, index) => <label key={option.value} className={`${!expanded && index >= 6 && !selected.includes(option.value) ? 'hidden' : 'flex'} items-start gap-3 text-sm ${option.count === 0 && !selected.includes(option.value) ? 'text-gray-400' : 'text-gray-800'}`}>
        <input type="checkbox" name={group.key} value={option.value} defaultChecked={selected.includes(option.value)} disabled={option.count === 0 && !selected.includes(option.value)} className="mt-0.5 h-4 w-4 shrink-0 accent-red-600" />
        <span className="min-w-0">{option.label} <span className="text-gray-400">({option.count})</span></span>
      </label>)}
      {group.options.length > 6 && <button type="button" onClick={() => setExpanded(!expanded)} className="text-sm text-red-600 underline underline-offset-4">{expanded ? (language === 'ro' ? 'Mai puțin' : 'Свернуть') : (language === 'ro' ? `Vezi toate (${group.options.length})` : `Показать все (${group.options.length})`)}</button>}
    </div>
  </details>;
}

export function CatalogFilters({ facets, query, language }: { facets: CatalogFacets; query: CatalogQuery; language: 'ro' | 'ru' }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [min, setMin] = useState(valuesOf(query, 'minPrice')[0] || '');
  const [max, setMax] = useState(valuesOf(query, 'maxPrice')[0] || '');
  const ro = language === 'ro';
  const lower = Math.min(facets.minPrice, Number(min || facets.minPrice));
  const upper = Math.max(facets.maxPrice, Number(max || facets.maxPrice), lower + 1);
  const minValue = min === '' ? lower : Number(min);
  const maxValue = max === '' ? upper : Number(max);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === 'string' && value.trim()) params.append(key, value.trim());
    }
    setMobileOpen(false);
    startTransition(() => router.push(`/${language}/catalog?${params}`, { scroll: false }));
  }
  return <aside className="min-w-0 self-start rounded-[5px] lg:border lg:border-gray-200 lg:bg-white">
    <div>
      <div className="flex items-center gap-2 lg:hidden">
      <button type="button" aria-expanded={mobileOpen} aria-controls="catalog-filters-panel" onClick={() => setMobileOpen(value => !value)} className="flex h-10 items-center gap-2 rounded-[5px] bg-black px-3 text-sm font-semibold text-white lg:hidden">
        <SlidersHorizontal className="h-4 w-4" />{ro ? 'Filtre' : 'Фильтры'}
        {mobileOpen ? <Minus className="ml-auto h-4 w-4" /> : <Plus className="ml-auto h-4 w-4" />}
      </button>
      <CatalogSortControl query={query} language={language} />
      </div>
      <form id="catalog-filters-panel" onSubmit={submit} className={mobileOpen ? "mt-3 rounded-[5px] border border-gray-200 bg-white lg:mt-0 lg:border-0" : "hidden lg:block"} aria-busy={pending}>
        <fieldset disabled={pending} className="min-w-0">
          <input type="hidden" name="sort" value={valuesOf(query, 'sort')[0] || 'recommended'} />
          <input type="hidden" name="search" value={valuesOf(query, 'search')[0] || ''} />
          <details open className="group/price border-t border-gray-200 p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold [&::-webkit-details-marker]:hidden">{ro ? 'Preț' : 'Цена'} <Minus className="hidden h-4 w-4 group-open/price:block" /><Plus className="h-4 w-4 group-open/price:hidden" /></summary>
            <div className="mt-4 flex items-center gap-2">
              <input aria-label={ro ? 'Preț minim' : 'Минимальная цена'} type="number" min="0" max={max || undefined} step="0.01" name="minPrice" value={min} placeholder={String(facets.minPrice)} onChange={e => setMin(e.target.value)} className="h-10 w-full min-w-0 rounded-[5px] border border-gray-300 px-2 text-sm" />
              <span className="text-gray-400">–</span>
              <input aria-label={ro ? 'Preț maxim' : 'Максимальная цена'} type="number" min={min || '0'} step="0.01" name="maxPrice" value={max} placeholder={String(facets.maxPrice)} onChange={e => setMax(e.target.value)} className="h-10 w-full min-w-0 rounded-[5px] border border-gray-300 px-2 text-sm" />
              <span className="text-xs text-gray-500">MDL</span>
            </div>
            <Slider.Root disabled={pending} min={lower} max={upper} step={0.01}
              value={[Math.min(minValue, maxValue), Math.max(minValue, maxValue)]}
              onValueChange={([nextMin, nextMax]) => { setMin(String(nextMin)); setMax(String(nextMax)); }}
              className="relative mt-5 flex h-6 w-full touch-none select-none items-center">
              <Slider.Track className="relative h-1.5 grow rounded-full bg-gray-200">
                <Slider.Range className="absolute h-full rounded-full bg-red-600" />
              </Slider.Track>
              <Slider.Thumb aria-label={ro ? 'Preț minim' : 'Минимальная цена'} className="block h-5 w-5 rounded-full border-2 border-white bg-red-600 shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600" />
              <Slider.Thumb aria-label={ro ? 'Preț maxim' : 'Максимальная цена'} className="block h-5 w-5 rounded-full border-2 border-white bg-red-600 shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600" />
            </Slider.Root>
          </details>
          {facets.groups.map(group => <Options key={group.key} group={group} query={query} language={language} />)}
          <div className="sticky bottom-0 flex flex-col gap-3 border-t border-gray-200 bg-white p-5">
            <button type="submit" className="min-h-11 rounded-[5px] bg-black px-4 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60">{pending ? (ro ? 'Se aplică…' : 'Применяем…') : (ro ? 'Aplică filtrele' : 'Применить фильтры')}</button>
            <a href={`/${language}/catalog`} className="text-center text-sm text-gray-500 hover:text-black">{ro ? 'Resetează filtrele' : 'Сбросить фильтры'}</a>
          </div>
        </fieldset>
      </form>
    </div>
  </aside>;
}
