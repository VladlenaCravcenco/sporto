import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Menu, X, User, LogOut, ShoppingCart, Search, ChevronDown, ChevronRight, ChevronLeft, Phone, ArrowRight, Activity, Dumbbell, Weight, PersonStanding, Trophy, Medal, Swords, Waves, Puzzle, TreePine, School } from 'lucide-react';
import { Logo } from './Logo';
import { useCategories } from '../contexts/CategoriesContext';
import { SearchDropdown, VoiceSearchButton } from './SearchDropdown';
import { addToHistory } from '../../lib/searchEngine';
import { useContacts } from '../hooks/useContacts';
import { supabase, type ProductRow } from '../../lib/supabase';
import { rowToProduct } from '../hooks/useSupabaseProducts';
import { buildProductPath } from '../lib/product-url';
import type { Product } from '../data/products';
import { getCategoryIcon } from '../lib/category-icons';

type Lang = 'ro' | 'ru';

const categoryFallbackIcons: Record<string, React.ReactNode> = {
  'aparate-cardio': <Activity className="w-4 h-4" />,
  'aparate-forta': <Dumbbell className="w-4 h-4" />,
  greutati: <Weight className="w-4 h-4" />,
  'fitness-yoga': <PersonStanding className="w-4 h-4" />,
  'sporturi-colective': <Trophy className="w-4 h-4" />,
  'sporturi-individuale': <Medal className="w-4 h-4" />,
  'arte-martiale': <Swords className="w-4 h-4" />,
  inot: <Waves className="w-4 h-4" />,
  'tenis-masa': <Trophy className="w-4 h-4" />,
  jocuri: <Puzzle className="w-4 h-4" />,
  'forta-exterior': <TreePine className="w-4 h-4" />,
  'inventar-institutii': <School className="w-4 h-4" />,
};

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const categories = useCategories();
  const CONTACTS = useContacts(); 

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [hoveredCatId, setHoveredCatId] = useState<string>(categories[0].id);
  const [hoveredSubId, setHoveredSubId] = useState<string>(categories[0].subcategories[0]?.id ?? '');
  const [menuProducts, setMenuProducts] = useState<Product[]>([]);
  const [menuProductsLoading, setMenuProductsLoading] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  // Mobile multi-level menu
  const [menuLevel, setMenuLevel] = useState(0);
  const [selectedMobileCat, setSelectedMobileCat] = useState<typeof categories[0] | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const desktopBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const showDropdown = searchOpen;
  const showMobileDropdown = mobileSearchOpen;
  const homePath = language === 'ru' ? '/ru' : '/';

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    setCatalogOpen(false);
    closeMobileMenu();
  }, [location.pathname]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMenuLevel(0);
    setSelectedMobileCat(null);
  };

  // Keep the page behind open navigation panels fixed. The mega-menu columns
  // have their own scroll containers, so the wheel remains useful inside it.
  useEffect(() => {
    if (mobileMenuOpen || catalogOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [mobileMenuOpen, catalogOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addToHistory(searchQuery.trim());
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleFocus = () => {
    if (desktopBlurTimer.current) clearTimeout(desktopBlurTimer.current);
    setSearchOpen(true);
  };

  const handleBlur = () => {
    desktopBlurTimer.current = setTimeout(() => setSearchOpen(false), 150);
  };

  const handleSearchClick = () => {
    if (desktopBlurTimer.current) clearTimeout(desktopBlurTimer.current);
    setSearchOpen(true);
  };

  const handleMobileFocus = () => {
    if (mobileBlurTimer.current) clearTimeout(mobileBlurTimer.current);
    setMobileSearchOpen(true);
  };

  const handleMobileBlur = () => {
    mobileBlurTimer.current = setTimeout(() => setMobileSearchOpen(false), 150);
  };

  const handleMobileClick = () => {
    if (mobileBlurTimer.current) clearTimeout(mobileBlurTimer.current);
    setMobileSearchOpen(true);
  };

  const handleSelect = () => {
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
  };

  const openDropdown = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setCatalogOpen(true);
  }, []);

  const closeDropdown = useCallback(() => {
    closeTimer.current = setTimeout(() => setCatalogOpen(false), 120);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const activeCat = categories.find(c => c.id === hoveredCatId) ?? categories[0];
  const activeSub = activeCat.subcategories.find(sub => sub.id === hoveredSubId) ?? activeCat.subcategories[0];

  useEffect(() => {
    if (!catalogOpen || !activeSub) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setMenuProductsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .eq('category', activeCat.id)
        .eq('subcategory', activeSub.id)
        .order('featured', { ascending: false })
        .limit(60);

      if (cancelled) return;
      setMenuProducts(error ? [] : ((data ?? []) as ProductRow[]).map(rowToProduct));
      setMenuProductsLoading(false);
    }, 100);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [catalogOpen, activeCat.id, activeSub?.id]);

  const selectDesktopCategory = (category: typeof categories[0]) => {
    setHoveredCatId(category.id);
    setHoveredSubId(category.subcategories[0]?.id ?? '');
    setMenuProducts([]);
  };

  const navLinks = [
    { path: '/about', label: t('nav.about') },
    { path: '/turnkey-solutions', label: t('nav.turnkey') },
    { path: '/maintenance-service', label: t('nav.maintenance') },
    { path: '/contacts', label: language === 'ro' ? 'Contact' : 'Контакты' },
  ];

  return (
    <header ref={headerRef} className="bg-white sticky top-0 z-50 shadow-[0_1px_0_0_#f3f4f6] flex flex-col md:flex-col-reverse">

      {/* ── Mobile backdrop overlay ── */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={closeMobileMenu}
        />
      )}

      {/* ── ROW 1: Logo · Search · Actions ── */}
      <div className="border-b border-gray-100">
        <div className="max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center h-12 md:h-16 gap-2 md:gap-6">

            {/* Logo */}
            <Link to={homePath} className="flex items-center flex-shrink-0">
              <Logo className="h-5 md:h-8 w-auto" color="#111111" />
            </Link>

            <div
              className="hidden md:block relative"
              onMouseEnter={openDropdown}
              onMouseLeave={closeDropdown}
            >
              <button
                type="button"
                onClick={() => setCatalogOpen(open => !open)}
                className="h-9 px-5 bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 text-xs uppercase tracking-wider transition-colors"
              >
                {t('nav.catalog')}
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${catalogOpen ? 'rotate-180' : ''}`} />
              </button>

              {catalogOpen && (
                <div
                  className="absolute top-9 left-0 flex min-h-0 bg-white border border-gray-100 shadow-2xl z-50 overflow-hidden"
                  style={{ width: 'min(1120px, calc(100vw - 2rem))', height: 'min(680px, calc(100vh - 110px))' }}
                  onMouseEnter={cancelClose}
                  onMouseLeave={closeDropdown}
                >
                  <div className="w-[250px] min-h-0 flex-shrink-0 border-r border-gray-100 py-1 overflow-y-auto overscroll-contain">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                          hoveredCatId === cat.id ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onMouseEnter={() => selectDesktopCategory(cat)}
                        onClick={() => { navigate(`/catalog?category=${cat.id}`); setCatalogOpen(false); }}
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span className={`w-5 flex items-center justify-center flex-shrink-0 ${hoveredCatId === cat.id ? 'text-white' : 'text-gray-400'}`}>
                            {getCategoryIcon(cat.icon) ?? categoryFallbackIcons[cat.id] ?? <Dumbbell className="w-4 h-4" />}
                          </span>
                          <span className="text-xs tracking-wide truncate">{cat.name[language as Lang]}</span>
                        </span>
                        <ChevronRight className={`w-3 h-3 flex-shrink-0 ${hoveredCatId === cat.id ? 'text-gray-400' : 'text-gray-300'}`} />
                      </button>
                    ))}
                    <div className="border-t border-gray-100 mt-1">
                      <Link to="/catalog" className="flex items-center px-4 py-2.5 text-xs text-gray-400 hover:text-black tracking-wide transition-colors" onClick={() => setCatalogOpen(false)}>
                        {language === 'ro' ? '← Toate produsele' : '← Все товары'}
                      </Link>
                    </div>
                  </div>
                  <div className="w-[285px] min-h-0 flex-shrink-0 border-r border-gray-100 py-3 px-3 overflow-y-auto overscroll-contain">
                    <div className="px-2 pb-2 mb-1 border-b border-gray-100">
                      <span className="text-xs text-gray-400 uppercase tracking-[0.15em]">{activeCat.name[language as Lang]}</span>
                    </div>
                    <div>
                      {activeCat.subcategories.map(sub => (
                        <button
                          key={sub.id}
                          type="button"
                          onMouseEnter={() => { setHoveredSubId(sub.id); setMenuProducts([]); }}
                          onClick={() => { navigate(`/catalog?category=${activeCat.id}&subcategory=${sub.id}`); setCatalogOpen(false); }}
                          className={`w-full flex items-center justify-between gap-3 px-2 py-2.5 text-left text-xs transition-colors ${activeSub?.id === sub.id ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50 hover:text-black'}`}
                        >
                          <span>{sub.name[language as Lang]}</span>
                          <ChevronRight className="w-3 h-3 flex-shrink-0 text-gray-300" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 min-h-0 py-3 px-4 bg-[#f5f6f7] overflow-y-auto overscroll-contain">
                    <div className="flex items-center justify-between gap-4 pb-2 mb-3 border-b border-gray-200">
                      <span className="text-xs text-gray-400 uppercase tracking-[0.15em] line-clamp-1">
                        {activeSub?.name[language as Lang]}
                      </span>
                      {activeSub && (
                        <Link
                          to={`/catalog?category=${activeCat.id}&subcategory=${activeSub.id}`}
                          onClick={() => setCatalogOpen(false)}
                          className="text-[10px] text-gray-400 hover:text-black uppercase tracking-wider whitespace-nowrap transition-colors"
                        >
                          {language === 'ro' ? 'Vezi toate' : 'Смотреть все'}
                        </Link>
                      )}
                    </div>

                    {menuProductsLoading ? (
                      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                        {Array.from({ length: 12 }).map((_, index) => (
                          <div key={index} className="animate-pulse bg-white p-2">
                            <div className="aspect-square bg-gray-50" />
                            <div className="h-2 bg-gray-100 mt-2 w-4/5" />
                          </div>
                        ))}
                      </div>
                    ) : menuProducts.length > 0 ? (
                      <div className="grid grid-cols-2 xl:grid-cols-4 gap-x-3 gap-y-5">
                        {menuProducts.map(product => (
                          <Link
                            key={product.id}
                            to={buildProductPath(product, language as Lang)}
                            onClick={() => setCatalogOpen(false)}
                            className="group/product min-w-0 bg-white p-2"
                          >
                            <div className="aspect-square bg-white overflow-hidden flex items-center justify-center">
                              {product.image ? (
                                <img src={product.image} alt={product.name[language as Lang]} className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover/product:scale-105" loading="lazy" />
                              ) : (
                                <span className="text-[10px] text-gray-300 uppercase tracking-wider">Sporto</span>
                              )}
                            </div>
                            <div className="mt-2 text-[11px] leading-snug text-gray-700 group-hover/product:text-black line-clamp-2 transition-colors">
                              {product.name[language as Lang]}
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center px-6">
                        <span className="text-xs text-gray-400">
                          {language === 'ro' ? 'Produsele vor apărea în curând' : 'Товары скоро появятся'}
                        </span>
                        {activeSub && (
                          <Link to={`/catalog?category=${activeCat.id}&subcategory=${activeSub.id}`} onClick={() => setCatalogOpen(false)} className="mt-3 text-[10px] uppercase tracking-wider text-black border-b border-black pb-0.5">
                            {language === 'ro' ? 'Deschide categoria' : 'Открыть категорию'}
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Search — desktop */}
            <div className="hidden md:block flex-1 max-w-2xl relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={handleFocus}
                  onClick={handleSearchClick}
                  onBlur={handleBlur}
                  placeholder={language === 'ro' ? 'Caută produse, categorii...' : 'Поиск товаров, категорий...'}
                  className={`w-full h-9 pl-4 pr-20 text-[16px] border bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white transition-colors ${
                    showDropdown ? 'border-black' : 'border-gray-200 focus:border-black'
                  }`}
                />
                <VoiceSearchButton
                  onResult={text => { setSearchQuery(text); setSearchOpen(true); inputRef.current?.focus(); }}
                  lang={language as 'ro' | 'ru'}
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-9 w-10 flex items-center justify-center text-gray-400 hover:text-black transition-colors border-l border-gray-200"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </form>

              {showDropdown && (
                <SearchDropdown
                  query={searchQuery}
                  onSelect={handleSelect}
                  onQueryChange={q => { setSearchQuery(q); setSearchOpen(true); inputRef.current?.focus(); }}
                />
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-0 ml-auto">

              {/* Phone — desktop only */}
              <a
                href={`tel:${CONTACTS.phone}`}
                className="hidden"
              >
                <div className="w-6 h-6 bg-black flex items-center justify-center flex-shrink-0 group-hover:bg-gray-800 transition-colors">
                  <Phone className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-mono tracking-wide">{CONTACTS.phoneDisplay}</span>
              </a>

              {/* Language Switcher */}
              <div className="flex md:hidden items-center border-l border-r border-gray-100 h-12 md:h-16">
                <button
                  onClick={() => setLanguage('ro')}
                  className={`px-2 md:px-3 h-full text-[10px] md:text-xs tracking-wider transition-colors ${language === 'ro' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
                >
                  RO
                </button>
                <div className="w-px h-4 bg-gray-100" />
                <button
                  onClick={() => setLanguage('ru')}
                  className={`px-2 md:px-3 h-full text-[10px] md:text-xs tracking-wider transition-colors ${language === 'ru' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
                >
                  RU
                </button>
              </div>

              {/* Cart */}
              <Link
                to="/order-request"
                className="relative flex items-center justify-center w-10 h-12 md:w-12 md:h-16 text-gray-400 hover:text-black transition-colors border-r border-gray-100"
              >
                <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4" />
                {totalItems > 0 && (
                  <span className="absolute top-1.5 md:top-3 right-1 md:right-2 w-3.5 h-3.5 md:w-4 md:h-4 bg-black text-white text-[8px] md:text-[10px] flex items-center justify-center leading-none">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>

              {/* Auth — Desktop */}
              {isAuthenticated ? (
                <div className="hidden md:flex items-center border-r border-gray-100 h-16">
                  <Link
                    to="/account"
                    className="flex items-center gap-2 px-4 h-full text-xs text-gray-500 hover:text-black transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="max-w-[100px] truncate">{user?.name}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center justify-center w-10 h-16 text-gray-300 hover:text-black transition-colors"
                    title={t('nav.logout')}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center h-16 border-r border-gray-100">
                  <Link
                    to="/login"
                    className="px-4 h-full flex items-center text-xs uppercase tracking-wider text-gray-400 hover:text-black transition-colors"
                  >
                    {language === 'ro' ? 'Cont' : 'Аккаунт'}
                  </Link>
                </div>
              )}

              {/* Mobile burger */}
              <button
                onClick={() => {
                  if (mobileMenuOpen) {
                    closeMobileMenu();
                  } else {
                    setMobileMenuOpen(true);
                    setMenuLevel(0);
                  }
                }}
                className="md:hidden flex items-center justify-center w-10 h-12 text-gray-500 hover:text-black transition-colors"
              >
                {mobileMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 2: Nav · Catalog mega-dropdown ── desktop only */}
      <div className="hidden md:block border-b border-gray-100 bg-white">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center h-10">

            <Link
              to={homePath}
              className={`relative px-4 h-10 flex items-center text-xs uppercase tracking-wider transition-colors ${
                isActive('/')
                  ? 'text-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-black'
                  : 'text-gray-400 hover:text-black'
              }`}
            >
              {t('nav.home')}
            </Link>

            <div
              className="hidden"
              onMouseEnter={openDropdown}
              onMouseLeave={closeDropdown}
            >
              <button
                type="button"
                onClick={() => setCatalogOpen(open => !open)}
                className="h-10 px-5 bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 text-xs uppercase tracking-wider transition-colors"
              >
                {t('nav.catalog')}
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${catalogOpen ? 'rotate-180' : ''}`} />
              </button>
              {catalogOpen && (
                <div className="absolute top-10 left-0 flex bg-white border border-gray-100 shadow-2xl z-50" style={{ width: 680 }} onMouseEnter={cancelClose} onMouseLeave={closeDropdown}>
                  <div className="w-[260px] flex-shrink-0 border-r border-gray-100 py-1">
                    {categories.map(cat => (
                      <button key={cat.id} className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${hoveredCatId === cat.id ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'}`} onMouseEnter={() => setHoveredCatId(cat.id)} onClick={() => { navigate(`/catalog?category=${cat.id}`); setCatalogOpen(false); }}>
                        <span className="text-xs tracking-wide">{cat.name[language as Lang]}</span><ChevronRight className={`w-3 h-3 flex-shrink-0 ${hoveredCatId === cat.id ? 'text-gray-400' : 'text-gray-300'}`} />
                      </button>
                    ))}
                    <Link to="/catalog" className="flex items-center border-t border-gray-100 mt-1 px-4 py-2.5 text-xs text-gray-400 hover:text-black tracking-wide transition-colors" onClick={() => setCatalogOpen(false)}>{language === 'ro' ? '← Toate produsele' : '← Все товары'}</Link>
                  </div>
                  <div className="flex-1 py-3 px-3">
                    <div className="px-2 pb-2 mb-1 border-b border-gray-100"><span className="text-xs text-gray-400 uppercase tracking-[0.15em]">{activeCat.name[language as Lang]}</span></div>
                    <div className="columns-2 gap-0">
                      {activeCat.subcategories.map(sub => (
                        <Link key={sub.id} to={`/catalog?category=${activeCat.id}&subcategory=${sub.id}`} className="flex items-center gap-2 px-2 py-2 text-xs text-gray-600 hover:text-black hover:bg-gray-50 transition-colors break-inside-avoid" onClick={() => setCatalogOpen(false)}><span className="w-1 h-1 bg-gray-300 rounded-full flex-shrink-0" />{sub.name[language as Lang]}</Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {navLinks.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`relative px-4 h-10 flex items-center text-xs uppercase tracking-wider transition-colors ${
                  isActive(path)
                    ? 'text-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-black'
                    : 'text-gray-400 hover:text-black'
                }`}
              >
                {label}
              </Link>
            ))}

            <div className="flex items-center gap-0 ml-auto h-10">
              <a href={`tel:${CONTACTS.phone}`} className="hidden lg:flex items-center gap-2 px-3 h-10 border-x border-gray-100 text-gray-600 hover:text-black transition-colors group">
                <div className="w-6 h-6 bg-black flex items-center justify-center flex-shrink-0 group-hover:bg-gray-800 transition-colors"><Phone className="w-3 h-3 text-white" /></div>
                <span className="text-xs font-mono tracking-wide">{CONTACTS.phoneDisplay}</span>
              </a>
              <button onClick={() => setLanguage('ro')} className={`px-3 h-10 text-xs tracking-wider transition-colors ${language === 'ro' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}>RO</button>
              <button onClick={() => setLanguage('ru')} className={`px-3 h-10 text-xs tracking-wider transition-colors border-r border-gray-100 ${language === 'ru' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}>RU</button>
            </div>

          </nav>
        </div>
      </div>

      {/* ── Mobile search ── */}
      <div className="md:hidden border-b border-gray-100 relative bg-white">
        <form onSubmit={handleSearchSubmit} className="flex">
          <input
            ref={mobileInputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={handleMobileFocus}
            onClick={handleMobileClick}
            onBlur={handleMobileBlur}
            placeholder={language === 'ro' ? 'Caută produse...' : 'Поиск товаров...'}
            className="flex-1 h-9 pl-3 text-[16px] bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none border-0 focus:bg-white transition-colors"
          />
          <button type="submit" className="w-10 h-9 flex items-center justify-center text-gray-400 hover:text-black transition-colors border-l border-gray-100">
            <Search className="w-3 h-3" />
          </button>
        </form>
        {showMobileDropdown && (
          <div className="absolute top-full left-0 right-0 z-50">
            <SearchDropdown
              query={searchQuery}
              onSelect={handleSelect}
              onQueryChange={q => { setSearchQuery(q); setMobileSearchOpen(true); mobileInputRef.current?.focus(); }}
            />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          ── MOBILE DRAWER MENU (multi-level) ──
          ══════════════════════════════════════ */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-[88vw] max-w-sm bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 flex-shrink-0">
          {menuLevel > 0 ? (
            <button
              onClick={() => setMenuLevel(l => l - 1)}
              className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 hover:text-black transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {menuLevel === 2 && selectedMobileCat
                ? selectedMobileCat.name[language as Lang]
                : (language === 'ro' ? 'Înapoi' : 'Назад')}
            </button>
          ) : (
            <Logo className="h-6 w-auto" color="#111111" />
          )}
          <button
            onClick={closeMobileMenu}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sliding screens container */}
        <div className="flex-1 relative overflow-hidden">

            {/* ── SCREEN 0: Main menu ── */}
            <div className={`absolute inset-0 overflow-y-auto transition-transform duration-300 ease-in-out flex flex-col bg-white ${
              menuLevel === 0 ? 'translate-x-0' : '-translate-x-full'
            }`}>
              <nav className="flex-1">
                {/* Auth block */}
                {isAuthenticated ? (
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <Link
                      to="/account"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-2.5 text-xs text-gray-700"
                    >
                      <div className="w-7 h-7 bg-black text-white flex items-center justify-center text-[10px] uppercase">
                        {user?.name?.charAt(0)}
                      </div>
                      <span>{user?.name}</span>
                    </Link>
                    <button
                      onClick={() => { logout(); closeMobileMenu(); }}
                      className="text-gray-300 hover:text-black transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-3 border-b border-gray-100 flex gap-2">
                    <Link
                      to="/login"
                      onClick={closeMobileMenu}
                      className="flex-1 text-center text-xs uppercase tracking-wider border border-gray-200 py-2.5 text-gray-600 hover:border-black hover:text-black transition-colors"
                    >
                      {language === 'ro' ? 'Cont' : 'Аккаунт'}
                    </Link>
                  </div>
                )}

                {/* Catalog — opens level 1 */}
                <button
                  onClick={() => setMenuLevel(1)}
                  className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-xs uppercase tracking-wider text-black">{t('nav.catalog')}</span>
                  <div className="flex items-center gap-1 text-gray-400 group-hover:text-black transition-colors">
                    <span className="text-[10px] text-gray-400">{categories.length} {language === 'ro' ? 'categorii' : 'категорий'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>

                {/* Nav links */}
                <Link to={homePath} onClick={closeMobileMenu}
                  className={`flex items-center justify-between px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${isActive('/') ? 'text-black' : 'text-gray-500'}`}>
                  <span className="text-xs uppercase tracking-wider">{t('nav.home')}</span>
                  {isActive('/') && <span className="w-1.5 h-1.5 bg-black rounded-full" />}
                </Link>

                {navLinks.map(({ path, label }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={closeMobileMenu}
                    className={`flex items-center justify-between px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${isActive(path) ? 'text-black' : 'text-gray-500'}`}
                  >
                    <span className="text-xs uppercase tracking-wider">{label}</span>
                    {isActive(path) && <span className="w-1.5 h-1.5 bg-black rounded-full" />}
                  </Link>
                ))}

              </nav>

              {/* Footer: contacts + lang */}
              <div className="border-t border-gray-100 px-5 py-4 flex-shrink-0">
                <a href={`tel:${CONTACTS.phone}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-black transition-colors mb-2">
                  <Phone className="w-3.5 h-3.5" />
                  {CONTACTS.phoneDisplay}
                </a>
                {/* Messenger quick links */}
                <div className="flex items-center gap-3 mb-3">
                  <a href={CONTACTS.whatsapp} target="_blank" rel="noopener noreferrer"
                     className="text-gray-400 hover:text-green-600 transition-colors text-[10px] uppercase tracking-wider">WA</a>
                  <span className="text-gray-200">·</span>
                  <a href={CONTACTS.telegram} target="_blank" rel="noopener noreferrer"
                     className="text-gray-400 hover:text-sky-500 transition-colors text-[10px] uppercase tracking-wider">TG</a>
                  <span className="text-gray-200">·</span>
                  <a href={CONTACTS.viber}
                     className="text-gray-400 hover:text-purple-500 transition-colors text-[10px] uppercase tracking-wider">VB</a>
                </div>
                <div className="flex items-center gap-0">
                  <button
                    onClick={() => setLanguage('ro')}
                    className={`px-3 py-1.5 text-xs tracking-wider transition-colors border ${language === 'ro' ? 'bg-black text-white border-black' : 'text-gray-400 border-gray-200 hover:text-black'}`}
                  >
                    RO
                  </button>
                  <button
                    onClick={() => setLanguage('ru')}
                    className={`px-3 py-1.5 text-xs tracking-wider transition-colors border-t border-b border-r ${language === 'ru' ? 'bg-black text-white border-black' : 'text-gray-400 border-gray-200 hover:text-black'}`}
                  >
                    RU
                  </button>
                </div>
              </div>
            </div>

            {/* ── SCREEN 1: Categories ── */}
            <div className={`absolute inset-0 overflow-y-auto transition-transform duration-300 ease-in-out flex flex-col bg-white ${
              menuLevel === 1 ? 'translate-x-0' : menuLevel < 1 ? 'translate-x-full' : '-translate-x-full'
            }`}>
              <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0">
                <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400">
                  {language === 'ro' ? 'Toate categoriile' : 'Все категории'}
                </p>
              </div>
              <div className="flex-1">
                {/* All products link */}
                <Link
                  to="/catalog"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-between px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border border-gray-200 flex items-center justify-center group-hover:border-black group-hover:bg-black transition-colors">
                      <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-xs uppercase tracking-wider text-gray-500 group-hover:text-black transition-colors">
                      {language === 'ro' ? 'Toate produsele' : 'Все товары'}
                    </span>
                  </div>
                </Link>

                {categories.map((cat, i) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedMobileCat(cat); setMenuLevel(2); }}
                    className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-300 w-4 text-right flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-xs text-gray-700 group-hover:text-black transition-colors">
                        {cat.name[language as Lang]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-gray-300">{cat.subcategories.length}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-black transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── SCREEN 2: Subcategories ── */}
            <div className={`absolute inset-0 overflow-y-auto transition-transform duration-300 ease-in-out flex flex-col bg-white ${
              menuLevel === 2 ? 'translate-x-0' : 'translate-x-full'
            }`}>
              {selectedMobileCat && (
                <>
                  <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400">
                      {selectedMobileCat.name[language as Lang]}
                    </p>
                  </div>
                  <div className="flex-1">
                    {/* All in category */}
                    <Link
                      to={`/catalog?category=${selectedMobileCat.id}`}
                      onClick={closeMobileMenu}
                      className="flex items-center px-5 py-4 border-b border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors gap-3"
                    >
                      <div className="w-6 h-6 bg-black flex items-center justify-center flex-shrink-0">
                        <ArrowRight className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs uppercase tracking-wider text-black">
                        {language === 'ro' ? 'Toate din categorie' : 'Все в категории'}
                      </span>
                    </Link>

                    {selectedMobileCat.subcategories.map((sub, i) => (
                      <Link
                        key={sub.id}
                        to={`/catalog?category=${selectedMobileCat.id}&subcategory=${sub.id}`}
                        onClick={closeMobileMenu}
                        className="flex items-center justify-between px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-gray-300 w-4 text-right flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                          <span className="text-xs text-gray-600 group-hover:text-black transition-colors">
                            {sub.name[language as Lang]}
                          </span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-black transition-colors flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

        </div>
      </div>

    </header>
  );
}
