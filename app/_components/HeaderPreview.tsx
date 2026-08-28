'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Dumbbell, Menu, Mic, Package, Phone, Puzzle, School, Search, ShoppingCart, Swords, TreePine, Trophy, Waves, Weight, X } from 'lucide-react';
import { Logo } from '../../src/app/components/Logo';
import { getCategoryIcon } from '../../src/app/lib/category-icons';
import type { CatalogMenuProduct, CatalogNavigationCategory } from '../_lib/catalog-data';
import type { FooterData } from '../_lib/footer-data';

export type Language = 'ro' | 'ru';

interface HeaderPreviewProps {
  language: Language;
  categories: CatalogNavigationCategory[];
  contacts: FooterData;
}

const labels = {
  ro: { home: 'Acasă', catalog: 'Catalog', about: 'Despre noi', turnkey: 'Soluții la cheie', maintenance: 'Service și mentenanță', contacts: 'Contact', login: 'Cont', search: 'Caută produse, categorii...', mobileSearch: 'Caută produse...', all: '← Toate produsele', seeAll: 'Vezi toate', empty: 'Produsele vor apărea în curând' },
  ru: { home: 'Главная', catalog: 'Каталог', about: 'О нас', turnkey: 'Решения под ключ', maintenance: 'Сервис и обслуживание', contacts: 'Контакты', login: 'Аккаунт', search: 'Поиск товаров, категорий...', mobileSearch: 'Поиск товаров...', all: '← Все товары', seeAll: 'Смотреть все', empty: 'Товары скоро появятся' },
} as const;

const fallbackIcons: Record<string, React.ReactNode> = {
  'aparate-cardio': <Activity className="w-4 h-4" />, 'aparate-forta': <Dumbbell className="w-4 h-4" />,
  greutati: <Weight className="w-4 h-4" />, 'sporturi-colective': <Trophy className="w-4 h-4" />,
  'arte-martiale': <Swords className="w-4 h-4" />, inot: <Waves className="w-4 h-4" />,
  jocuri: <Puzzle className="w-4 h-4" />, 'forta-exterior': <TreePine className="w-4 h-4" />,
  'inventar-institutii': <School className="w-4 h-4" />,
};

function slugify(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/&/g, ' si ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'produs';
}

export function HeaderPreview({ language, categories, contacts }: HeaderPreviewProps) {
  const text = labels[language];
  const localePath = useCallback((path = '') => `/${language}${path}`, [language]);
  const initialCategory = categories[0];
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileLevel, setMobileLevel] = useState<0 | 1 | 2>(0);
  const [mobileCategoryId, setMobileCategoryId] = useState(initialCategory?.id || '');
  const [categoryId, setCategoryId] = useState(initialCategory?.id || '');
  const [subcategoryId, setSubcategoryId] = useState(initialCategory?.subcategories[0]?.id || '');
  const [products, setProducts] = useState<CatalogMenuProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const closeTimer = useRef<number | null>(null);
  const productCache = useRef(new Map<string, CatalogMenuProduct[]>());

  const activeCategory = categories.find(category => category.id === categoryId) ?? initialCategory;
  const activeSubcategory = activeCategory?.subcategories.find(subcategory => subcategory.id === subcategoryId) ?? activeCategory?.subcategories[0];
  const mobileCategory = categories.find(category => category.id === mobileCategoryId) ?? initialCategory;

  useEffect(() => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]') as Array<{ quantity?: number }>;
      setTotalItems(cart.reduce((sum, item) => sum + (item.quantity ?? 1), 0));
    } catch { setTotalItems(0); }
  }, []);

  useEffect(() => {
    if (!catalogOpen && !mobileMenuOpen) return;
    const width = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (width > 0) document.body.style.paddingRight = `${width}px`;
    return () => { document.body.style.overflow = ''; document.body.style.paddingRight = ''; };
  }, [catalogOpen, mobileMenuOpen]);

  useEffect(() => {
    if (!catalogOpen || !activeCategory || !activeSubcategory) return;
    const key = `${activeCategory.id}:${activeSubcategory.id}`;
    const cached = productCache.current.get(key);
    if (cached) { setProducts(cached); setProductsLoading(false); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setProductsLoading(true);
      try {
        const query = new URLSearchParams({ category: activeCategory.id, subcategory: activeSubcategory.id });
        const response = await fetch(`/api/catalog/menu-products?${query}`, { signal: controller.signal });
        const payload = response.ok ? await response.json() as { products?: CatalogMenuProduct[] } : { products: [] };
        const nextProducts = payload.products ?? [];
        productCache.current.set(key, nextProducts);
        setProducts(nextProducts);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setProducts([]);
      } finally { if (!controller.signal.aborted) setProductsLoading(false); }
    }, 100);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [catalogOpen, activeCategory, activeSubcategory]);

  function changeLanguage(next: Language) {
    if (next === language) return;
    const rest = window.location.pathname.replace(/^\/(ro|ru)(?=\/|$)/, '');
    window.location.assign(`/${next}${rest}${window.location.search}${window.location.hash}`);
  }
  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query) window.location.href = `${localePath('/catalog')}?search=${encodeURIComponent(query)}`;
  }
  function openCatalog() { if (closeTimer.current) window.clearTimeout(closeTimer.current); setCatalogOpen(true); }
  function scheduleClose() { closeTimer.current = window.setTimeout(() => setCatalogOpen(false), 120); }
  function selectCategory(category: CatalogNavigationCategory) { setCategoryId(category.id); setSubcategoryId(category.subcategories[0]?.id || ''); setProducts([]); }
  function closeMobile() { setMobileMenuOpen(false); setMobileLevel(0); }

  const navLinks = [[localePath('/about'), text.about], [localePath('/turnkey-solutions'), text.turnkey], [localePath('/maintenance-service'), text.maintenance], [localePath('/contacts'), text.contacts]] as const;

  return (
    <header className="bg-white sticky top-0 z-50 shadow-[0_1px_0_0_#f3f4f6] flex flex-col md:flex-col-reverse">
      {mobileMenuOpen && <button type="button" aria-label="Close menu" className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={closeMobile} />}
      <div className="border-b border-gray-100"><div className="max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8"><div className="flex items-center h-12 md:h-16 gap-2 md:gap-6">
        <a href={localePath()} className="flex items-center flex-shrink-0"><Logo className="h-5 md:h-8 w-auto" color="#111111" /></a>
        <div className="hidden md:block relative" onMouseEnter={openCatalog} onMouseLeave={scheduleClose}>
          <button type="button" onClick={() => setCatalogOpen(value => !value)} className="h-9 rounded-[5px] px-5 bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 text-xs font-semibold transition-colors">{text.catalog}<ChevronDown className={`w-3 h-3 transition-transform ${catalogOpen ? 'rotate-180' : ''}`} /></button>
          {catalogOpen && activeCategory && (
            <div className="absolute top-9 left-0 flex min-h-0 bg-white border border-gray-100 shadow-2xl z-50 overflow-hidden" style={{ width: 'min(1120px, calc(100vw - 2rem))', height: 'min(680px, calc(100vh - 110px))' }} onMouseEnter={openCatalog} onMouseLeave={scheduleClose}>
              <div className="w-[250px] min-h-0 flex-shrink-0 border-r border-gray-100 py-1 overflow-y-auto overscroll-contain">
                {categories.map(category => <a key={category.id} href={`${localePath('/catalog')}?category=${encodeURIComponent(category.id)}`} onMouseEnter={() => selectCategory(category)} className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors ${activeCategory.id === category.id ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'}`}><span className="flex items-center gap-3 min-w-0"><span className={`w-5 flex justify-center flex-shrink-0 ${activeCategory.id === category.id ? 'text-white' : 'text-gray-400'}`}>{getCategoryIcon(category.icon) ?? fallbackIcons[category.id] ?? <Dumbbell className="w-4 h-4" />}</span><span className="text-xs truncate">{category.name[language]}</span></span><ChevronRight className="w-3 h-3 flex-shrink-0 text-gray-400" /></a>)}
                <a href={localePath('/catalog')} className="flex border-t border-gray-100 mt-1 px-4 py-2.5 text-xs text-gray-400 hover:text-black">{text.all}</a>
              </div>
              <div className="w-[285px] min-h-0 flex-shrink-0 border-r border-gray-100 py-3 px-3 overflow-y-auto overscroll-contain">
                <div className="px-2 pb-2 mb-1 border-b border-gray-100"><span className="text-xs font-semibold text-gray-500">{activeCategory.name[language]}</span></div>
                {activeCategory.subcategories.map(subcategory => <a key={subcategory.id} href={`${localePath('/catalog')}?category=${encodeURIComponent(activeCategory.id)}&subcategory=${encodeURIComponent(subcategory.id)}`} onMouseEnter={() => { setSubcategoryId(subcategory.id); setProducts([]); }} className={`w-full flex items-center justify-between gap-3 px-2 py-2.5 text-xs transition-colors ${activeSubcategory?.id === subcategory.id ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50 hover:text-black'}`}><span>{subcategory.name[language]}</span><ChevronRight className="w-3 h-3 flex-shrink-0 text-gray-300" /></a>)}
              </div>
              <div className="flex-1 min-w-0 min-h-0 py-3 px-4 bg-[#f5f6f7] overflow-y-auto overscroll-contain">
                <div className="flex items-center justify-between gap-4 pb-2 mb-3 border-b border-gray-200"><span className="text-xs font-semibold text-gray-500 line-clamp-1">{activeSubcategory?.name[language]}</span>{activeSubcategory && <a href={`${localePath('/catalog')}?category=${encodeURIComponent(activeCategory.id)}&subcategory=${encodeURIComponent(activeSubcategory.id)}`} className="text-xs text-gray-500 hover:text-black whitespace-nowrap">{text.seeAll}</a>}</div>
                {productsLoading ? <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">{Array.from({ length: 12 }).map((_, index) => <div key={index} className="animate-pulse bg-white p-2"><div className="aspect-square bg-gray-50" /><div className="h-2 bg-gray-100 mt-2 w-4/5" /></div>)}</div> : products.length > 0 ? <div className="grid grid-cols-2 xl:grid-cols-4 gap-x-3 gap-y-5">{products.map(product => { const name = language === 'ru' ? product.name_ru || product.name_ro : product.name_ro; return <a key={product.id} href={`/${language}/product/${encodeURIComponent(slugify(name))}/${encodeURIComponent(product.id)}`} className="group min-w-0 bg-white p-2"><div className="aspect-square bg-white overflow-hidden flex items-center justify-center">{product.image_url ? <img src={product.image_url} alt={name} className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105" loading="lazy" /> : <Package className="w-6 h-6 text-gray-200" />}</div><div className="mt-2 text-[11px] leading-snug text-gray-700 group-hover:text-black line-clamp-2">{name}</div></a>; })}</div> : <div className="h-full min-h-[220px] flex items-center justify-center text-xs text-gray-400">{text.empty}</div>}
              </div>
            </div>
          )}
        </div>
        <form onSubmit={submitSearch} className="hidden md:block flex-1 max-w-2xl relative"><input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder={text.search} className="w-full h-9 pl-4 pr-20 text-base border border-gray-200 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-black" /><button type="button" title={language === 'ro' ? 'Căutare vocală' : 'Голосовой поиск'} className="absolute right-10 top-0 h-9 w-9 flex items-center justify-center text-gray-300"><Mic className="w-3.5 h-3.5" /></button><button type="submit" aria-label="Search" className="absolute right-0 top-0 h-9 w-10 flex items-center justify-center text-gray-400 border-l border-gray-200"><Search className="w-3.5 h-3.5" /></button></form>
        <div className="ml-auto flex items-center"><div className="flex md:hidden h-12 border-x border-gray-100"><button onClick={() => changeLanguage('ro')} className={`px-2 text-xs ${language === 'ro' ? 'bg-black text-white' : 'text-gray-400'}`}>RO</button><button onClick={() => changeLanguage('ru')} className={`px-2 text-xs ${language === 'ru' ? 'bg-black text-white' : 'text-gray-400'}`}>RU</button></div><a href={localePath('/order-request')} className="relative flex items-center justify-center w-10 h-12 md:w-12 md:h-16 text-gray-400 border-r border-gray-100"><ShoppingCart className="w-4 h-4" />{totalItems > 0 && <span className="absolute top-2 right-1 w-4 h-4 bg-black text-white text-[9px] flex items-center justify-center">{totalItems > 9 ? '9+' : totalItems}</span>}</a><a href={localePath('/login')} className="hidden md:flex px-4 h-16 items-center text-xs text-gray-500 hover:text-black">{text.login}</a><button aria-label="Menu" onClick={() => { setMobileMenuOpen(true); setMobileLevel(1); }} className="md:hidden w-10 h-12 flex items-center justify-center text-gray-500"><Menu className="w-4 h-4" /></button></div>
      </div></div></div>
      <div className="hidden md:block border-b border-gray-100 bg-white"><div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8"><nav className="flex items-center h-10"><a href={localePath()} className="px-4 h-10 flex items-center text-xs font-semibold text-black border-b-2 border-black">{text.home}</a>{navLinks.map(([href, label]) => <a key={href} href={href} className="px-4 h-10 flex items-center text-xs text-gray-500 hover:text-black">{label}</a>)}<div className="ml-auto flex h-10"><a href={`tel:${contacts.phone}`} className="hidden lg:flex items-center gap-2 px-3 border-x border-gray-100 text-xs text-gray-600"><span className="w-6 h-6 bg-black flex items-center justify-center"><Phone className="w-3 h-3 text-white" /></span>{contacts.phoneDisplay}</a><button onClick={() => changeLanguage('ro')} className={`px-3 text-xs ${language === 'ro' ? 'bg-black text-white' : 'text-gray-400'}`}>RO</button><button onClick={() => changeLanguage('ru')} className={`px-3 text-xs border-r border-gray-100 ${language === 'ru' ? 'bg-black text-white' : 'text-gray-400'}`}>RU</button></div></nav></div></div>
      <div className="md:hidden border-b border-gray-100 bg-white"><form onSubmit={submitSearch} className="flex"><input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder={text.mobileSearch} className="flex-1 h-9 pl-3 text-base bg-gray-50 focus:outline-none" /><button type="submit" aria-label="Search" className="w-10 h-9 border-l border-gray-100 flex items-center justify-center text-gray-400"><Search className="w-3.5 h-3.5" /></button></form></div>
      <aside className={`md:hidden fixed top-0 right-0 h-full w-[88vw] max-w-sm bg-white z-50 shadow-2xl transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}><div className="h-14 px-5 flex items-center justify-between border-b border-gray-100"><button type="button" onClick={() => mobileLevel === 2 ? setMobileLevel(1) : closeMobile()} aria-label="Back">{mobileLevel === 2 ? <ChevronLeft className="w-4 h-4" /> : <Logo className="h-6 w-auto" color="#111" />}</button><button onClick={closeMobile} aria-label="Close menu"><X className="w-4 h-4" /></button></div><div className="h-[calc(100%-3.5rem)] overflow-y-auto">{mobileLevel === 1 && categories.map(category => <button key={category.id} onClick={() => { setMobileCategoryId(category.id); setMobileLevel(2); }} className="w-full px-5 py-4 border-b border-gray-100 flex items-center justify-between text-left"><span className="flex items-center gap-3"><span className="w-5 text-gray-400">{getCategoryIcon(category.icon) ?? fallbackIcons[category.id] ?? <Dumbbell className="w-4 h-4" />}</span><span className="text-sm text-gray-700">{category.name[language]}</span></span><ChevronRight className="w-3.5 h-3.5 text-gray-300" /></button>)}{mobileLevel === 2 && mobileCategory && <><a href={`${localePath('/catalog')}?category=${encodeURIComponent(mobileCategory.id)}`} className="flex px-5 py-4 bg-gray-50 border-b border-gray-100 text-sm font-semibold">{language === 'ro' ? 'Toate din categorie' : 'Все в категории'}</a>{mobileCategory.subcategories.map(subcategory => <a key={subcategory.id} href={`${localePath('/catalog')}?category=${encodeURIComponent(mobileCategory.id)}&subcategory=${encodeURIComponent(subcategory.id)}`} className="flex items-center justify-between px-5 py-4 border-b border-gray-100 text-sm text-gray-600">{subcategory.name[language]}<ChevronRight className="w-3 h-3 text-gray-300" /></a>)}</>}</div></aside>
    </header>
  );
}
