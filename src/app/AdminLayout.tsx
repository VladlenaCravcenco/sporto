import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { logoutAdmin } from '../lib/adminAuth';
import {
  Package, Star, Upload, LogOut, ExternalLink,
  LayoutDashboard, Layers, Bookmark, Users, ShoppingCart,
  Tag, Bell, X, Phone, Megaphone, HelpCircle, Wrench, FileText, Settings, Menu, Sun, Moon,
} from 'lucide-react';
import { useAdminNotifications } from './hooks/useAdminNotifications';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { AdminLangProvider, useAdminLang } from './contexts/AdminLangContext';
import { SeoHead } from './components/SeoHead';
import './admin.css';
import { useAdminTheme, setAdminTheme } from './contexts/adminTheme';

function AdminLayoutInner() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const { unreadCount, latestRequest, clearUnread } = useAdminNotifications();
  const { lang, setLang, t } = useAdminLang();
  const theme = useAdminTheme();
  const menuRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // ── Navigation groups ───────────────────────────────────────────────────────
  const GROUPS = [
    {
      key: 'clients',
      label: t.hub.tabClients,
      icon: <Users className="w-[18px] h-[18px]" />,
      firstRoute: '/admin/requests',
      items: [
        { to: '/admin/requests',   label: t.nav.requests,  icon: <ShoppingCart className="w-4 h-4" />, badge: unreadCount },
        { to: '/admin/clients',    label: t.nav.clients,   icon: <Users        className="w-4 h-4" /> },
      ],
    },
    {
      key: 'products',
      label: t.hub.tabProducts,
      icon: <Package className="w-[18px] h-[18px]" />,
      firstRoute: '/admin/products',
      items: [
        { to: '/admin/products',   label: t.nav.products,   icon: <Package  className="w-4 h-4" /> },
        { to: '/admin/brands',     label: t.nav.brands,     icon: <Bookmark className="w-4 h-4" /> },
        { to: '/admin/categories', label: t.nav.categories, icon: <Tag      className="w-4 h-4" /> },
        { to: '/admin/attributes', label: lang === 'ru' ? 'Характеристики' : 'Caracteristici', icon: <Settings className="w-4 h-4" /> },
        { to: '/admin/featured',   label: t.nav.featured,   icon: <Star     className="w-4 h-4" /> },
        { to: '/admin/import',     label: t.nav.import,     icon: <Upload   className="w-4 h-4" /> },
      ],
    },
    {
      key: 'content',
      label: t.hub.tabContent,
      icon: <Layers className="w-[18px] h-[18px]" />,
      firstRoute: '/admin/banners',
      items: [
        { to: '/admin/banners',       label: t.nav.banners,                        icon: <Layers      className="w-4 h-4" /> },
        { to: '/admin/contacts',      label: t.hub.contactsTitle,                  icon: <Phone       className="w-4 h-4" /> },
        { to: '/admin/popup',         label: t.hub.popupTitle,                     icon: <Megaphone   className="w-4 h-4" /> },
        { to: '/admin/faq',           label: 'FAQ',                                icon: <HelpCircle  className="w-4 h-4" /> },
        { to: '/admin/services',      label: t.hub.servicesTitle,                  icon: <Wrench      className="w-4 h-4" /> },
        { to: '/admin/maintenance',   label: t.hub.maintenanceTitle,               icon: <Settings    className="w-4 h-4" /> },
        { to: '/admin/content-pages', label: t.hub.contentPagesTitle,              icon: <FileText    className="w-4 h-4" /> },
      ],
    },
  ];

  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(`${to}/`);
  const currentItem = GROUPS.flatMap(group => group.items).find(item => isActive(item.to));
  const closeMenu = () => menuRef.current?.close();
  useEffect(() => { menuRef.current?.close(); }, [location.pathname]);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => { if (media.matches) menuRef.current?.close(); };
    media.addEventListener('change', closeOnDesktop);
    return () => media.removeEventListener('change', closeOnDesktop);
  }, []);

  // New request toast
  useEffect(() => {
    if (!latestRequest) return;
    const amount = latestRequest.total_price
      ? ` · ${latestRequest.total_price.toLocaleString('ru-RU')} MDL`
      : '';
    const msg = lang === 'ru'
      ? `📦 Новая заявка: ${latestRequest.client_name}${amount}`
      : `📦 Cerere nouă: ${latestRequest.client_name}${amount}`;
    toast(msg, {
      duration: 8000,
      action: {
        label: lang === 'ru' ? 'Открыть' : 'Deschide',
        onClick: () => { navigate('/admin/requests'); clearUnread(); },
      },
    });
  }, [latestRequest]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setAuthed(true);
      else navigate('/admin/login', { replace: true });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setAuthed(false); navigate('/admin/login', { replace: true }); }
      else setAuthed(true);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await logoutAdmin();
    navigate('/admin/login', { replace: true });
  };

  if (authed === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-4 h-4 border border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }
  if (!authed) return null;

  const navigation = <>
    <Link to="/admin" className={`admin-nav-link ${location.pathname === '/admin' ? 'is-active' : ''}`} aria-current={location.pathname === '/admin' ? 'page' : undefined} onClick={closeMenu}>
      <LayoutDashboard size={16} /><span>{t.nav.dashboard}</span>
    </Link>
    {GROUPS.map(group => <section className="admin-nav-group" key={group.key}>
      <h2>{group.label}</h2>
      {group.items.map(item => <Link key={item.to} to={item.to} className={`admin-nav-link ${isActive(item.to) ? 'is-active' : ''}`} aria-current={isActive(item.to) ? 'page' : undefined} onClick={closeMenu}>
        {item.icon}<span>{item.label}</span>
        {'badge' in item && typeof item.badge === 'number' && item.badge > 0 && <span className="admin-count">{item.badge > 99 ? '99+' : item.badge}</span>}
      </Link>)}
    </section>)}
  </>;

  return <>
    <SeoHead title="Admin | Sporto" canonical="/admin" noIndex />
    <div className="admin-shell" data-admin-theme={theme}>
      <a href="#admin-main" className="admin-skip">{lang === 'ru' ? 'К содержимому' : 'La conținut'}</a>
      <aside className="admin-sidebar">
        <Link to="/admin" className="admin-brand">SPORTO<span>admin</span></Link>
        <nav className="admin-navigation" aria-label={lang === 'ru' ? 'Разделы админки' : 'Secțiuni administrare'}>{navigation}</nav>
        <button className="admin-logout" onClick={handleLogout}><LogOut size={16} />{t.nav.logout}</button>
      </aside>
      <div className="admin-workarea">
        <header className="admin-topbar">
          <button ref={menuButtonRef} className="admin-icon-button admin-menu-trigger" aria-label={lang === 'ru' ? 'Открыть меню' : 'Deschide meniul'} aria-haspopup="dialog" onClick={() => menuRef.current?.showModal()}><Menu size={20} /></button>
          <div className="admin-breadcrumb"><span>SPORTO</span><span aria-hidden="true">/</span><strong>{currentItem?.label || t.nav.dashboard}</strong></div>
          <div className="admin-topbar-actions">
            <div className="admin-theme-switch" role="group" aria-label={lang === 'ru' ? 'Тема интерфейса' : 'Tema interfeței'}>
              <button type="button" aria-pressed={theme === 'light'} onClick={() => setAdminTheme('light')} title={lang === 'ru' ? 'Светлая тема' : 'Temă luminoasă'}><Sun size={16} /><span>{lang === 'ru' ? 'Светлая' : 'Luminoasă'}</span></button>
              <button type="button" aria-pressed={theme === 'dark'} onClick={() => setAdminTheme('dark')} title={lang === 'ru' ? 'Тёмная тема' : 'Temă întunecată'}><Moon size={16} /><span>{lang === 'ru' ? 'Тёмная' : 'Întunecată'}</span></button>
            </div>
            <div className="admin-language" role="group" aria-label={lang === 'ru' ? 'Язык интерфейса' : 'Limba interfeței'}>
              {(['ru', 'ro'] as const).map(value => <button key={value} aria-pressed={lang === value} onClick={() => setLang(value)}>{value.toUpperCase()}</button>)}
            </div>
            <Link to="/admin/requests" onClick={clearUnread} className="admin-icon-button admin-bell" aria-label={`${t.nav.requests}${unreadCount ? ` (${unreadCount})` : ''}`} title={t.nav.requests}><Bell size={17} />{unreadCount > 0 && <span className="admin-notification-dot" />}</Link>
            <a href="/" target="_blank" rel="noopener noreferrer" className="admin-site-link" title={t.nav.site}><ExternalLink size={15} /><span>{t.nav.site}</span></a>
          </div>
        </header>
        <main id="admin-main" tabIndex={-1} className="admin-content"><Outlet /></main>
      </div>
      <dialog ref={menuRef} className="admin-mobile-menu" aria-label={lang === 'ru' ? 'Меню админки' : 'Meniu administrare'} onClick={event => { if (event.target === event.currentTarget) closeMenu(); }} onClose={() => menuButtonRef.current?.focus()}>
        <div className="admin-mobile-menu-inner">
          <div className="admin-mobile-menu-heading"><span className="admin-brand">SPORTO<span>admin</span></span><button autoFocus className="admin-icon-button" onClick={closeMenu} aria-label={lang === 'ru' ? 'Закрыть меню' : 'Închide meniul'}><X size={20} /></button></div>
          <nav className="admin-navigation" aria-label={lang === 'ru' ? 'Разделы админки' : 'Secțiuni administrare'}>{navigation}</nav>
          <button className="admin-logout" onClick={handleLogout}><LogOut size={16} />{t.nav.logout}</button>
        </div>
      </dialog>
      <Toaster position="bottom-right" theme={theme} />
    </div>
  </>;
}

export function AdminLayout() {
  return <AdminLangProvider><AdminLayoutInner /></AdminLangProvider>;
}
