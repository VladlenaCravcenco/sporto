'use client';

import type { Language } from './HeaderPreview';

export function CookieSettingsButton({ language }: { language: Language }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('sporto:open-cookie-settings'))}
      className="text-xs text-gray-600 hover:text-white transition-colors"
    >
      {language === 'ro' ? 'Setări cookie' : 'Настройки cookies'}
    </button>
  );
}
