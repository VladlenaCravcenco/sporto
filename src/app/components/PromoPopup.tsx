import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

const STORAGE_KEY = 'sporto_popup';
const SEEN_KEY    = 'sporto_promo_seen';

interface PopupData {
  active: boolean;
  title_ro: string; title_ru: string;
  body_ro: string;  body_ru: string;
  cta_label_ro: string; cta_label_ru: string;
  cta_url: string;
  show_once: boolean;
  delay_seconds: number;
}

// Дефолтный попап — активен сразу, меняется через админку
const FALLBACK: PopupData = {
  active: true,
  title_ro: 'Echipament sportiv\nla cel mai bun preț',
  title_ru: 'Спортивное оборудование\nпо лучшей цене',
  body_ro:  'Catalog de peste 8 000 de produse din Italia și UE. Prețuri angro pentru cluburi, școli și instituții.',
  body_ru:  'Каталог более 8 000 товаров из Италии и ЕС. Оптовые цены для клубов, школ и учреждений.',
  cta_label_ro: 'Vezi Catalogul',
  cta_label_ru: 'Смотреть каталог',
  cta_url:  '/catalog',
  show_once: true,
  delay_seconds: 5,
};

function loadConfig(): PopupData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...FALLBACK, ...JSON.parse(raw) } : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export function PromoPopup() {
  const { language } = useLanguage();
  const lang = language as 'ro' | 'ru';
  const [cfg, setCfg]     = useState<PopupData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const config = loadConfig();
    if (!config.active) return;
    if (!config.title_ro && !config.title_ru) return;
    if (config.show_once && sessionStorage.getItem(SEEN_KEY)) return;

    setCfg(config);
    const delay = Math.max(0, (config.delay_seconds ?? 5)) * 1000;
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    setVisible(false);
    if (cfg?.show_once) sessionStorage.setItem(SEEN_KEY, '1');
  };

  if (!cfg) return null;

  const title = lang === 'ro' ? cfg.title_ro : cfg.title_ru;
  const body  = lang === 'ro' ? cfg.body_ro  : cfg.body_ru;
  const cta   = lang === 'ro' ? cfg.cta_label_ro : cfg.cta_label_ru;

  if (!title && !body) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/65"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-black border border-white/15 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* accent line top */}
            <div className="absolute top-0 left-8 w-14 h-0.5 bg-white" />

            {/* close */}
            <button
              onClick={close}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-gray-600 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-8 pt-10 pb-9">
              {/* eyebrow */}
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-5">Sporto · SPORTOSFERA S.R.L.</p>

              {title && (
                <h2 className="text-[1.6rem] leading-[1.15] tracking-tight text-white mb-4 whitespace-pre-line">
                  {title}
                </h2>
              )}
              {body && (
                <p className="text-sm text-gray-400 leading-relaxed mb-8">
                  {body}
                </p>
              )}

              <div className="flex items-center gap-5">
                {cta && cfg.cta_url && (
                  <Link
                    to={cfg.cta_url}
                    onClick={close}
                    className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-colors"
                  >
                    {cta}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
                <button
                  onClick={close}
                  className="text-[10px] text-gray-600 hover:text-gray-300 transition-colors uppercase tracking-widest"
                >
                  {lang === 'ro' ? 'Închide' : 'Закрыть'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
