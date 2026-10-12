'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { StoreImage } from '../../src/app/components/StoreImage';

export function ProductGallery({ images, name, language }: {
  images: string[]; name: string; language: 'ro' | 'ru';
}) {
  const [selected, setSelected] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const active = selected < images.length ? selected : 0;
  const multiple = images.length > 1;
  const move = (delta: number) => setSelected((active + delta + images.length) % images.length);
  const ro = language === 'ro';
  return <section aria-label={ro ? 'Fotografii produs' : 'Фотографии товара'}
    onKeyDown={event => {
      if (!multiple) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
      }
    }}>
    <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-white"
      tabIndex={multiple ? 0 : undefined}
      onTouchStart={event => {
        const point = event.touches[0]; touch.current = { x: point.clientX, y: point.clientY };
      }}
      onTouchCancel={() => { touch.current = null; }}
      onTouchEnd={event => {
        const start = touch.current; touch.current = null;
        if (!start || !multiple) return;
        const point = event.changedTouches[0];
        const dx = point.clientX - start.x, dy = point.clientY - start.y;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
      }}>
      {images[active] ? <StoreImage key={images[active]} variant="detail" loading="eager"
        fetchPriority={active === 0 ? 'high' : 'auto'} src={images[active]}
        alt={`${name} — ${active + 1}`} className="h-full w-full object-contain" />
        : <Package className="h-12 w-12 text-gray-300" aria-hidden="true" />}
      {multiple && <>
        <button type="button" onClick={() => move(-1)} aria-label={ro ? 'Fotografia precedentă' : 'Предыдущее фото'}
          className="absolute left-2 flex h-11 w-11 items-center justify-center border border-gray-200 bg-white/90 text-black hover:bg-gray-100"><ChevronLeft aria-hidden="true" /></button>
        <button type="button" onClick={() => move(1)} aria-label={ro ? 'Fotografia următoare' : 'Следующее фото'}
          className="absolute right-2 flex h-11 w-11 items-center justify-center border border-gray-200 bg-white/90 text-black hover:bg-gray-100"><ChevronRight aria-hidden="true" /></button>
        <span aria-live="polite" aria-atomic="true" className="absolute bottom-2 rounded bg-white/90 px-2 py-1 text-xs">{active + 1} / {images.length}</span>
      </>}
    </div>
    {multiple && <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
      {images.map((image, index) => <button key={`${image}-${index}`} type="button"
        onClick={() => setSelected(index)} aria-pressed={index === active}
        aria-label={`${ro ? 'Fotografia' : 'Фото'} ${index + 1}`}
        className={`h-20 w-20 shrink-0 border-2 bg-white p-1 ${index === active ? 'border-black' : 'border-transparent hover:border-gray-300'}`}>
        <StoreImage variant="thumbnail" sizes="80px" loading="lazy" src={image} alt="" className="h-full w-full object-contain" />
      </button>)}
    </div>}
  </section>;
}
