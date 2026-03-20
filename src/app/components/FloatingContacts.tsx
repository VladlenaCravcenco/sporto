import { useState } from 'react';
import { Phone, X, MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { CONTACTS } from '../../lib/contacts';

export function FloatingContacts() {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);

  const waMsg = encodeURIComponent(
    language === 'ro'
      ? 'Bună ziua! Sunt interesat de echipamentele sportive Sporto.'
      : 'Добрый день! Меня интересует спортивное оборудование Sporto.'
  );

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-[150] flex flex-col items-end gap-2.5">

      {/* ── Expanded contacts panel ── */}
      {open && (
        <div className="flex flex-col gap-2 items-end animate-in fade-in slide-in-from-bottom-2 duration-200">

          {/* WhatsApp */}
          <a
            href={`https://wa.me/${CONTACTS.phone.replace('+', '')}?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp"
            className="w-10 h-10 flex items-center justify-center bg-[#25D366] shadow-lg hover:opacity-80 transition-opacity"
            aria-label="WhatsApp"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>

          {/* Telegram */}
          <a
            href={CONTACTS.telegram}
            target="_blank"
            rel="noopener noreferrer"
            title="Telegram"
            className="w-10 h-10 flex items-center justify-center bg-[#29A8EB] shadow-lg hover:opacity-80 transition-opacity"
            aria-label="Telegram"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.5l-2.95-.924c-.64-.203-.654-.64.135-.954l11.566-4.458c.537-.194 1.006.131.973.057z"/>
            </svg>
          </a>

          {/* Viber */}
          <a
            href={CONTACTS.viber}
            title="Viber"
            className="w-10 h-10 flex items-center justify-center bg-[#7360F2] shadow-lg hover:opacity-80 transition-opacity"
            aria-label="Viber"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M11.4 0C7.2.2 3.6 1.7 1.3 4.4-.6 6.7-.3 9.4.4 11.2c.2.5.6 1.2 1.2 1.9.6.8.7 1.2.6 1.7l-.6 3.6c-.1.4.3.8.7.7l3.7-.7c.5-.1 1 0 1.7.5.9.6 2.1 1.2 3.7 1.5 3.3.6 6.8-.1 9.2-2.4 2.5-2.4 3.5-5.7 3.4-8.7-.2-5.3-4.2-9.5-9.5-9.8C13 0 12.2 0 11.4 0zM12 2c4.5.2 8 3.8 8.1 8.3.1 2.5-.7 5.2-2.8 7.1-2 1.9-4.9 2.6-7.7 2-.9-.2-1.8-.6-2.5-1.1-.7-.5-1.4-.8-2.3-.6l-2.8.5.5-2.8c.2-.8 0-1.6-.7-2.4C1.3 12.3.9 11.8.7 11.3c-.6-1.5-.8-3.7.8-5.7C3.6 3.1 6.9 2 10.1 2c.6 0 1.3 0 1.9 0zm-2.8 3.7c-.2 0-.5.1-.7.2-.9.6-1.8 1.7-2 2.7-.2 1 .2 2 .6 2.8.5.9 1.6 2.3 3.1 3.4 1.1.8 2.1 1.3 2.9 1.6.9.3 1.7.4 2.2.1.4-.2.9-.8 1.1-1.3.1-.3 0-.5-.2-.7l-2.1-1.2c-.2-.1-.5-.1-.7.1l-.7.7c-.2.2-.4.2-.6.1-.7-.3-1.6-.9-2.3-1.8-.6-.8-.9-1.5-.9-1.7 0-.2 0-.4.2-.5l.7-.7c.2-.2.2-.4.1-.6L10 6.4c-.1-.4-.3-.6-.5-.7-.1 0-.2 0-.3 0z"/>
            </svg>
          </a>

          {/* Phone — with number */}
          <a
            href={`tel:${CONTACTS.phone}`}
            className="flex items-center gap-2.5 bg-white border border-gray-100 shadow-lg hover:shadow-xl hover:border-gray-200 px-4 py-2.5 transition-all duration-200 group"
            aria-label={CONTACTS.phoneDisplay}
          >
            <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors whitespace-nowrap font-mono">
              {CONTACTS.phoneDisplay}
            </span>
            <div className="w-8 h-8 bg-black flex items-center justify-center flex-shrink-0">
              <Phone className="w-3.5 h-3.5 text-white" />
            </div>
          </a>
        </div>
      )}

      {/* ── Main toggle button ── */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shadow-xl transition-all duration-300 ${
          open
            ? 'bg-gray-800 hover:bg-gray-700'
            : 'bg-black hover:bg-gray-800'
        }`}
        aria-label={open ? 'Закрыть контакты' : 'Связаться с нами'}
      >
        {open
          ? <X className="w-5 h-5 text-white" />
          : <MessageCircle className="w-5 h-5 text-white" />
        }
      </button>

      {/* ── Pulse ring when closed ── */}
      {!open && (
        <span className="absolute bottom-0 right-0 w-12 h-12 sm:w-14 sm:h-14 pointer-events-none">
          <span className="absolute inset-0 bg-black rounded-none animate-ping opacity-20" />
        </span>
      )}
    </div>
  );
}