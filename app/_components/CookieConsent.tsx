'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Language } from './HeaderPreview';

type Consent = 'accepted' | 'declined';

const cookieName = 'sporto_cookie_consent';
const cookieLifetime = 60 * 60 * 24 * 180;

const copy = {
  ro: {
    text: 'Folosim cookie-uri esențiale pentru funcționarea site-ului și pentru păstrarea preferințelor. Analiza externă nu este activată în prezent.',
    accept: 'Accept',
    decline: 'Refuz',
    policy: 'Politica de confidențialitate',
    close: 'Închide fără a accepta',
  },
  ru: {
    text: 'Мы используем необходимые cookies для работы сайта и сохранения настроек. Внешняя аналитика сейчас не подключена.',
    accept: 'Принять',
    decline: 'Отказаться',
    policy: 'Политика конфиденциальности',
    close: 'Закрыть без принятия',
  },
} as const;

function readConsent(): Consent | null {
  const value = document.cookie
    .split('; ')
    .find(item => item.startsWith(`${cookieName}=`))
    ?.split('=')[1];
  return value === 'accepted' || value === 'declined' ? value : null;
}

function saveConsent(value: Consent) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${cookieName}=${value}; Path=/; Max-Age=${cookieLifetime}; SameSite=Lax${secure}`;
}

export function CookieConsent({ language }: { language: Language }) {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);
  const text = copy[language];

  useEffect(() => {
    setConsent(readConsent());
    setReady(true);

    function reopenSettings() {
      setConsent(null);
      setReady(true);
    }

    window.addEventListener('sporto:open-cookie-settings', reopenSettings);
    return () => window.removeEventListener('sporto:open-cookie-settings', reopenSettings);
  }, []);

  function choose(value: Consent) {
    saveConsent(value);
    setConsent(value);
    window.dispatchEvent(new CustomEvent('sporto:cookie-consent', { detail: value }));
  }

  return (
    <>
      {ready && consent === null && (
        <section
          role="dialog"
          aria-live="polite"
          aria-label={language === 'ro' ? 'Preferințe cookie' : 'Настройки cookies'}
          className="fixed bottom-0 left-0 right-0 z-[140] bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
        >
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <p className="text-xs text-gray-600 leading-relaxed flex-1">
              {text.text}{' '}
              <a href={`/${language}/privacy-policy`} className="underline underline-offset-2 text-gray-500 hover:text-black transition-colors">
                {text.policy}
              </a>
            </p>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button type="button" onClick={() => choose('declined')} className="text-xs font-medium text-gray-500 hover:text-gray-900 px-4 py-2.5 border border-gray-200 hover:border-gray-400 transition-colors">
                {text.decline}
              </button>
              <button type="button" onClick={() => choose('accepted')} className="text-xs font-semibold text-white bg-black hover:bg-gray-800 px-5 py-2.5 transition-colors">
                {text.accept}
              </button>
              <button type="button" onClick={() => choose('declined')} className="text-gray-400 hover:text-black transition-colors ml-1" aria-label={text.close} title={text.close}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

declare global {
  interface WindowEventMap {
    'sporto:open-cookie-settings': Event;
    'sporto:cookie-consent': CustomEvent<Consent>;
  }
}
