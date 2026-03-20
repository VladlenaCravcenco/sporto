import { Outlet, ScrollRestoration } from 'react-router';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Toaster } from './components/ui/sonner';
import { FloatingContacts } from './components/FloatingContacts';
import { CookieBanner } from './components/CookieBanner';
import { PromoPopup } from './components/PromoPopup';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollRestoration />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toaster />
      <FloatingContacts />
      <CookieBanner />
      <PromoPopup />
    </div>
  );
}