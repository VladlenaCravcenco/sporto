'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Phone, X } from 'lucide-react';
import type { FooterData } from '../_lib/footer-data';
import type { Language } from './HeaderPreview';

export function FloatingContactsPreview({
  language,
  contacts,
}: {
  language: Language;
  contacts: FooterData;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-6 z-[150] flex flex-col items-end gap-2.5">
      {open && (
        <div className="flex flex-col gap-2 items-end animate-in fade-in slide-in-from-bottom-2 duration-200">
          <a href={contacts.whatsapp} target="_blank" rel="noopener noreferrer" title="WhatsApp" aria-label="WhatsApp" className="w-10 h-10 rounded-[5px] flex items-center justify-center bg-[#25D366] shadow-lg hover:opacity-80 transition-opacity">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
          </a>

          <a href={contacts.telegram} target="_blank" rel="noopener noreferrer" title="Telegram" aria-label="Telegram" className="w-10 h-10 rounded-[5px] flex items-center justify-center bg-[#29A8EB] shadow-lg hover:opacity-80 transition-opacity">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.5l-2.95-.924c-.64-.203-.654-.64.135-.954l11.566-4.458c.537-.194 1.006.131.973.057z" /></svg>
          </a>

          <a href={contacts.viber} title="Viber" aria-label="Viber" className="w-10 h-10 rounded-[5px] flex items-center justify-center bg-[#7360F2] shadow-lg hover:opacity-80 transition-opacity">
            <img src="https://cdn.simpleicons.org/viber/white" className="w-[18px] h-[18px]" alt="" />
          </a>

          <a href={`tel:${contacts.phone}`} className="flex items-center gap-2.5 rounded-[5px] bg-white border border-gray-100 shadow-lg hover:shadow-xl hover:border-gray-200 px-4 py-2.5 transition-all duration-200 group" aria-label={contacts.phoneDisplay}>
            <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors whitespace-nowrap font-mono">{contacts.phoneDisplay}</span>
            <span className="w-8 h-8 rounded-[5px] bg-black flex items-center justify-center flex-shrink-0"><Phone className="w-3.5 h-3.5 text-white" /></span>
          </a>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        className={`contact-sticker-attention h-14 w-[min(310px,calc(100vw-2rem))] rounded-[5px] overflow-hidden flex items-center text-left shadow-[0_12px_32px_rgba(220,38,38,0.28)] transition-colors duration-300 ${open ? 'bg-gray-900 hover:bg-black' : 'bg-red-600 hover:bg-red-700'}`}
        aria-expanded={open}
        aria-label={open
          ? (language === 'ro' ? 'Închideți contactele' : 'Закрыть контакты')
          : (language === 'ro' ? 'Contactați-ne' : 'Связаться с нами')}
      >
        <span className="w-14 h-14 flex-shrink-0 flex items-center justify-center border-r border-white/20">
          {open ? <X className="w-5 h-5 text-white" /> : <MessageCircle className="w-5 h-5 text-white" />}
        </span>
        <span className="flex-1 min-w-0 px-4">
          <span className="block text-[11px] font-medium text-white/70 mb-0.5">
            {open
              ? (language === 'ro' ? 'Alegeți un contact' : 'Выберите способ связи')
              : (language === 'ro' ? 'Suntem online' : 'Мы онлайн')}
          </span>
          <span className="block text-sm font-semibold text-white whitespace-nowrap truncate">
            {open
              ? (language === 'ro' ? 'Cum vă putem ajuta?' : 'Как с нами связаться?')
              : (language === 'ro' ? 'Aveți întrebări?' : 'Есть вопрос? Мы онлайн!')}
          </span>
        </span>
        {!open && <span className="mr-4 w-2 h-2 flex-shrink-0 bg-white rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.18)]" />}
      </button>
    </div>
  );
}
