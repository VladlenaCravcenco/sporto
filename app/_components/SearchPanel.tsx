'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Router, createPath, type To } from 'react-router';
import { SearchDropdown } from '../../src/app/components/SearchDropdown';
import { LanguageProvider } from '../../src/app/contexts/LanguageContext';
import { CategoriesProvider } from '../../src/app/contexts/CategoriesContext';
import { CartProvider } from '../../src/app/contexts/CartContext';

export default function SearchPanel({ language, query, onQueryChange, onSelect }: {
  language: 'ro' | 'ru'; query: string; onQueryChange: (query: string) => void; onSelect: () => void;
}) {
  const router = useRouter();
  const navigator = useMemo(() => {
    const href = (to: To) => {
      const path = typeof to === 'string' ? to : createPath(to);
      return /^\/(ro|ru)(\/|$)/.test(path) ? path : '/' + language + (path.startsWith('/') ? '' : '/') + path;
    };
    return { createHref: href, go: (n: number) => window.history.go(n), push: (to: To) => router.push(href(to)), replace: (to: To) => router.replace(href(to)) };
  }, [language, router]);
  return <LanguageProvider initialLanguage={language}><CartProvider><CategoriesProvider>
    <Router location="/" navigator={navigator}>
      <SearchDropdown remote query={query} onQueryChange={onQueryChange} onSelect={onSelect} />
    </Router>
  </CategoriesProvider></CartProvider></LanguageProvider>;
}
