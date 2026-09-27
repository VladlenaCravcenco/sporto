'use client';

import { useMemo } from 'react';
import { Router, Routes, Route, createPath, type To } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from '../../src/app/contexts/LanguageContext';
import { AuthProvider } from '../../src/app/contexts/AuthContext';
import { CartProvider } from '../../src/app/contexts/CartContext';
import { CategoriesProvider } from '../../src/app/contexts/CategoriesContext';
import { Toaster } from '../../src/app/components/ui/sonner';
import { About } from '../../src/app/pages/About';
import { Contacts } from '../../src/app/pages/Contacts';
import { TurnkeySolutions } from '../../src/app/pages/TurnkeySolutions';
import { MaintenanceService } from '../../src/app/pages/MaintenanceService';
import { TermsOfCooperation } from '../../src/app/pages/TermsOfCooperation';
import { DeliveryTerms } from '../../src/app/pages/DeliveryTerms';
import { PrivacyPolicy } from '../../src/app/pages/PrivacyPolicy';
import { BrandPage } from '../../src/app/pages/BrandPage';
import { OrderRequest } from '../../src/app/pages/OrderRequest';
import type { Language } from './HeaderPreview';

// Reuse page content only. The Next locale layout owns the site's header/footer.
// Navigate through Next's server routes, including the native catalog/products,
// instead of letting an embedded SPA take over the public site.
export function PublicContentPage({ language, pathname, search }: {
  language: Language; pathname: string; search: string;
}) {
  const navigator = useMemo(() => {
    const href = (to: To) => {
      const value = typeof to === 'string' ? to : createPath(to);
      if (/^(?:[a-z]+:|\/\/|#)/i.test(value)) return value;
      return /^\/(ro|ru)(?:\/|$)/.test(value) ? value : `/${language}${value.startsWith('/') ? '' : '/'}${value}`;
    };
    return {
      createHref: href,
      go: (delta: number) => window.history.go(delta),
      push: (to: To) => window.location.assign(href(to)),
      replace: (to: To) => window.location.replace(href(to)),
    };
  }, [language]);

  return (
    <HelmetProvider>
      <LanguageProvider initialLanguage={language}>
        <AuthProvider><CartProvider><CategoriesProvider>
          <Router location={{ pathname, search, hash: '', state: null, key: pathname }} navigator={navigator}>
            <Routes>
              <Route path="/about" element={<About />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/turnkey-solutions" element={<TurnkeySolutions />} />
              <Route path="/maintenance-service" element={<MaintenanceService />} />
              <Route path="/terms-of-cooperation" element={<TermsOfCooperation />} />
              <Route path="/delivery-terms" element={<DeliveryTerms />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/brands/:brandId" element={<BrandPage />} />
              <Route path="/order-request" element={<OrderRequest />} />
            </Routes>
          </Router>
          <Toaster />
        </CategoriesProvider></CartProvider></AuthProvider>
      </LanguageProvider>
    </HelmetProvider>
  );
}
