import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { type BannerRow } from '../../lib/supabase';
import { type Language } from '../contexts/LanguageContext';

interface Props {
  banners: BannerRow[];
  language: Language;
  onCtaClick?: () => void; // for default CTA (consultation modal)
}

const INTERVAL = 5500;

export function HeroBannerSlider({ banners, language, onCtaClick }: Props) {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);

  const count = banners.length;

  const goTo = useCallback((idx: number) => {
    if (animating || idx === active) return;
    setAnimating(true);
    setActive((idx + count) % count);
    setTimeout(() => setAnimating(false), 600);
  }, [animating, active, count]);

  const next = useCallback(() => goTo(active + 1), [goTo, active]);
  const prev = useCallback(() => goTo(active - 1), [goTo, active]);

  // Auto-advance
  useEffect(() => {
    if (count <= 1) return;
    timerRef.current = setInterval(next, INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, count]);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(next, INTERVAL);
  };

  const handleNav = (idx: number) => { goTo(idx); resetTimer(); };
  const handlePrev = () => { prev(); resetTimer(); };
  const handleNext = () => { next(); resetTimer(); };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) {
      delta > 0 ? handleNext() : handlePrev();
    }
    touchStartX.current = null;
  };

  if (count === 0) return null;

  const banner = banners[active];
  const title = language === 'ro' ? banner.title_ro : (banner.title_ru || banner.title_ro);
  const subtitle = language === 'ro' ? banner.subtitle_ro : (banner.subtitle_ru || banner.subtitle_ro);
  const ctaText = language === 'ro'
    ? (banner.cta_text_ro || (language === 'ro' ? 'Solicită Ofertă' : 'Запросить предложение'))
    : (banner.cta_text_ru || (language === 'ro' ? 'Solicită Ofertă' : 'Запросить предложение'));
  const ctaLink = banner.cta_link || '/order-request';
  const isExternal = ctaLink.startsWith('http');

  return (
    <div
      className="relative w-full h-full min-h-[420px] lg:min-h-[540px] bg-black overflow-hidden flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >

      {/* Slides */}
      {banners.map((b, i) => (
        <div
          key={b.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === active ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          {b.image_url && (
            <img
              src={b.image_url}
              alt={language === 'ro' ? (b.title_ro ?? '') : (b.title_ru ?? b.title_ro ?? '')}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0.35 }}
            />
          )}
          {/* Grid overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id={`grid-slide-${i}`} width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0 L0 0 0 40" fill="none" stroke="#fff" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-slide-${i})`} />
          </svg>
        </div>
      ))}

      {/* Content */}
      <div className="relative z-20 flex flex-col justify-between h-full p-10 md:p-14 lg:p-16 flex-1">
        <div className="flex items-center gap-3">
          {/* Счётчик убран */}
        </div>

        <div>
          <h2
            key={`title-${active}`}
            className="text-3xl md:text-4xl lg:text-[3.25rem] text-white mb-6 leading-tight max-w-xl"
            style={{ animation: 'fadeSlideUp 0.6s ease forwards' }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              key={`sub-${active}`}
              className="text-sm text-gray-400 mb-10 max-w-sm leading-relaxed"
              style={{ animation: 'fadeSlideUp 0.7s ease forwards' }}
            >
              {subtitle}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {isExternal ? (
              <a
                href={ctaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 text-sm uppercase tracking-wider hover:bg-gray-100 transition-colors"
              >
                {ctaText}
                <ArrowRight className="w-4 h-4" />
              </a>
            ) : ctaLink === '#modal' ? (
              <button
                onClick={onCtaClick}
                className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 text-sm uppercase tracking-wider hover:bg-gray-100 transition-colors"
              >
                {ctaText}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <Link
                to={ctaLink}
                className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 text-sm uppercase tracking-wider hover:bg-gray-100 transition-colors"
              >
                {ctaText}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 border border-white/30 text-white/70 px-8 py-3 text-sm uppercase tracking-wider hover:border-white hover:text-white transition-colors"
            >
              {language === 'ro' ? 'Vezi Catalogul' : 'Каталог'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Bottom: dots + arrows */}
        {count > 1 && (
          <div className="flex items-center gap-4 mt-8">
            {/* Dots */}
            <div className="flex items-center gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleNav(i)}
                  className={`transition-all duration-300 ${
                    i === active
                      ? 'w-6 h-1 bg-white'
                      : 'w-2 h-1 bg-gray-700 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>
            {/* Arrows */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={handlePrev}
                className="w-8 h-8 border border-white/20 flex items-center justify-center text-white/40 hover:text-white hover:border-white/70 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNext}
                className="w-8 h-8 border border-white/20 flex items-center justify-center text-white/40 hover:text-white hover:border-white/70 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}