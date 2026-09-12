import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { HeaderPreview, type Language } from '../_components/HeaderPreview';
import { FooterPreview } from '../_components/FooterPreview';
import { FloatingContactsPreview } from '../_components/FloatingContactsPreview';
import { CookieConsent } from '../_components/CookieConsent';
import { PromoPopupPreview } from '../_components/PromoPopupPreview';
import { getFooterData } from '../_lib/footer-data';
import { getPopupData, PROMO_POPUP_ENABLED } from '../_lib/popup-data';
import { getCatalogNavigation } from '../_lib/catalog-data';

const languages = new Set<Language>(['ro', 'ru']);

export function generateStaticParams() {
  return [{ lang: 'ro' }, { lang: 'ru' }];
}

export default async function PublicLocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!languages.has(lang as Language)) notFound();
  const [footerData, popupData, catalogNavigation] = await Promise.all([
    getFooterData(),
    PROMO_POPUP_ENABLED ? getPopupData() : Promise.resolve(null),
    getCatalogNavigation(),
  ]);

  return (
    <div lang={lang} className="min-h-screen bg-white">
      <HeaderPreview language={lang as Language} categories={catalogNavigation} contacts={footerData} />
      <main>{children}</main>
      <FooterPreview language={lang as Language} contacts={footerData} />
      <FloatingContactsPreview language={lang as Language} contacts={footerData} />
      <CookieConsent language={lang as Language} />
      {PROMO_POPUP_ENABLED && popupData && (
        <PromoPopupPreview language={lang as Language} config={popupData} />
      )}
    </div>
  );
}
