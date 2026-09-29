'use client';

import { ProductCardView } from '../../src/app/components/ProductCardView';
import { useCallback, useEffect, useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { FeaturedProduct } from '../_lib/home-data';
import type { Language } from './HeaderPreview';

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' si ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '') || 'produs';
}

function productPath(product: FeaturedProduct, language: Language) {
  const name = language === 'ru' ? product.name_ru || product.name_ro : product.name_ro;
  return `/${language}/product/${encodeURIComponent(slugify(name))}/${encodeURIComponent(product.id)}`;
}

export function FeaturedProductsSlider({ products: suppliedProducts, language, title, compact = false }: { products?: FeaturedProduct[] | null; language: Language; title?: string; compact?: boolean }) {
  const products = Array.isArray(suppliedProducts) ? suppliedProducts : [];
  const viewport = useRef<HTMLDivElement>(null);
  const paused = useRef(false);

  const move = useCallback((direction: 1 | -1) => {
    if (!viewport.current) return;
    const card = viewport.current.querySelector<HTMLElement>('[data-product-card]');
    const distance = (card?.offsetWidth ?? 280) + 12;
    const atEnd = viewport.current.scrollLeft + viewport.current.clientWidth >= viewport.current.scrollWidth - 8;
    const atStart = viewport.current.scrollLeft <= 8;

    if (direction === 1 && atEnd) {
      viewport.current.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }
    if (direction === -1 && atStart) {
      viewport.current.scrollTo({ left: viewport.current.scrollWidth, behavior: 'smooth' });
      return;
    }
    viewport.current.scrollBy({ left: direction * distance, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (products.length < 2) return;
    const timer = window.setInterval(() => {
      if (!paused.current) move(1);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [move, products.length]);

  if (products.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-[#f5f6f7]">
      <div className={compact ? "w-full" : "max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8"}>
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-xl text-gray-900">{title || (language === 'ro' ? 'Produse recomandate' : 'Рекомендуемые товары')}</h2>
          <div className="flex items-center gap-2">
            <a href={`/${language}/catalog`} className="hidden sm:flex text-xs text-gray-400 hover:text-black items-center gap-1.5 transition-colors uppercase tracking-wider">
              {language === 'ro' ? 'Toate Produsele' : 'Все Продукты'}<ArrowRight className="w-3.5 h-3.5" />
            </a>
            <button type="button" aria-label="Previous products" onClick={() => move(-1)} className="w-9 h-9 border border-gray-200 flex items-center justify-center text-gray-400 hover:border-black hover:text-black transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <button type="button" aria-label="Next products" onClick={() => move(1)} className="w-9 h-9 border border-gray-200 flex items-center justify-center text-gray-400 hover:border-black hover:text-black transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>

        <div
          ref={viewport}
          className="flex items-start gap-3 overflow-x-auto snap-x snap-mandatory pt-2 pb-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onMouseEnter={() => { paused.current = true; }}
          onMouseLeave={() => { paused.current = false; }}
          onPointerDown={() => { paused.current = true; }}
          onPointerUp={() => { paused.current = false; }}
        >
          {products.map(product => (
            <div key={product.id} data-product-card className="flex-none w-[calc((100%_-_12px)_/_2)] sm:w-[300px] lg:w-[calc((100%_-_36px)_/_4)] snap-start">
              <ProductCardView product={product} language={language} href={productPath(product, language)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
