'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Router, Routes, Route, createPath, type To } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { CategoriesProvider } from '@/src/app/contexts/CategoriesContext';
import { AdminLayout } from '@/src/app/AdminLayout';
const AdminHub = dynamic(() => import('@/src/app/pages/AdminHub').then(m => m.AdminHub), { loading: () => <p className="p-8" role="status">Загрузка…</p> });
const AdminProducts = dynamic(() => import('@/src/app/pages/AdminProducts').then(m => m.AdminProducts), { loading: () => <p className="p-8" role="status">Загрузка…</p> });
const AdminBrands = dynamic(() => import('@/src/app/pages/AdminBrands').then(m => m.AdminBrands), { loading: () => <p className="p-8" role="status">Загрузка…</p> });
const AdminCategories = dynamic(() => import('@/src/app/pages/AdminCategories').then(m => m.AdminCategories), { loading: () => <p className="p-8" role="status">Загрузка…</p> });
const AdminAttributes = dynamic(() => import('@/src/app/pages/AdminAttributes').then(m => m.AdminAttributes), { loading: () => <p className="p-8" role="status">Загрузка…</p> });
const AdminFeatured = dynamic(() => import('@/src/app/pages/AdminFeatured').then(m => m.AdminFeatured), { loading: () => <p className="p-8" role="status">Загрузка…</p> });
const AdminImport = dynamic(() => import('@/src/app/pages/AdminImport').then(m => m.AdminImport), { loading: () => <p className="p-8" role="status">Загрузка…</p> });
const AdminRequests = dynamic(() => import('@/src/app/pages/AdminRequests').then(m => m.AdminRequests), { loading: () => <p className="p-8" role="status">Загрузка…</p> });
const AdminClients = dynamic(() => import('@/src/app/pages/AdminClients').then(m => m.AdminClients), { loading: () => <p className="p-8" role="status">Загрузка…</p> });
const AdminBanners = dynamic(() => import('@/src/app/pages/AdminBanners').then(m => m.AdminBanners), { loading: () => <p className="p-8" role="status">Загрузка…</p> });
const AdminContacts = dynamic(() => import('@/src/app/pages/AdminContacts').then(m => m.AdminContacts), { loading: () => <p className="p-8" role="status">Загрузка…</p> });
const AdminPopup = dynamic(() => import('@/src/app/pages/AdminPopup').then(m => m.AdminPopup), { loading: () => <p className="p-8" role="status">Загрузка…</p> });
const AdminFaq = dynamic(() => import('@/src/app/pages/AdminFaq').then(m => m.AdminFaq), { loading: () => <p className="p-8" role="status">Загрузка…</p> });
const AdminServices = dynamic(() => import('@/src/app/pages/AdminServices').then(m => m.AdminServices), { loading: () => <p className="p-8" role="status">Загрузка…</p> });
const AdminMaintenance = dynamic(() => import('@/src/app/pages/AdminMaintenance').then(m => m.AdminMaintenance), { loading: () => <p className="p-8" role="status">Загрузка…</p> });
const AdminContentPages = dynamic(() => import('@/src/app/pages/AdminContentPages').then(m => m.AdminContentPages), { loading: () => <p className="p-8" role="status">Загрузка…</p> });
const AdminEmailSetup = dynamic(() => import('@/src/app/pages/AdminEmailSetup').then(m => m.AdminEmailSetup), { loading: () => <p className="p-8" role="status">Загрузка…</p> });

export default function AdminWorkspace() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const router = useRouter();
  const navigator = useMemo(() => {
    const href = (to: To) => {
      const value = typeof to === 'string' ? to : createPath(to);
      if (/^(?:[a-z]+:|\/\/|#)/i.test(value)) return value;
      if (/^\/(?:admin|ro|ru)(?:[/?#]|$)/.test(value)) return value;
      return `/ro${value.startsWith('/') ? '' : '/'}${value}`;
    };
    return {
      createHref: href,
      go: (delta: number) => window.history.go(delta),
      push: (to: To) => router.push(href(to)),
      replace: (to: To) => router.replace(href(to)),
    };
  }, [router]);
  return <HelmetProvider><CategoriesProvider>
    <Router location={{ pathname, search: search ? `?${search}` : '', hash: '', state: null, key: pathname }} navigator={navigator}>
      <Routes><Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminHub />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="brands" element={<AdminBrands />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="attributes" element={<AdminAttributes />} />
        <Route path="featured" element={<AdminFeatured />} />
        <Route path="import" element={<AdminImport />} />
        <Route path="requests" element={<AdminRequests />} />
        <Route path="clients" element={<AdminClients />} />
        <Route path="banners" element={<AdminBanners />} />
        <Route path="contacts" element={<AdminContacts />} />
        <Route path="popup" element={<AdminPopup />} />
        <Route path="faq" element={<AdminFaq />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="maintenance" element={<AdminMaintenance />} />
        <Route path="content-pages" element={<AdminContentPages />} />
        <Route path="email-setup" element={<AdminEmailSetup />} />
      </Route></Routes>
    </Router>
  </CategoriesProvider></HelmetProvider>;
}
