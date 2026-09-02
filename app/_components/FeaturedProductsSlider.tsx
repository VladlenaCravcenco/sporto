'use client';

import { useCallback, useEffect, useRef } from 'react';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Package, Tag } from 'lucide-react';
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

export function FeaturedProductsSlider({ products, language }: { products: FeaturedProduct[]; language: Language }) {
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
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-xl text-gray-900">{language === 'ro' ? 'Produse Recomandate' : 'Рекомендуемые Продукты'}</h2>
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
          {products.map(product => {
            const name = language === 'ru' ? product.name_ru || product.name_ro : product.name_ro;
            const onSale = product.sale_price !== null && product.sale_price > 0 && product.sale_price < product.price;
            const currentPrice = onSale ? product.sale_price as number : product.price;
            const inStock = (product.qty ?? 0) > 0;

            return (
              <a key={product.id} data-product-card href={productPath(product, language)} className="group flex-none w-[78vw] sm:w-[300px] lg:w-[calc((100%_-_36px)_/_4)] snap-start bg-white border border-gray-100 overflow-hidden hover:border-black transition-colors flex flex-col">
                <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center relative overflow-hidden">
                  {product.image_url ? <img src={product.image_url} alt={name} className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105" /> : <Package className="w-7 h-7 text-gray-200" />}
                  <span className={`absolute top-2 left-2 inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 ${inStock ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <span className={`w-1 h-1 rounded-full ${inStock ? 'bg-white' : 'bg-gray-400'}`} />{inStock ? (language === 'ro' ? 'Disponibil' : 'В наличии') : (language === 'ro' ? 'La comandă' : 'Под заказ')}
                  </span>
                  {onSale && <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-red-600 text-white"><Tag className="w-2.5 h-2.5" />{language === 'ro' ? 'Promoție' : 'Акция'}</span>}
                  <ArrowUpRight className="absolute top-2 right-2 w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-3 flex flex-col flex-1 gap-2">
                  {product.brand && <span className="self-start text-[9px] uppercase tracking-[0.15em] text-gray-400 border border-gray-100 px-1.5 py-0.5">{product.brand}</span>}
                  <h3 className="text-xs text-gray-900 leading-snug line-clamp-2 min-h-8">{name}</h3>
                  <span className="text-[10px] font-mono tracking-wider text-gray-400">{product.sku || `ART-${product.id}`}</span>
                  <div className="border-t border-gray-50 mt-auto pt-2">
                    {onSale ? (
                      <div><span className="text-xs text-gray-400 line-through">{product.price.toLocaleString()} MDL</span><div><span className="text-base text-red-600 font-medium">{currentPrice.toLocaleString()}</span><span className="text-[10px] text-red-500 ml-1">MDL</span></div></div>
                    ) : (
                      <div><span className="text-sm text-gray-900">{currentPrice.toLocaleString()}</span><span className="text-[10px] text-gray-400 ml-1">MDL</span></div>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
