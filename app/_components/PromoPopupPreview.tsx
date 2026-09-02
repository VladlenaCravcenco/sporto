'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, X } from 'lucide-react';
import type { PopupData } from '../_lib/popup-data';
import type { Language } from './HeaderPreview';

const seenKey = 'sporto_promo_seen';

function localizedHref(url: string, language: Language) {
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  const normalized = url.startsWith('/') ? url : `/${url}`;
  if (/^\/(ro|ru)(?:\/|$)/.test(normalized)) return normalized.replace(/^\/(ro|ru)/, `/${language}`);
  return `/${language}${normalized}`;
}

export function PromoPopupPreview({ language, config }: { language: Language; config: PopupData }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!config.active) return;
    if (!config.title_ro && !config.title_ru && !config.body_ro && !config.body_ru) return;
    if (config.show_once && sessionStorage.getItem(seenKey)) return;

    const timer = window.setTimeout(
      () => setVisible(true),
      Math.max(0, config.delay_seconds ?? 5) * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [config]);

  useEffect(() => {
    if (!visible) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  });

  function close() {
    setVisible(false);
    if (config.show_once) sessionStorage.setItem(seenKey, '1');
  }

  const title = language === 'ro' ? config.title_ro : config.title_ru;
  const body = language === 'ro' ? config.body_ro : config.body_ru;
  const cta = language === 'ro' ? config.cta_label_ro : config.cta_label_ru;

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
          role="dialog"
          aria-modal="true"
          aria-label={title || (language === 'ro' ? 'Ofertă SPORTO' : 'Предложение SPORTO')}
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-black border border-white/15 max-w-md w-full shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="absolute top-0 left-8 w-14 h-0.5 bg-white" />
            <button type="button" onClick={close} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white transition-colors" aria-label={language === 'ro' ? 'Închide' : 'Закрыть'}>
              <X className="w-4 h-4" />
            </button>

            <div className="px-8 pt-10 pb-9">
              <p className="text-[11px] font-medium text-gray-500 mb-5">Sporto · SPORTOSFERA S.R.L.</p>
              {title && <h2 className="text-[1.6rem] font-semibold leading-[1.15] text-white mb-4 whitespace-pre-line">{title}</h2>}
              {body && <p className="text-sm text-gray-400 leading-relaxed mb-8">{body}</p>}

              <div className="flex items-center gap-5">
                {cta && config.cta_url && (
                  <a href={localizedHref(config.cta_url, language)} onClick={close} className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-xs font-semibold hover:bg-gray-100 transition-colors">
                    {cta}<ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
                <button type="button" onClick={close} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                  {language === 'ro' ? 'Închide' : 'Закрыть'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
