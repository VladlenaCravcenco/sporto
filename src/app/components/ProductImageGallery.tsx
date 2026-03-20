import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Touch swipe state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const openLightbox = (index: number) => { setLightboxIndex(index); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);

  const prevMain = useCallback(() => setActiveIndex(i => (i - 1 + images.length) % images.length), [images.length]);
  const nextMain = useCallback(() => setActiveIndex(i => (i + 1) % images.length), [images.length]);

  const prev = useCallback(() => setLightboxIndex(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setLightboxIndex(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, prev, next]);

  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  if (!images.length) return null;

  // Touch handlers for swipe on main image
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx < 0 ? nextMain() : prevMain();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <>
      {/* ── Compact gallery ── */}
      <div className="flex flex-col gap-3">

        {/* Main image */}
        <div
          className="relative aspect-square sm:aspect-[4/3] bg-gray-100 overflow-hidden cursor-zoom-in group"
          onClick={() => openLightbox(activeIndex)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeIndex}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <ImageWithFallback
                src={images[activeIndex]}
                alt={productName}
                className="w-full h-full object-contain bg-gray-50"
              />
            </motion.div>
          </AnimatePresence>

          {/* zoom hint — desktop only */}
          <div className="hidden sm:block absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-3.5 h-3.5 text-gray-600" />
          </div>

          {/* Mobile arrow navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevMain(); }}
                className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 text-white flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextMain(); }}
                className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 text-white flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* counter badge */}
          {images.length > 1 && (
            <div className="absolute top-3 left-3 bg-black/50 text-white text-[10px] px-2 py-0.5 tracking-wider">
              {activeIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Dot indicators — mobile only */}
        {images.length > 1 && (
          <div className="flex sm:hidden items-center justify-center gap-1.5 py-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`transition-all duration-200 rounded-full ${
                  i === activeIndex ? 'w-4 h-1.5 bg-black' : 'w-1.5 h-1.5 bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}

        {/* Thumbnails — desktop only */}
        {images.length > 1 && (
          <div className="hidden sm:flex gap-2">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`relative w-16 h-16 flex-none overflow-hidden transition-all duration-200 ${
                  i === activeIndex
                    ? 'ring-2 ring-black ring-offset-1'
                    : 'ring-1 ring-gray-200 opacity-50 hover:opacity-100'
                }`}
              >
                <ImageWithFallback
                  src={src}
                  alt={`${productName} ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div className="absolute inset-0 bg-black/90" onClick={closeLightbox} />

            <motion.div
              className="relative z-10 flex flex-col items-center w-full max-w-4xl mx-4"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between w-full mb-3 px-1">
                <span className="text-white/50 text-xs tracking-widest">
                  {lightboxIndex + 1} / {images.length}
                </span>
                <button onClick={closeLightbox} className="text-white/50 hover:text-white transition-colors p-2 -mr-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative w-full bg-gray-900">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={lightboxIndex}
                    src={images[lightboxIndex]}
                    alt={`${productName} ${lightboxIndex + 1}`}
                    className="w-full max-h-[75vh] object-contain"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                  />
                </AnimatePresence>

                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); prev(); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); next(); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 mt-3">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setLightboxIndex(i)}
                      className={`w-14 h-14 overflow-hidden transition-all duration-150 ${
                        i === lightboxIndex ? 'ring-2 ring-white' : 'opacity-40 hover:opacity-80'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}