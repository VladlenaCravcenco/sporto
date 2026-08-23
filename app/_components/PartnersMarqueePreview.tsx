'use client';

import { useEffect, useRef, useState } from 'react';
import type { BrandItem } from '../_lib/home-data';
import type { Language } from './HeaderPreview';

const production = 'https://www.sporto.md';

export function PartnersMarqueePreview({ brands, language }: { brands: BrandItem[]; language: Language }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const position = useRef(0);
  const halfWidth = useRef(0);
  const paused = useRef(false);
  const suppressClick = useRef(false);
  const drag = useRef({ active: false, dragged: false, startX: 0, startPosition: 0 });

  useEffect(() => {
    if (track.current) halfWidth.current = track.current.scrollWidth / 2;
  });

  useEffect(() => {
    function tick() {
      if (!paused.current && halfWidth.current > 0) {
        position.current -= 0.6;
        if (position.current <= -halfWidth.current) position.current += halfWidth.current;
        if (track.current) track.current.style.transform = `translateX(${position.current}px)`;
      }
      frame.current = requestAnimationFrame(tick);
    }

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [brands]);

  function resume(delay: number) {
    window.setTimeout(() => { paused.current = false; }, delay);
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
    paused.current = true;
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
      window.setTimeout(() => { suppressClick.current = false; }, 0);
    }
    resume(800);
  }

  if (brands.length === 0) return null;

  const copiesPerHalf = Math.ceil(16 / brands.length);
  const half = Array.from({ length: copiesPerHalf }, () => brands).flat();
  const items = [...half, ...half];

  return (
    <div className="bg-white border-y border-gray-100 py-5">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-300">
          {language === 'ro' ? 'Mărci partenere — click pentru catalog' : 'Бренды-партнёры — нажмите для каталога'}
        </p>
      </div>
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
        onMouseEnter={() => { paused.current = true; }}
        onMouseLeave={() => resume(150)}
        style={{ touchAction: 'pan-y' }}
      >
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-white to-transparent" />
        <div ref={track} className="flex items-center will-change-transform" style={{ width: 'max-content' }}>
          {items.map((brand, index) => {
            const itemId = `${brand.id}-${index}`;
            const hovered = hoveredId === itemId;
            return (
              <a
                key={itemId}
                href={`${production}/brands/${brand.slug}`}
                onMouseEnter={() => setHoveredId(itemId)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative flex-shrink-0 select-none focus:outline-none w-[180px] h-12 flex items-center justify-center"
              >
                {brand.logo_url ? (
                  <img src={brand.logo_url} alt={brand.name} draggable={false} className="max-h-8 max-w-[120px] object-contain transition-all duration-300" style={{ opacity: hovered ? 1 : 0.35, filter: hovered ? 'none' : 'grayscale(100%)' }} />
                ) : (
                  <span className="block transition-colors duration-200 text-sm tracking-widest uppercase select-none whitespace-nowrap" style={{ color: hovered ? '#000' : '#d1d5db', fontWeight: 700 }}>{brand.name}</span>
                )}
                <span className="absolute bottom-0 left-8 h-px bg-black transition-all duration-300 ease-out" style={{ width: hovered ? 'calc(100% - 4rem)' : '0%' }} />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
