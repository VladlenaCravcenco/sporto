'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Router, Routes, Route, createPath, type To } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from '../../src/app/contexts/LanguageContext';
import { Toaster } from '../../src/app/components/ui/sonner';
const About = dynamic(() => import('../../src/app/pages/About').then(module => module.About));
const Contacts = dynamic(() => import('../../src/app/pages/Contacts').then(module => module.Contacts));
const TurnkeySolutions = dynamic(() => import('../../src/app/pages/TurnkeySolutions').then(module => module.TurnkeySolutions));
const MaintenanceService = dynamic(() => import('../../src/app/pages/MaintenanceService').then(module => module.MaintenanceService));
const TermsOfCooperation = dynamic(() => import('../../src/app/pages/TermsOfCooperation').then(module => module.TermsOfCooperation));
const DeliveryTerms = dynamic(() => import('../../src/app/pages/DeliveryTerms').then(module => module.DeliveryTerms));
const PrivacyPolicy = dynamic(() => import('../../src/app/pages/PrivacyPolicy').then(module => module.PrivacyPolicy));
const OrderRequest = dynamic(() => import('./CheckoutContent'));
import type { Language } from './HeaderPreview';
import { PublicPageDataContext, type PublicPageInitialData } from '../../src/app/contexts/PublicPageData';

// Reuse page content only. The Next locale layout owns the site's header/footer.
// Navigate through Next's server routes, including the native catalog/products,
// instead of letting an embedded SPA take over the public site.
export function PublicContentPage({ language, pathname, search, initialData }: {
  language: Language; pathname: string; search: string; initialData: PublicPageInitialData;
}) {
  const router = useRouter();
  const navigator = useMemo(() => {
    const href = (to: To) => {
      const value = typeof to === 'string' ? to : createPath(to);
      if (/^(?:[a-z]+:|\/\/|#)/i.test(value)) return value;
      return /^\/(ro|ru)(?:\/|$)/.test(value) ? value : `/${language}${value.startsWith('/') ? '' : '/'}${value}`;
    };
    return {
      createHref: href,
      go: (delta: number) => window.history.go(delta),
      push: (to: To) => router.push(href(to)),
      replace: (to: To) => router.replace(href(to)),
    };
  }, [language, router]);

  return (
    <PublicPageDataContext.Provider value={initialData}><HelmetProvider>
      <LanguageProvider initialLanguage={language}>
          <Router location={{ pathname, search, hash: '', state: null, key: pathname }} navigator={navigator}>
            <Routes>
              <Route path="/about" element={<About />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/turnkey-solutions" element={<TurnkeySolutions />} />
              <Route path="/maintenance-service" element={<MaintenanceService />} />
              <Route path="/terms-of-cooperation" element={<TermsOfCooperation />} />
              <Route path="/delivery-terms" element={<DeliveryTerms />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/order-request" element={<OrderRequest />} />
            </Routes>
          </Router>
          <Toaster />
      </LanguageProvider>
    </HelmetProvider></PublicPageDataContext.Provider>
  );
}
