import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLanguage } from '../contexts/LanguageContext';
import { useActiveBrands } from '../hooks/useSupabaseBrands';

export function PartnersMarquee() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { brands, loading } = useActiveBrands();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const trackRef   = useRef<HTMLDivElement>(null);
  const rafRef     = useRef<number>(0);
  const posRef     = useRef(0);          // current translateX in px
  const halfRef    = useRef(0);          // half of track width (loop point)
  const pausedRef  = useRef(false);

  // Touch drag state
  const touchStartX   = useRef(0);
  const touchStartPos = useRef(0);

  // Measure half-width after render
  useEffect(() => {
    if (trackRef.current) {
      halfRef.current = trackRef.current.scrollWidth / 2;
    }
  });

  // rAF auto-scroll loop — uses transform, works everywhere including mobile
  useEffect(() => {
    const SPEED = 0.6; // px per frame ~36px/sec at 60fps

    const tick = () => {
      if (!pausedRef.current && halfRef.current > 0) {
        posRef.current -= SPEED;
        // Seamless loop: when we've scrolled one full copy, jump back
        if (posRef.current <= -halfRef.current) {
          posRef.current += halfRef.current;
        }
        if (trackRef.current) {
          trackRef.current.style.transform = `translateX(${posRef.current}px)`;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [brands]);

  // ── Pause / resume helpers ───────────────────────────────────────────
  const pause = () => { pausedRef.current = true; };
  const resumeAfter = (ms: number) => {
    setTimeout(() => { pausedRef.current = false; }, ms);
  };

  // ── Touch handlers ───────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    pause();
    touchStartX.current   = e.touches[0].clientX;
    touchStartPos.current = posRef.current;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    let next = touchStartPos.current + dx;
    // Keep within loop bounds
    if (halfRef.current > 0) {
      while (next > 0)                  next -= halfRef.current;
      while (next < -halfRef.current)   next += halfRef.current;
    }
    posRef.current = next;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${next}px)`;
    }
  };

  const onTouchEnd = () => resumeAfter(800);

  if (loading || brands.length === 0) return null;

  // Ensure each "half" of the track has at least 16 items so the strip
  // always fills the viewport — no matter how few brands are in the DB.
  const minPerHalf = 16;
  const copiesPerHalf = Math.ceil(minPerHalf / brands.length);
  const half = Array.from({ length: copiesPerHalf }, () => brands).flat();
  const copies = [...half, ...half]; // doubled: second half is the seamless clone

  return (
    <div className="bg-white border-y border-gray-100 py-5">
      {/* Label */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-300">
          {language === 'ro'
            ? 'Mărci partenere — click pentru catalog'
            : 'Бренды-партнёры — нажмите для каталога'}
        </p>
      </div>

      {/* Track — overflow:hidden + transform-based scroll */}
      <div
        className="relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseEnter={pause}
        onMouseLeave={() => resumeAfter(150)}
      >
        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-white to-transparent" />

        <div
          ref={trackRef}
          className="flex items-center will-change-transform"
          style={{ width: 'max-content' }}
        >
          {copies.map((brand, i) => {
            const key = `${brand.id}-${i}`;
            const isHovered = hoveredId === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => navigate(`/brands/${brand.slug}`)}
                onMouseEnter={() => setHoveredId(key)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative flex-shrink-0 select-none focus:outline-none px-8 flex items-center justify-center"
                style={{ height: 48 }}
              >
                {brand.logo_url ? (
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    draggable={false}
                    className="max-h-8 max-w-[130px] object-contain transition-all duration-300"
                    style={{
                      opacity: isHovered ? 1 : 0.35,
                      filter: isHovered ? 'none' : 'grayscale(100%)',
                    }}
                  />
                ) : (
                  <span
                    className="block transition-colors duration-200 text-sm tracking-widest uppercase select-none whitespace-nowrap"
                    style={{ color: isHovered ? '#000' : '#d1d5db', fontWeight: 700 }}
                  >
                    {brand.name}
                  </span>
                )}

                {/* Underline grows on hover */}
                <span
                  className="absolute bottom-0 left-8 h-px bg-black transition-all duration-300 ease-out"
                  style={{ width: isHovered ? 'calc(100% - 4rem)' : '0%' }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}