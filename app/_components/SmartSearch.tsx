'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Router, createPath, type To } from 'react-router';
import { Search } from 'lucide-react';
import { SearchDropdown } from '../../src/app/components/SearchDropdown';
import { LanguageProvider } from '../../src/app/contexts/LanguageContext';
import { CategoriesProvider } from '../../src/app/contexts/CategoriesContext';
import { CartProvider } from '../../src/app/contexts/CartContext';
import { addToHistory } from '../../src/lib/searchEngine';

export function SmartSearch({ language, mobile = false }: { language: 'ro' | 'ru'; mobile?: boolean }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const navigator = useMemo(() => {
    const href = (to: To) => {
      const path = typeof to === 'string' ? to : createPath(to);
      return /^\/(ro|ru)(\/|$)/.test(path) ? path : '/' + language + (path.startsWith('/') ? '' : '/') + path;
    };
    return { createHref: href, go: (n: number) => window.history.go(n), push: (to: To) => window.location.assign(href(to)), replace: (to: To) => window.location.replace(href(to)) };
  }, [language]);
  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get('search') || '');
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  const placeholder = language === 'ru' ? 'Поиск товаров, категорий...' : 'Caută produse, categorii...';
  return <div ref={root} className={mobile ? 'relative md:hidden' : 'relative hidden md:block flex-1 max-w-2xl'} onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <form action={'/' + language + '/catalog'} method="get" onSubmit={() => { if (query.trim()) addToHistory(query.trim()); setOpen(false); }} className="relative">
      <input name="search" aria-label={placeholder} aria-expanded={open} autoComplete="off" value={query} onFocus={() => setOpen(true)} onChange={e => { setQuery(e.target.value); setOpen(true); }} placeholder={placeholder} className="w-full h-9 pl-4 pr-12 text-base border border-gray-200 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-black" />
      <button type="submit" aria-label={language === 'ru' ? 'Найти' : 'Caută'} className="absolute right-0 top-0 h-9 w-10 flex items-center justify-center text-gray-500 border-l border-gray-200"><Search className="h-4 w-4" /></button>
    </form>
    {open && <LanguageProvider initialLanguage={language}><CartProvider><CategoriesProvider>
      <Router location="/" navigator={navigator}>
        <SearchDropdown query={query} onQueryChange={setQuery} onSelect={() => setOpen(false)} />
      </Router>
    </CategoriesProvider></CartProvider></LanguageProvider>}
  </div>;
}
