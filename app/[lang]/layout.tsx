import { getCategoryIconData } from '../_lib/category-icon-data';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { validatePublicRoute } from '../_lib/public-route-preflight';
import { PageBreadcrumbs } from '../_components/PageBreadcrumbs';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { HeaderPreview, type Language } from '../_components/HeaderPreview';
import { FooterPreview } from '../_components/FooterPreview';
import { FloatingContactsPreview } from '../_components/FloatingContactsPreview';
import { CookieConsent } from '../_components/CookieConsent';
import { PromoPopupLoader } from '../_components/PromoPopupLoader';
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
  const requestHeaders = await headers();
  await validatePublicRoute(requestHeaders.get('x-sporto-pathname') || '', requestHeaders.get('x-sporto-search') || '', lang as Language);
  const consentValue = (await cookies()).get('sporto_cookie_consent')?.value;
  const initialConsent = consentValue === 'accepted' || consentValue === 'declined' ? consentValue : null;
  const [footerData, popupData, catalogNavigation] = await Promise.all([
    getFooterData(),
    PROMO_POPUP_ENABLED ? getPopupData() : Promise.resolve(null),
    getCatalogNavigation(),
  ]);

  return (
    <div lang={lang} className="min-h-screen bg-[#f5f6f7]">
      <HeaderPreview language={lang as Language} categories={catalogNavigation} contacts={footerData} categoryIcons={getCategoryIconData(catalogNavigation)} />
      <main className="min-h-[100svh]"><Suspense fallback={null}><PageBreadcrumbs categories={catalogNavigation} /></Suspense>{children}</main>
      <FooterPreview language={lang as Language} contacts={footerData} />
      <FloatingContactsPreview language={lang as Language} contacts={footerData} />
      <CookieConsent language={lang as Language} initialConsent={initialConsent} />
      {PROMO_POPUP_ENABLED && popupData && (
        <PromoPopupLoader language={lang as Language} config={popupData} />
      )}
    </div>
  );
}
