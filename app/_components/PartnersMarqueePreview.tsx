'use client';

import { useEffect, useRef, useState } from 'react';
import { StoreImage } from '../../src/app/components/StoreImage';
import { observeCarouselVisibility } from './carousel-visibility';
import type { BrandItem } from '../_lib/home-data';
import type { Language } from './HeaderPreview';

function BrandLogo({ brand, hovered, enabled }: { brand: BrandItem; hovered: boolean; enabled: boolean }) {
  const [failed, setFailed] = useState(false);
  const validSource = !!brand.logo_url && /^(https?:\/\/|\/(?!\/))/.test(brand.logo_url);
  if (!validSource || failed) return <span className="block transition-colors duration-200 text-sm tracking-widest uppercase select-none whitespace-nowrap" style={{ color: hovered ? '#000' : '#d1d5db', fontWeight: 700 }}>{brand.name}</span>;
  if (!enabled) return <span aria-hidden="true" className="block h-8 w-[120px]" />;
  return <StoreImage variant="logo" src={brand.logo_url!} alt={brand.name} width={120} height={32}
    loading="lazy" fetchPriority="low" draggable={false} onError={() => setFailed(true)}
    className="h-8 w-[120px] object-contain transition-all duration-300"
    style={{ opacity: hovered ? 1 : 0.35, filter: hovered ? 'none' : 'grayscale(100%)' }} />;
}

export function PartnersMarqueePreview({ brands, language }: { brands: BrandItem[]; language: Language }) {
  const [logosEnabled, setLogosEnabled] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const position = useRef(0);
  const halfWidth = useRef(0);
  const paused = useRef(false);
  const resumeTimer = useRef<number | null>(null);
  const clickTimer = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const drag = useRef({ active: false, dragged: false, startX: 0, startPosition: 0 });

  useEffect(() => {
    if (!container.current || brands.length === 0) return;
    if (!('IntersectionObserver' in window)) { setLogosEnabled(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setLogosEnabled(true);
        observer.disconnect();
      }
    }, { rootMargin: '300px 0px' });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [brands.length]);

  useEffect(() => {
    if (track.current) halfWidth.current = track.current.scrollWidth / 2;
  });

  useEffect(() => {
    if (!container.current || brands.length === 0) return;
    let running = false;
    function tick() {
      if (!running) return;
      if (!paused.current && halfWidth.current > 0) {
        position.current -= 0.6;
        if (position.current <= -halfWidth.current) position.current += halfWidth.current;
        if (track.current) track.current.style.transform = `translateX(${position.current}px)`;
      }
      frame.current = requestAnimationFrame(tick);
    }

    return observeCarouselVisibility(container.current, active => {
      running = active;
      if (active) frame.current = requestAnimationFrame(tick);
      else cancelAnimationFrame(frame.current);
    });
  }, [brands]);

  useEffect(() => () => {
    if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
    if (clickTimer.current !== null) window.clearTimeout(clickTimer.current);
  }, []);

  function pause() {
    if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = null;
    paused.current = true;
  }

  function resume(delay: number) {
    if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => {
      resumeTimer.current = null;
      paused.current = false;
    }, delay);
  }

  function setPosition(next: number) {
    if (halfWidth.current > 0) {
      while (next > 0) next -= halfWidth.current;
      while (next < -halfWidth.current) next += halfWidth.current;
    }
    position.current = next;
    if (track.current) track.current.style.transform = `translateX(${next}px)`;
  }

  function pointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pause();
    drag.current = { active: true, dragged: false, startX: event.clientX, startPosition: position.current };
  }

  function pointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    const distance = event.clientX - drag.current.startX;
    if (Math.abs(distance) > 4 && !drag.current.dragged) {
      drag.current.dragged = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.classList.add('cursor-grabbing', 'select-none');
    }
    if (drag.current.dragged) setPosition(drag.current.startPosition + distance);
  }

  function pointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    const wasDragged = drag.current.dragged;
    drag.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    event.currentTarget.classList.remove('cursor-grabbing', 'select-none');
    if (wasDragged) {
      suppressClick.current = true;
      if (clickTimer.current !== null) window.clearTimeout(clickTimer.current);
      clickTimer.current = window.setTimeout(() => { clickTimer.current = null; suppressClick.current = false; }, 0);
    }
    resume(800);
  }

  if (brands.length === 0) return null;

  const copiesPerHalf = Math.ceil(16 / brands.length);
  const half = Array.from({ length: copiesPerHalf }, () => brands).flat();
  const items = [...half, ...half];

  return (
    <div ref={container} className="bg-[#f5f6f7] border-y border-gray-100 py-5">
      <div
        className="relative overflow-hidden cursor-grab"
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerEnd}
        onPointerCancel={pointerEnd}
        onClickCapture={event => {
          if (!suppressClick.current) return;
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }}
        onMouseEnter={pause}
        onMouseLeave={() => resume(150)}
        style={{ touchAction: 'pan-y' }}
      >
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-[#f5f6f7] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-[#f5f6f7] to-transparent" />
        <div ref={track} className="flex items-center will-change-transform" style={{ width: 'max-content' }}>
          {items.map((brand, index) => {
            const itemId = `${brand.id}-${index}`;
            const hovered = hoveredId === itemId;
            return (
              <a
                key={itemId}
                aria-label={brand.name}
                href={`/${language}/brands/${brand.slug}`}
                onMouseEnter={() => setHoveredId(itemId)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative flex-shrink-0 select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-[180px] h-12 flex items-center justify-center"
              >
                <span className="flex h-8 w-[120px] items-center justify-center" aria-label={brand.name}>
                  <BrandLogo key={brand.logo_url || brand.name} brand={brand} hovered={hovered} enabled={logosEnabled} />
                </span>
                <span className="absolute bottom-0 left-8 h-px bg-black transition-all duration-300 ease-out" style={{ width: hovered ? 'calc(100% - 4rem)' : '0%' }} />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
