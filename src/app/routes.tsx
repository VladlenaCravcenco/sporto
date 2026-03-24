import { createBrowserRouter } from 'react-router';
import { Layout } from './Layout';
import { AdminLayout } from './AdminLayout';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { ProductDetail } from './pages/ProductDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { TurnkeySolutions } from './pages/TurnkeySolutions';
import { MaintenanceService } from './pages/MaintenanceService';
import { OrderRequest } from './pages/OrderRequest';
import { NotFound } from './pages/NotFound';
import { Account } from './pages/Account';
import { ForgotPassword } from './pages/ForgotPassword';
import { Contacts } from './pages/Contacts';
import { About } from './pages/About';
import { TermsOfCooperation } from './pages/TermsOfCooperation';
import { DeliveryTerms } from './pages/DeliveryTerms';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { BrandPage } from './pages/BrandPage';
import { EmailVerify } from './pages/EmailVerify';
import { AdminLogin } from './pages/AdminLogin';
import { AdminHub } from './pages/AdminHub';
import { AdminImport } from './pages/AdminImport';
import { AdminFeatured } from './pages/AdminFeatured';
import { AdminProducts } from './pages/AdminProducts';
import { AdminBanners } from './pages/AdminBanners';
import { AdminBrands } from './pages/AdminBrands';
import { AdminCategories } from './pages/AdminCategories';
import { AdminClients } from './pages/AdminClients';
import { AdminRequests } from './pages/AdminRequests';
import { AdminContacts } from './pages/AdminContacts';
import { AdminPopup } from './pages/AdminPopup';
import { AdminFaq } from './pages/AdminFaq';
import { AdminServices } from './pages/AdminServices';
import { AdminMaintenance } from './pages/AdminMaintenance';
import { AdminContentPages } from './pages/AdminContentPages';

export const router = createBrowserRouter([

  // ── Admin login — standalone, no site header ──────────────────────────────
  { path: '/admin/login', Component: AdminLogin },

  // ── Admin panel — own layout with persistent nav, guard inside ────────────
  {
    path: '/admin',
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminHub },
      { path: 'products', Component: AdminProducts },
      { path: 'brands', Component: AdminBrands },
      { path: 'categories', Component: AdminCategories },
      { path: 'featured', Component: AdminFeatured },
      { path: 'import', Component: AdminImport },
      { path: 'banners', Component: AdminBanners },
      { path: 'clients', Component: AdminClients },
      { path: 'requests', Component: AdminRequests },
      { path: 'contacts', Component: AdminContacts },
      { path: 'popup', Component: AdminPopup },
      { path: 'faq', Component: AdminFaq },
      { path: 'services', Component: AdminServices },
      { path: 'maintenance', Component: AdminMaintenance },
      { path: 'content-pages', Component: AdminContentPages },
    ],
  },

  // ── Main site ─────────────────────────────────────────────────────────────
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'catalog', Component: Catalog },
      { path: 'product/:id', Component: ProductDetail },
      { path: 'brands/:brandId', Component: BrandPage },
      { path: 'login', Component: Login },
      { path: 'register', Component: Register },
      { path: 'forgot-password', Component: ForgotPassword },
      { path: 'verify', Component: EmailVerify },
      { path: 'account', Component: Account },
      { path: 'turnkey-solutions', Component: TurnkeySolutions },
      { path: 'maintenance-service', Component: MaintenanceService },
      { path: 'order-request', Component: OrderRequest },
      { path: 'contacts', Component: Contacts },
      { path: 'about', Component: About },
      { path: 'terms-of-cooperation', Component: TermsOfCooperation },
      { path: 'delivery-terms', Component: DeliveryTerms },
      { path: 'privacy-policy', Component: PrivacyPolicy },
    ],
  },

  // ── Catch-all 404 — top-level so it never intercepts /admin/* ─────────────
  { path: '*', Component: NotFound },
]);
