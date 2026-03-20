import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useLanguage } from '../contexts/LanguageContext';
import { X } from 'lucide-react';

const STORAGE_KEY = 'sporto_cookie_consent';

const T = {
  ro: {
    text: 'Acest site folosește cookie-uri pentru a îmbunătăți experiența dvs. de navigare și pentru autentificarea contului.',
    accept: 'Accept',
    decline: 'Refuz',
    policy: 'Politica de confidențialitate',
  },
  ru: {
    text: 'Этот сайт использует файлы cookie для улучшения работы и аутентификации аккаунта.',
    accept: 'Принять',
    decline: 'Отклонить',
    policy: 'Политика конфиденциальности',
  },
};

export function CookieBanner() {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);
  const C = T[language as 'ro' | 'ru'];

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Small delay so it doesn't pop up instantly on first render
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[140] bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">

        {/* Text */}
        <p className="text-xs text-gray-600 leading-relaxed flex-1">
          {C.text}{' '}
          <Link
            to="/privacy-policy"
            className="underline underline-offset-2 text-gray-500 hover:text-black transition-colors"
          >
            {C.policy}
          </Link>
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={decline}
            className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-700 px-4 py-2.5 border border-gray-200 hover:border-gray-400 transition-colors"
          >
            {C.decline}
          </button>
          <button
            onClick={accept}
            className="text-[10px] uppercase tracking-widest text-white bg-black hover:bg-gray-800 px-5 py-2.5 transition-colors"
          >
            {C.accept}
          </button>
          <button
            onClick={accept}
            className="text-gray-400 hover:text-black transition-colors ml-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
