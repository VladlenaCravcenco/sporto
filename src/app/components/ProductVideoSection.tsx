import { useState } from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';

interface ProductVideoSectionProps {
  youtubeId?: string | null;
  productName: string;
  language: 'ro' | 'ru';
}

export function ProductVideoSection({ youtubeId, productName, language }: ProductVideoSectionProps) {
  const [playing, setPlaying] = useState(false);

  if (!youtubeId) return null;

  const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&color=white`;

  const label = language === 'ro' ? 'Video produs' : 'Видео товара';
  const hint  = language === 'ro'
    ? 'Demonstrație și detalii vizuale ale echipamentului'
    : 'Демонстрация и визуальные детали оборудования';

  return (
    <div className="border-t border-gray-100 pt-8 mt-2">

      {/* Bento grid: annotation left + player right */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-0 border border-gray-100">
        {/* ── Left: annotation cell ── */}
        <div className="flex flex-col justify-between p-6 lg:p-8 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-100">

          {/* Top: label */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-black" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                {label}
              </span>
            </div>
            <p className="text-sm text-gray-900 leading-snug mb-3">
              {productName}
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              {hint}
            </p>
          </div>

          {/* Bottom: YouTube branding hint */}
          <div className="mt-8 lg:mt-0 flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-300 fill-current">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8z" />
              <path d="M9.75 15.02V8.98L15.5 12l-5.75 3.02z" fill="white" />
            </svg>
            <span className="text-[10px] text-gray-300 uppercase tracking-widest">YouTube</span>
          </div>
        </div>

        {/* ── Right: video player cell ── */}
        <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
          {!playing ? (
            /* Custom poster with play button */
            <motion.button
              className="absolute inset-0 w-full h-full group"
              onClick={() => setPlaying(true)}
              whileHover="hover"
              initial="idle"
            >
              {/* Thumbnail */}
              <img
                src={thumbnailUrl}
                alt={productName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to hqdefault if maxresdefault missing
                  (e.target as HTMLImageElement).src =
                    `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                }}
              />

              {/* Dark vignette overlay */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />

              {/* Play button */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                variants={{
                  idle:  { scale: 1 },
                  hover: { scale: 1.08 },
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <div className="w-16 h-16 bg-white flex items-center justify-center shadow-2xl">
                  <Play className="w-6 h-6 text-black fill-black ml-0.5" />
                </div>
              </motion.div>

              {/* Corner label */}
              <div className="absolute bottom-4 left-4 text-[10px] text-white/60 uppercase tracking-widest">
                {language === 'ro' ? 'Click pentru redare' : 'Нажмите для воспроизведения'}
              </div>
            </motion.button>
          ) : (
            /* Actual iframe */
            <motion.iframe
              src={embedUrl}
              title={productName}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}