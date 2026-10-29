'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { addToHistory } from '../../src/lib/search-history';

const SearchPanel = lazy(() => import('./SearchPanel'));

export function SmartSearch({ language, mobile = false }: { language: 'ro' | 'ru'; mobile?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get('search') || '';
  useEffect(() => { setQuery(currentSearch); }, [currentSearch]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  const placeholder = language === 'ru' ? 'Поиск товаров, категорий...' : 'Caută produse, categorii...';
  return <div ref={root} className={mobile ? 'relative md:hidden' : 'relative hidden md:block flex-1 max-w-2xl'} onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <form action={'/' + language + '/catalog'} method="get" onSubmit={event => { event.preventDefault(); if (query.trim()) addToHistory(query.trim()); setOpen(false); router.push('/' + language + '/catalog?' + new URLSearchParams({ search: query.trim() })); }} className="relative">
      <input maxLength={160} name="search" aria-label={placeholder} autoComplete="off" value={query} onFocus={() => setOpen(true)} onChange={e => { setQuery(e.target.value); setOpen(true); }} placeholder={placeholder} className="w-full h-9 pl-4 pr-12 text-base border border-gray-200 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-black" />
      <button type="submit" aria-label={language === 'ru' ? 'Найти' : 'Caută'} className="absolute right-0 top-0 h-9 w-10 flex items-center justify-center text-gray-500 border-l border-gray-200"><Search className="h-4 w-4" /></button>
    </form>
    {open && <Suspense fallback={<div role="status" className="absolute z-50 top-full w-full bg-white border p-4 text-sm">{language === 'ru' ? 'Загрузка поиска…' : 'Se încarcă căutarea…'}</div>}>
      <SearchPanel language={language} query={query} onQueryChange={setQuery} onSelect={() => setOpen(false)} />
    </Suspense>}
  </div>;
}
