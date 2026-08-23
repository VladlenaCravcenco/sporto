'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Menu, Mic, Phone, Search, ShoppingCart, X } from 'lucide-react';
import { Logo } from '../../src/app/components/Logo';
import { categories } from '../../src/app/data/products';
import { CONTACTS } from '../../src/lib/contacts';

export type Language = 'ro' | 'ru';

interface HeaderPreviewProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
}

const labels = {
  ro: {
    home: 'Acasă', catalog: 'Catalog', about: 'Despre Noi', turnkey: 'Soluții la Cheie',
    maintenance: 'Service & Mentenanță', contacts: 'Contact', login: 'Cont',
    search: 'Caută produse, categorii...', mobileSearch: 'Caută produse...', all: '← Toate produsele',
  },
  ru: {
    home: 'Главная', catalog: 'Каталог', about: 'О нас', turnkey: 'Решения под Ключ',
    maintenance: 'Сервис и Обслуживание', contacts: 'Контакты', login: 'Аккаунт',
    search: 'Поиск товаров, категорий...', mobileSearch: 'Поиск товаров...', all: '← Все товары',
  },
} as const;

const production = 'https://www.sporto.md';

export function HeaderPreview({ language, onLanguageChange }: HeaderPreviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredCatId, setHoveredCatId] = useState(categories[0].id);
  const [totalItems, setTotalItems] = useState(0);
  const text = labels[language];
  const activeCategory = categories.find(category => category.id === hoveredCatId) ?? categories[0];

  useEffect(() => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]') as Array<{ quantity?: number }>;
      setTotalItems(cart.reduce((sum, item) => sum + (item.quantity ?? 1), 0));
    } catch {
      setTotalItems(0);
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query) window.location.href = `${production}/catalog?search=${encodeURIComponent(query)}`;
  }

  const navLinks = [
    [production + '/about', text.about],
    [production + '/turnkey-solutions', text.turnkey],
    [production + '/maintenance-service', text.maintenance],
    [production + '/contacts', text.contacts],
  ] as const;

  return (
    <header className="bg-white sticky top-0 z-50 shadow-[0_1px_0_0_#f3f4f6] flex flex-col md:flex-col-reverse">
      {mobileMenuOpen && (
        <button
          aria-label="Close menu"
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center h-12 md:h-16 gap-2 md:gap-6">
            <a href={language === 'ru' ? production + '/ru' : production} className="flex items-center flex-shrink-0">
              <Logo className="h-5 md:h-8 w-auto" color="#111111" />
            </a>

            <div className="hidden md:block relative" onMouseEnter={() => setCatalogOpen(true)} onMouseLeave={() => setCatalogOpen(false)}>
              <button type="button" onClick={() => setCatalogOpen(open => !open)} className="h-9 px-5 bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 text-xs uppercase tracking-wider transition-colors">
                {text.catalog}<ChevronDown className={`w-3 h-3 transition-transform duration-200 ${catalogOpen ? 'rotate-180' : ''}`} />
              </button>
              {catalogOpen && (
                <div className="absolute top-9 left-0 flex bg-white border border-gray-100 shadow-2xl z-50" style={{ width: 680 }}>
                  <div className="w-[260px] flex-shrink-0 border-r border-gray-100 py-1">
                    {categories.map(category => (
                      <a key={category.id} href={`${production}/catalog?category=${category.id}`} onMouseEnter={() => setHoveredCatId(category.id)} className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${hoveredCatId === category.id ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'}`}>
                        <span className="text-xs tracking-wide">{category.name[language]}</span>
                        <ChevronRight className={`w-3 h-3 flex-shrink-0 ${hoveredCatId === category.id ? 'text-gray-400' : 'text-gray-300'}`} />
                      </a>
                    ))}
                    <a href={production + '/catalog'} className="flex items-center border-t border-gray-100 mt-1 px-4 py-2.5 text-xs text-gray-400 hover:text-black tracking-wide transition-colors">{text.all}</a>
                  </div>
                  <div className="flex-1 py-3 px-3">
                    <div className="px-2 pb-2 mb-1 border-b border-gray-100"><span className="text-xs text-gray-400 uppercase tracking-[0.15em]">{activeCategory.name[language]}</span></div>
                    <div className="columns-2 gap-0">
                      {activeCategory.subcategories.map(subcategory => (
                        <a key={subcategory.id} href={`${production}/catalog?category=${activeCategory.id}&subcategory=${subcategory.id}`} className="flex items-center gap-2 px-2 py-2 text-xs text-gray-600 hover:text-black hover:bg-gray-50 transition-colors break-inside-avoid">
                          <span className="w-1 h-1 bg-gray-300 rounded-full flex-shrink-0" />{subcategory.name[language]}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:block flex-1 max-w-2xl relative">
              <form onSubmit={submitSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder={text.search}
                  className="w-full h-9 pl-4 pr-20 text-[16px] border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-black transition-colors"
                />
                <button type="button" title={language === 'ro' ? 'Căutare vocală' : 'Голосовой поиск'} className="absolute flex items-center justify-center text-gray-300 hover:text-black transition-colors" style={{ right: 42, top: 0, bottom: 0, width: 32 }}>
                  <Mic className="w-3.5 h-3.5" />
                </button>
                <button type="submit" aria-label="Search" className="absolute right-0 top-0 h-9 w-10 flex items-center justify-center text-gray-400 hover:text-black transition-colors border-l border-gray-200">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            <div className="flex items-center gap-0 ml-auto">
              <a href={`tel:${CONTACTS.phone}`} className="hidden">
                <div className="w-6 h-6 bg-black flex items-center justify-center flex-shrink-0 group-hover:bg-gray-800 transition-colors">
                  <Phone className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-mono tracking-wide">{CONTACTS.phoneDisplay}</span>
              </a>

              <div className="flex md:hidden items-center border-l border-r border-gray-100 h-12 md:h-16">
                <button onClick={() => onLanguageChange('ro')} className={`px-2 md:px-3 h-full text-[10px] md:text-xs tracking-wider transition-colors ${language === 'ro' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}>RO</button>
                <div className="w-px h-4 bg-gray-100" />
                <button onClick={() => onLanguageChange('ru')} className={`px-2 md:px-3 h-full text-[10px] md:text-xs tracking-wider transition-colors ${language === 'ru' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}>RU</button>
              </div>

              <a href={production + '/order-request'} className="relative flex items-center justify-center w-10 h-12 md:w-12 md:h-16 text-gray-400 hover:text-black transition-colors border-r border-gray-100">
                <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4" />
                {totalItems > 0 && <span className="absolute top-1.5 md:top-3 right-1 md:right-2 w-3.5 h-3.5 md:w-4 md:h-4 bg-black text-white text-[8px] md:text-[10px] flex items-center justify-center leading-none">{totalItems > 9 ? '9+' : totalItems}</span>}
              </a>

              <div className="hidden md:flex items-center h-16 border-r border-gray-100">
                <a href={production + '/login'} className="px-4 h-full flex items-center text-xs uppercase tracking-wider text-gray-400 hover:text-black transition-colors">{text.login}</a>
              </div>

              <button aria-label="Menu" onClick={() => setMobileMenuOpen(open => !open)} className="md:hidden flex items-center justify-center w-10 h-12 text-gray-500 hover:text-black transition-colors">
                {mobileMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block border-b border-gray-100 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center h-10">
            <a href={language === 'ru' ? production + '/ru' : production} className="relative px-4 h-10 flex items-center text-xs uppercase tracking-wider text-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-black">{text.home}</a>

            <div className="hidden">
              <button type="button" onClick={() => setCatalogOpen(open => !open)} className="h-10 px-5 bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 text-xs uppercase tracking-wider transition-colors">
                {text.catalog}<ChevronDown className={`w-3 h-3 transition-transform duration-200 ${catalogOpen ? 'rotate-180' : ''}`} />
              </button>
              {catalogOpen && (
                <div className="absolute top-10 left-0 flex bg-white border border-gray-100 shadow-2xl z-50" style={{ width: 680 }}>
                  <div className="w-[260px] flex-shrink-0 border-r border-gray-100 py-1">
                    {categories.map(category => (
                      <a key={category.id} href={`${production}/catalog?category=${category.id}`} onMouseEnter={() => setHoveredCatId(category.id)} className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${hoveredCatId === category.id ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'}`}>
                        <span className="text-xs tracking-wide">{category.name[language]}</span><ChevronRight className={`w-3 h-3 flex-shrink-0 ${hoveredCatId === category.id ? 'text-gray-400' : 'text-gray-300'}`} />
                      </a>
                    ))}
                    <a href={production + '/catalog'} className="flex items-center border-t border-gray-100 mt-1 px-4 py-2.5 text-xs text-gray-400 hover:text-black tracking-wide transition-colors">{text.all}</a>
                  </div>
                  <div className="flex-1 py-3 px-3">
                    <div className="px-2 pb-2 mb-1 border-b border-gray-100"><span className="text-xs text-gray-400 uppercase tracking-[0.15em]">{activeCategory.name[language]}</span></div>
                    <div className="columns-2 gap-0">
                      {activeCategory.subcategories.map(subcategory => (
                        <a key={subcategory.id} href={`${production}/catalog?category=${activeCategory.id}&subcategory=${subcategory.id}`} className="flex items-center gap-2 px-2 py-2 text-xs text-gray-600 hover:text-black hover:bg-gray-50 transition-colors break-inside-avoid"><span className="w-1 h-1 bg-gray-300 rounded-full flex-shrink-0" />{subcategory.name[language]}</a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {navLinks.map(([href, label]) => <a key={href} href={href} className="relative px-4 h-10 flex items-center text-xs uppercase tracking-wider text-gray-400 hover:text-black transition-colors">{label}</a>)}

            <div className="flex items-center gap-0 ml-auto h-10">
              <a href={`tel:${CONTACTS.phone}`} className="hidden lg:flex items-center gap-2 px-3 h-10 border-x border-gray-100 text-gray-600 hover:text-black transition-colors group">
                <div className="w-6 h-6 bg-black flex items-center justify-center flex-shrink-0 group-hover:bg-gray-800 transition-colors"><Phone className="w-3 h-3 text-white" /></div>
                <span className="text-xs font-mono tracking-wide">{CONTACTS.phoneDisplay}</span>
              </a>
              <button onClick={() => onLanguageChange('ro')} className={`px-3 h-10 text-xs tracking-wider transition-colors ${language === 'ro' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}>RO</button>
              <button onClick={() => onLanguageChange('ru')} className={`px-3 h-10 text-xs tracking-wider transition-colors border-r border-gray-100 ${language === 'ru' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}>RU</button>
            </div>
          </nav>
        </div>
      </div>

      <div className="md:hidden border-b border-gray-100 relative bg-white">
        <form onSubmit={submitSearch} className="flex">
          <input type="text" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder={text.mobileSearch} className="flex-1 h-9 pl-3 text-[16px] bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none border-0 focus:bg-white transition-colors" />
          <button type="submit" aria-label="Search" className="w-10 h-9 flex items-center justify-center text-gray-400 hover:text-black transition-colors border-l border-gray-100"><Search className="w-3 h-3" /></button>
        </form>
      </div>

      <aside className={`md:hidden fixed top-0 right-0 h-full w-[88vw] max-w-sm bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 flex-shrink-0">
          <Logo className="h-6 w-auto" color="#111111" />
          <button aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <a href={production + '/login'} className="block mx-4 my-3 text-center text-xs uppercase tracking-wider border border-gray-200 py-2.5 text-gray-600">{text.login}</a>
          <a href={production + '/catalog'} className="flex items-center justify-between px-5 py-4 border-y border-gray-100"><span className="text-xs uppercase tracking-wider text-black">{text.catalog}</span><ChevronRight className="w-3.5 h-3.5 text-gray-400" /></a>
          <a href={language === 'ru' ? production + '/ru' : production} className="flex px-5 py-4 border-b border-gray-100 text-xs uppercase tracking-wider text-black">{text.home}</a>
          {navLinks.map(([href, label]) => <a key={href} href={href} className="flex px-5 py-4 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">{label}</a>)}
        </nav>
        <div className="border-t border-gray-100 px-5 py-4">
          <a href={`tel:${CONTACTS.phone}`} className="flex items-center gap-2 text-xs text-gray-500 mb-3"><Phone className="w-3.5 h-3.5" />{CONTACTS.phoneDisplay}</a>
          <div className="flex"><button onClick={() => onLanguageChange('ro')} className={`px-3 py-1.5 text-xs border ${language === 'ro' ? 'bg-black text-white border-black' : 'text-gray-400 border-gray-200'}`}>RO</button><button onClick={() => onLanguageChange('ru')} className={`px-3 py-1.5 text-xs border-t border-b border-r ${language === 'ru' ? 'bg-black text-white border-black' : 'text-gray-400 border-gray-200'}`}>RU</button></div>
        </div>
      </aside>
    </header>
  );
}
