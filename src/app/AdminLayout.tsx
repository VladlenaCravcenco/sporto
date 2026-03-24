import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { logoutAdmin } from '../lib/adminAuth';
import {
  Package, Star, Upload, LogOut, ExternalLink,
  LayoutDashboard, Layers, Bookmark, Users, ShoppingCart,
  Tag, Bell, Globe, ChevronDown, Phone, Megaphone, HelpCircle, Wrench, FileText, Settings,
} from 'lucide-react';
import { useAdminNotifications } from './hooks/useAdminNotifications';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { AdminLangProvider, useAdminLang } from './contexts/AdminLangContext';

function AdminLayoutInner() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const { unreadCount, latestRequest, clearUnread } = useAdminNotifications();
  const { lang, setLang, t } = useAdminLang();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

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

  const isGroupActive = (g: typeof GROUPS[number]) =>
    g.items.some(i => location.pathname.startsWith(i.to));

  const isActive = (to: string) => location.pathname.startsWith(to);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close dropdown on route change
  useEffect(() => { setOpenGroup(null); }, [location.pathname]);

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-4 h-4 border border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }
  if (!authed) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── TOP NAV ─────────────────────────────────────────────────────────── */}
      <nav ref={navRef} className="bg-black text-white sticky top-0 z-50 flex-shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center h-12 gap-1">

            {/* Brand */}
            <Link to="/admin" className="flex items-center gap-2 mr-3 flex-shrink-0">
              <span className="text-xs tracking-[0.15em] text-white">SPORTOSFERA</span>
              <span className="text-[9px] uppercase tracking-widest bg-white/15 text-white/70 px-1.5 py-0.5">
                ADMIN
              </span>
            </Link>

            <div className="hidden lg:block w-px h-4 bg-white/15 mr-2 flex-shrink-0" />

            {/* ── Desktop: Dashboard + 3 groups ── */}
            <div className="hidden lg:flex items-center gap-0.5 flex-1">

              {/* Dashboard */}
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 px-3 h-12 text-xs transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
                  location.pathname === '/admin'
                    ? 'text-white border-white'
                    : 'text-white/50 border-transparent hover:text-white/80 hover:border-white/30'
                }`}
              >
                <LayoutDashboard className="w-[18px] h-[18px]" />
                <span>{t.nav.dashboard}</span>
              </Link>

              {/* Group dropdowns */}
              {GROUPS.map(group => {
                const active = isGroupActive(group);
                const open   = openGroup === group.key;
                return (
                  <div key={group.key} className="relative flex-shrink-0">
                    <button
                      onClick={() => setOpenGroup(open ? null : group.key)}
                      className={`flex items-center gap-1.5 px-3 h-12 text-xs transition-colors border-b-2 whitespace-nowrap ${
                        active || open
                          ? 'text-white border-white'
                          : 'text-white/50 border-transparent hover:text-white/80 hover:border-white/30'
                      }`}
                    >
                      {group.icon}
                      <span>{group.label}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
                      {/* Badge on Clients group */}
                      {group.key === 'clients' && unreadCount > 0 && (
                        <span className="min-w-[16px] h-4 bg-red-500 text-white text-[9px] flex items-center justify-center px-1 rounded-full font-medium leading-none">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Dropdown */}
                    {open && (
                      <div className="absolute top-full left-0 mt-0 bg-gray-950 border border-white/15 shadow-2xl min-w-[180px] py-1 z-50">
                        {group.items.map(item => (
                          <Link
                            key={item.to}
                            to={item.to}
                            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs transition-colors ${
                              isActive(item.to)
                                ? 'text-white bg-white/10'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                            {'badge' in item && (item as any).badge > 0 && (
                              <span className="ml-auto min-w-[16px] h-4 bg-red-500 text-white text-[9px] flex items-center justify-center px-1 rounded-full font-medium leading-none">
                                {(item as any).badge > 9 ? '9+' : (item as any).badge}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Mobile spacer ── */}
            <div className="flex-1 lg:hidden" />

            {/* ── Right side ── */}
            <div className="flex items-center gap-0.5 flex-shrink-0">

              {/* Language switcher */}
              <div className="flex items-center border border-white/20 overflow-hidden mr-1">
                <button
                  onClick={() => setLang('ru')}
                  className={`px-2 h-7 text-[10px] uppercase tracking-widest transition-colors ${
                    lang === 'ru' ? 'bg-white text-black' : 'text-white/50 hover:text-white'
                  }`}
                >
                  RU
                </button>
                <div className="w-px h-4 bg-white/20" />
                <button
                  onClick={() => setLang('ro')}
                  className={`px-2 h-7 text-[10px] uppercase tracking-widest transition-colors ${
                    lang === 'ro' ? 'bg-white text-black' : 'text-white/50 hover:text-white'
                  }`}
                >
                  RO
                </button>
              </div>

              {/* Bell */}
              <Link
                to="/admin/requests"
                onClick={clearUnread}
                className="relative flex items-center justify-center w-9 h-12 text-white/40 hover:text-white transition-colors"
                title={t.nav.requests}
              >
                <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-white' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] flex items-center justify-center px-1 rounded-full font-medium leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Site — desktop only */}
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-1.5 px-3 h-12 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{t.nav.site}</span>
              </a>

              {/* Logout — desktop only */}
              <button
                onClick={handleLogout}
                className="hidden lg:flex items-center gap-1.5 px-3 h-12 text-xs text-white/40 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.nav.logout}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── PAGE CONTENT ─────────────────────────────────────────────────────── */}
      <div className="flex-1 pb-16 lg:pb-0">
        <Outlet />
      </div>

      {/* ── MOBILE BOTTOM TAB BAR ─────────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-black border-t border-white/10">
        <div className="flex items-stretch h-14">

          {/* Dashboard */}
          <Link
            to="/admin"
            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              location.pathname === '/admin' ? 'text-white' : 'text-white/35 active:text-white/70'
            }`}
          >
            {location.pathname === '/admin' && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-white" />
            )}
            <LayoutDashboard className="w-[18px] h-[18px]" />
            <span className="text-[9px] tracking-wide leading-none">{t.nav.dashboard}</span>
          </Link>

          {/* 3 groups */}
          {GROUPS.map(group => {
            const active = isGroupActive(group);
            return (
              <Link
                key={group.key}
                to={group.firstRoute}
                className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? 'text-white' : 'text-white/35 active:text-white/70'
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-white" />
                )}
                <span className="relative">
                  {group.icon}
                  {group.key === 'clients' && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[14px] h-3.5 bg-red-500 text-white text-[8px] flex items-center justify-center px-0.5 rounded-full font-medium leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
                <span className="text-[9px] tracking-wide leading-none">{group.label}</span>
              </Link>
            );
          })}

          {/* Logout on mobile */}
          <button
            onClick={handleLogout}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-white/35 active:text-red-400 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span className="text-[9px] tracking-wide leading-none">{t.nav.logout}</span>
          </button>

        </div>
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
}

export function AdminLayout() {
  return (
    <AdminLangProvider>
      <AdminLayoutInner />
    </AdminLangProvider>
  );
}