'use client';

import { observeCarouselVisibility } from './carousel-visibility';
import { CatalogLink } from './CatalogLink';
import { StoreImage } from '../../src/app/components/StoreImage';
import { HomeCategories } from './HomeCategories';
import type { CatalogNavigationCategory } from '../_lib/catalog-data';
import { ServicesBentoView } from '../../src/app/components/ServicesBentoView';
import { HomeBenefits, HomeCallToAction } from './HomeSections';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import type { BannerRow } from '../_lib/home-data';
import type { Language } from './HeaderPreview';
import { PartnersMarqueePreview } from './PartnersMarqueePreview';
import { FeaturedProductsSlider } from './FeaturedProductsSlider';

interface HomeMigrationPreviewProps {
  categories?: CatalogNavigationCategory[];
  categoryIcons?: Record<string, ReactNode>;
  language: Language;
  banners: BannerRow[];
  brands: import('../_lib/home-data').BrandItem[];
  featuredProducts: import('../_lib/home-data').FeaturedProduct[];
  promoCount: string;
  saleProducts: import('../_lib/home-data').FeaturedProduct[];
}

const interval = 5500;

function HeroSlider({ banners, language }: { banners: BannerRow[]; language: Language }) {
  const viewport = useRef<HTMLDivElement>(null);
  const localePath = (path = '') => `/${language}${path}`;
  const [active, setActive] = useState(0);
  const [visited, setVisited] = useState(() => new Set([0]));
  const [animating, setAnimating] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const animationTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (animationTimer.current !== null) window.clearTimeout(animationTimer.current);
  }, []);

  const goTo = useCallback((index: number) => {
    if (animating || index === active || banners.length < 2) return;
    setAnimating(true);
    const target = (index + banners.length) % banners.length;
    setVisited(previous => new Set([...previous, target]));
    setActive(target);
    animationTimer.current = window.setTimeout(() => { animationTimer.current = null; setAnimating(false); }, 600);
  }, [active, animating, banners.length]);

  const next = useCallback(() => goTo(active + 1), [active, goTo]);

  useEffect(() => {
    if (banners.length < 2) return;
    if (!viewport.current) return;
    return observeCarouselVisibility(viewport.current, visible => {
      if (timer.current !== null) clearInterval(timer.current);
      timer.current = visible ? setInterval(next, interval) : null;
    });
  }, [banners.length, next]);

  function navigate(index: number) {
    if (timer.current) clearInterval(timer.current);
    goTo(index);
  }

  function touchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const distance = touchStartX.current - event.changedTouches[0].clientX;
    if (Math.abs(distance) > 40) navigate(active + (distance > 0 ? 1 : -1));
    touchStartX.current = null;
  }

  if (banners.length === 0) {
    return (
      <div className="bg-black text-white p-10 md:p-14 lg:p-16 flex flex-col justify-end min-h-[420px] lg:min-h-[540px]">
        <h2 className="text-3xl md:text-4xl lg:text-[3.25rem] text-white mb-6 leading-tight max-w-xl">
          {language === 'ro' ? 'Partenerul tău pentru echipamente sportive' : 'Ваш партнёр в области спортивного оборудования'}
        </h2>
        <p className="text-sm text-gray-400 mb-10 max-w-sm leading-relaxed">
          {language === 'ro' ? 'Echipamente profesionale pentru afacerea ta.' : 'Профессиональное оборудование для вашего бизнеса.'}
        </p>
        <div className="flex flex-wrap gap-3">
          <CatalogLink href={localePath('/order-request')} className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 text-sm uppercase tracking-wider hover:bg-gray-100 transition-colors">
            {language === 'ro' ? 'Solicită Ofertă' : 'Запросить предложение'}<ArrowRight className="w-4 h-4" />
          </CatalogLink>
          <CatalogLink href={localePath('/catalog')} className="inline-flex items-center gap-2 border border-white/30 text-white/70 px-8 py-3 text-sm uppercase tracking-wider hover:border-white hover:text-white transition-colors">
            {language === 'ro' ? 'Vezi Catalogul' : 'Каталог'}<ArrowRight className="w-4 h-4" />
          </CatalogLink>
        </div>
      </div>
    );
  }

  const banner = banners[active];
  const title = language === 'ro' ? banner.title_ro : banner.title_ru || banner.title_ro;
  const subtitle = language === 'ro' ? banner.subtitle_ro : banner.subtitle_ru || banner.subtitle_ro;
  const ctaText = language === 'ro'
    ? banner.cta_text_ro || 'Solicită Ofertă'
    : banner.cta_text_ru || 'Запросить предложение';
  const ctaLink = banner.cta_link || '/order-request';
  const ctaHref = ctaLink.startsWith('http') ? ctaLink : localePath(ctaLink === '#modal' ? '/order-request' : ctaLink);

  return (
    <div
      ref={viewport}
      className="relative w-full h-full min-h-[420px] lg:min-h-[540px] bg-black overflow-hidden flex flex-col"
      onTouchStart={event => { touchStartX.current = event.touches[0].clientX; }}
      onTouchEnd={touchEnd}
    >
      {banners.map((item, index) => (
        <div key={item.id} className={`absolute inset-0 transition-opacity duration-700 ${index === active ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
          {item.image_url && visited.has(index) && (
            <StoreImage
              variant="hero"
              src={item.image_url}
              alt={language === 'ro' ? item.title_ro || '' : item.title_ru || item.title_ro || ''}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0.35 }}
              loading="eager"
              fetchPriority={index === 0 ? 'high' : 'low'}
            />
          )}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id={`next-grid-${index}`} width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0 L0 0 0 40" fill="none" stroke="#fff" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#next-grid-${index})`} />
          </svg>
        </div>
      ))}

      <div className="relative z-20 flex flex-col justify-between h-full p-10 md:p-14 lg:p-16 flex-1">
        <div />
        <div>
          <h2 key={`title-${active}`} className={`text-3xl md:text-4xl lg:text-[3.25rem] text-white mb-6 leading-tight max-w-xl ${active > 0 ? 'motion-safe:animate-[fadeSlideUp_0.6s_ease_forwards]' : ''}`}>{title}</h2>
          {subtitle && <p key={`subtitle-${active}`} className={`text-sm text-gray-300 mb-10 max-w-sm leading-relaxed ${active > 0 ? 'motion-safe:animate-[fadeSlideUp_0.7s_ease_forwards]' : ''}`}>{subtitle}</p>}
          <div className="flex flex-wrap gap-3">
            <CatalogLink href={ctaHref} className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 text-sm uppercase tracking-wider hover:bg-gray-100 transition-colors">
              {ctaText}<ArrowRight className="w-4 h-4" />
            </CatalogLink>
            <CatalogLink href={localePath('/catalog')} className="inline-flex items-center gap-2 border border-white/30 text-white/70 px-8 py-3 text-sm uppercase tracking-wider hover:border-white hover:text-white transition-colors">
              {language === 'ro' ? 'Vezi Catalogul' : 'Каталог'}<ArrowRight className="w-4 h-4" />
            </CatalogLink>
          </div>
        </div>

        {banners.length > 1 && (
          <div className="flex items-center gap-4 mt-8">
            <div className="flex items-center gap-2">
              {banners.map((item, index) => (
                <button type="button" key={item.id} aria-label={`${language === 'ro' ? 'Diapozitiv' : 'Слайд'} ${index + 1}`} aria-pressed={index === active} onClick={() => navigate(index)} className="w-8 h-11 flex items-center justify-center"><span aria-hidden="true" className={`h-1 transition-all duration-300 ${index === active ? 'w-6 bg-white' : 'w-2 bg-gray-400 hover:bg-gray-300'}`} /></button>
              ))}
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <button aria-label="Previous slide" onClick={() => navigate(active - 1)} className="w-11 h-11 border border-white/30 flex items-center justify-center text-white/80 hover:text-white hover:border-white/70 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <button aria-label="Next slide" onClick={() => navigate(active + 1)} className="w-11 h-11 border border-white/30 flex items-center justify-center text-white/80 hover:text-white hover:border-white/70 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export function HomeMigrationPreview({ language, banners, brands, featuredProducts, saleProducts, promoCount, categories = [], categoryIcons = {} }: HomeMigrationPreviewProps) {
  return (
    <div className="min-h-screen bg-[#f5f6f7]">
      <section className="bg-[#f5f6f7]">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 lg:py-14">
          <div className="grid grid-cols-12 gap-2 md:gap-3">
            <div className="col-span-12 lg:col-span-8 overflow-hidden">
              <HeroSlider banners={banners} language={language} />
            </div>
            <div className="col-span-12 lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-2 md:gap-3">
              <CatalogLink href={`/${language}/turnkey-solutions`} className="bg-gray-950 text-white p-4 sm:p-6 md:p-8 flex flex-col justify-between min-h-[180px] lg:min-h-0 lg:flex-1 group hover:bg-black transition-colors cursor-pointer">
                <div className="flex items-start justify-end mb-6">
                  <ArrowUpRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl text-white uppercase leading-tight mb-4">{language === 'ro' ? 'Soluții la cheie' : 'Решения под ключ'}</div>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-sm mb-5">{language === 'ro' ? 'De la proiectare și selecția echipamentelor până la livrare și instalare.' : 'От проектирования и подбора оборудования до доставки и установки.'}</p>
                </div>
              </CatalogLink>
              <CatalogLink href={`/${language}/catalog?sale=true`} className="bg-gradient-to-br from-red-600 to-red-700 text-white p-4 sm:p-6 md:p-8 flex flex-col justify-between min-h-[120px] lg:min-h-0 lg:flex-1 group hover:from-red-700 hover:to-red-800 transition-all cursor-pointer">
                <div className="flex items-start justify-end mb-3"><Tag className="w-4 h-4 text-red-300 group-hover:text-white transition-colors" /></div>
                <div><div className="text-5xl sm:text-6xl md:text-7xl text-white tabular-nums leading-none">{promoCount}</div><div className="text-[10px] sm:text-xs text-red-200 mt-1 uppercase tracking-widest">{language === 'ro' ? 'Promoții cu reducere' : 'Товаров со скидкой'}</div></div>
              </CatalogLink>
            </div>
          </div>
        </div>
      </section>
      <FeaturedProductsSlider products={featuredProducts} language={language} />
      <HomeCategories categories={categories} categoryIcons={categoryIcons} language={language} />
      <FeaturedProductsSlider products={saleProducts} language={language} title={language === 'ro' ? 'Produse la promoție' : 'Товары по акции'} />
      <section className="py-12 md:py-16">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">{language === 'ro' ? 'Servicii profesionale' : 'Профессиональные услуги'}</h2>
          <ServicesBentoView language={language} basePath={`/${language}`} />
        </div>
      </section>
      <HomeBenefits language={language} />
      <PartnersMarqueePreview brands={brands} language={language} />
      <HomeCallToAction language={language} />
    </div>
  );
}
