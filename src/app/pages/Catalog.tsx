import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { SeoHead, SEO_PAGES } from '../components/SeoHead';
import { norm, expandTokens, scoreProduct as engineScore, parsePrice } from '../../lib/searchEngine';
import {
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Weight,
  Waves,
  Trophy,
  Users,
  Swords,
  Activity,
  Gamepad2,
  Building2,
  TreePine,
  LayoutGrid,
  LayoutList,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Tag,
  Zap,
  Target,
  SlidersHorizontal,
  Package,
} from 'lucide-react';
import { useState, useMemo, useRef, useEffect, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { type Product } from '../data/products';
import { useCategories } from '../contexts/CategoriesContext';
import { ProductCard } from '../components/ProductCard';

type SortOption = 'default' | 'price-asc' | 'price-desc';

const PAGE_SIZE = 24;

const categoryIcons: Record<string, ReactNode> = {
  'aparate-cardio':      <Activity className="w-4 h-4" />,
  'aparate-forta':       <Dumbbell className="w-4 h-4" />,
  'greutati':            <Weight className="w-4 h-4" />,
  'fitness-yoga':        <Zap className="w-4 h-4" />,
  'sporturi-colective':  <Users className="w-4 h-4" />,
  'sporturi-individuale':<Trophy className="w-4 h-4" />,
  'arte-martiale':       <Swords className="w-4 h-4" />,
  'inot':                <Waves className="w-4 h-4" />,
  'tenis-masa':          <Target className="w-4 h-4" />,
  'jocuri':              <Gamepad2 className="w-4 h-4" />,
  'forta-exterior':      <TreePine className="w-4 h-4" />,
  'inventar-institutii': <Building2 className="w-4 h-4" />,
};

/** Score a product against search tokens. Higher = better match. */
function scoreProduct(product: Product, tokens: string[], lang: Language): number {
  if (!tokens.length) return 1;
  const expanded = expandTokens(tokens, tokens.join(' '));
  const result = engineScore(product, tokens, lang, expanded);
  return result?.score ?? -1;
}

/** ~80% in stock, deterministic from id (same logic as ProductCard) */
function getInStock(product: Product): boolean {
  if (product.inStock !== undefined) return product.inStock;
  return Number(product.id) % 5 !== 0;
}

export function Catalog() {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const lang = language as Language;
  const categories = useCategories();

  // ── Supabase ────────────────────────────────────────────────────────
  const { products, loading: dbLoading, error: dbError, connected } = useSupabaseProducts();

  // Dynamic price range from loaded products
  const [priceMin, priceMax] = useMemo(() => {
    if (products.length === 0) return [0, 100000];
    const prices = products.map(p => p.price);
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
  }, [products]);

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get('subcategory') || 'all');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [page, setPage] = useState(1);
  const [saleOnly, setSaleOnly] = useState(searchParams.get('sale') === 'true');

  const [brandPopoverOpen, setBrandPopoverOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'onOrder'>('all');
  const [stockPopoverOpen, setStockPopoverOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const stockRef = useRef<HTMLDivElement>(null);
  const mobileBrandRef = useRef<HTMLDivElement>(null);

  // ── Sync URL params → state (from header dropdown nav) ──────────────────
  useEffect(() => {
    const cat = searchParams.get('category') || 'all';
    const sub = searchParams.get('subcategory') || 'all';
    const q = searchParams.get('search') || '';
    const br = searchParams.get('brand') || '';
    const sale = searchParams.get('sale') === 'true';
    setSelectedCategory(cat);
    setSelectedSubcategory(sub);
    setSearchTerm(q);
    setSelectedBrand(br);
    setSaleOnly(sale);
    setPage(1);
  }, [searchParams]);

  // ── Reset page on filter change ──────────────────────────────────────────
  useEffect(() => { setPage(1); }, [selectedCategory, selectedSubcategory, sortBy, selectedBrand, saleOnly]);

  // ── Close popovers on outside click ─────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const outDesktop = !brandRef.current || !brandRef.current.contains(e.target as Node);
      const outMobile = !mobileBrandRef.current || !mobileBrandRef.current.contains(e.target as Node);
      if (outDesktop && outMobile) setBrandPopoverOpen(false);
      
      const outStock = !stockRef.current || !stockRef.current.contains(e.target as Node);
      if (outStock) setStockPopoverOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentCategory = categories.find((c) => c.id === selectedCategory);

  // ── Available brands (from products filtered by cat/subcat, not brand) ──
  const availableBrands = useMemo(() => {
    const base = products.filter(p => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (selectedSubcategory !== 'all' && p.subcategory !== selectedSubcategory) return false;
      return true;
    });
    const counts: Record<string, number> = {};
    base.forEach(p => {
      const b = (p as any).brand;
      if (b && typeof b === 'string' && b.trim()) {
        counts[b.trim()] = (counts[b.trim()] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [products, selectedCategory, selectedSubcategory]);

  // ── Smart filtered + sorted products ────────────────────────────────────
  const allFiltered = useMemo(() => {
    // Parse price from search term
    const { price: priceFromQuery, cleanQuery } = parsePrice(searchTerm.trim());
    const rawSearch = cleanQuery.toLowerCase();
    const tokens = norm(rawSearch).split(/\s+/).filter(Boolean);
    const expanded = tokens.length ? expandTokens(tokens, rawSearch) : null;
    const hasPriceInQuery = priceFromQuery.min !== undefined || priceFromQuery.max !== undefined;

    let result = products.filter((product) => {
      if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
      if (selectedSubcategory !== 'all' && product.subcategory !== selectedSubcategory) return false;
      if (selectedBrand && (product as any).brand?.trim() !== selectedBrand) return false;
      // Sale filter: только товары с акционной ценой
      if (saleOnly && !product.sale_price) return false;
      // Stock filter: в наличии или под заказ
      if (stockFilter !== 'all') {
        const inStock = getInStock(product);
        if (stockFilter === 'inStock' && !inStock) return false;
        if (stockFilter === 'onOrder' && inStock) return false;
      }
      // Price filter from search query string only (no UI slider on this page)
      if (hasPriceInQuery) {
        if (priceFromQuery.min !== undefined && product.price < priceFromQuery.min) return false;
        if (priceFromQuery.max !== undefined && product.price > priceFromQuery.max) return false;
      }
      if (tokens.length > 0 && expanded) {
        const scored = engineScore(product as any, tokens, lang, expanded);
        if (!scored || scored.score <= 0) return false;
      }
      return true;
    });

    // Sort
    if (tokens.length > 0 && sortBy === 'default' && expanded) {
      result = [...result].sort((a, b) => {
        const sa = engineScore(a as any, tokens, lang, expanded)?.score ?? 0;
        const sb = engineScore(b as any, tokens, lang, expanded)?.score ?? 0;
        return sb - sa;
      });
    } else if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, searchTerm, selectedCategory, selectedSubcategory, language, sortBy, selectedBrand, saleOnly, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(allFiltered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedProducts = allFiltered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleCategoryChange = (value: string) => {
    const params: Record<string, string> = {};
    if (value !== 'all') params.category = value;
    setSelectedBrand('');
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('default');
    setSelectedBrand('');
    setStockFilter('all');
    setSaleOnly(false);
    setSearchParams({});
  };

  const scrollCats = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
  };

  const isPriceFiltered = sortBy !== 'default';
  const hasActiveFilters = searchTerm !== '' || selectedCategory !== 'all' || selectedSubcategory !== 'all' || isPriceFiltered || !!selectedBrand || stockFilter !== 'all' || saleOnly;

  const sortIcon = sortBy === 'price-asc'
    ? <ArrowUp className="w-3.5 h-3.5" />
    : sortBy === 'price-desc'
      ? <ArrowDown className="w-3.5 h-3.5" />
      : <ArrowUpDown className="w-3.5 h-3.5" />;

  // ── Pagination helpers ────────────────────────────────────────────────────
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push('...');
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-white">
      <SeoHead
        title={SEO_PAGES.catalog[lang].title}
        description={SEO_PAGES.catalog[lang].description}
        keywords={SEO_PAGES.catalog[lang].keywords}
        canonical="/catalog"
        lang={lang}
      />

      {/* ─── PAGE HEADER ─── */}
      <div className="bg-black text-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl text-white">{t('nav.catalog')}</h1>
            </div>
            <div className="text-right">
              <div className="text-2xl text-white tabular-nums">
                {dbLoading ? '—' : allFiltered.length}
              </div>
              <div className="text-xs text-gray-500">
                {language === 'ro' ? 'produse găsite' : 'товаров найдено'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CATEGORY STRIP ─── */}
      <div className="bg-white border-b border-gray-100 sticky top-[104px] z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">

            {/* Left arrow — always visible, smaller on mobile */}
            <button
              onClick={() => scrollCats('left')}
              className="flex-shrink-0 flex items-center justify-center text-gray-600 hover:text-black transition-colors border-r border-gray-100 w-7 h-[44px] md:w-9 md:h-[52px]"
            >
              <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
            </button>

            <div
              ref={scrollRef}
              className="flex items-center overflow-x-auto flex-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* "All" button — always show label */}
              <button
                onClick={() => handleCategoryChange('all')}
                className={`flex-shrink-0 flex items-center gap-2 border-r border-gray-100 transition-all whitespace-nowrap text-xs uppercase tracking-wider h-[44px] md:h-[52px] px-3 md:px-4 ${
                  selectedCategory === 'all'
                    ? 'bg-black text-white'
                    : 'text-gray-500 hover:text-black hover:bg-gray-50'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{language === 'ro' ? 'Toate' : 'Все'}</span>
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-2 border-r border-gray-100 transition-all whitespace-nowrap text-xs uppercase tracking-wider h-[44px] md:h-[52px] px-3 md:px-4 ${
                    selectedCategory === cat.id
                      ? 'bg-black text-white'
                      : 'text-gray-500 hover:text-black hover:bg-gray-50'
                  }`}
                >
                  <span className="flex-shrink-0">{categoryIcons[cat.id]}</span>
                  <span>{cat.name[language as Language]}</span>
                </button>
              ))}
            </div>

            {/* Right arrow — always visible, smaller on mobile */}
            <button
              onClick={() => scrollCats('right')}
              className="flex-shrink-0 flex items-center justify-center text-gray-600 hover:text-black transition-colors border-l border-gray-100 w-7 h-[44px] md:w-9 md:h-[52px]"
            >
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
            </button>

            {/* ── Sale filter button (desktop + mobile) ── */}
            <button
              onClick={() => setSaleOnly(v => !v)}
              className={`relative flex-shrink-0 flex items-center justify-center border-l border-gray-100 transition-colors w-9 h-[44px] md:w-11 md:h-[52px] ${
                saleOnly
                  ? 'bg-red-500 text-white'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
              title={language === 'ro' ? 'Doar produse la promoție' : 'Только товары по акции'}
            >
              <Zap className={`w-3.5 h-3.5 ${saleOnly ? 'fill-white' : ''}`} />
              {saleOnly && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </button>

            {/* ── Stock filter: mobile = cycle button, desktop = popover ── */}
            {/* Mobile: cycle button */}
            <button
              onClick={() => setStockFilter(v => v === 'all' ? 'inStock' : v === 'inStock' ? 'onOrder' : 'all')}
              className={`md:hidden relative flex-shrink-0 flex items-center justify-center border-l border-gray-100 transition-colors w-9 h-[44px] ${
                stockFilter === 'inStock'
                  ? 'bg-black text-white'
                  : stockFilter === 'onOrder'
                  ? 'bg-gray-400 text-white'
                  : 'text-gray-400 hover:text-black hover:bg-gray-50'
              }`}
              title={
                stockFilter === 'all'
                  ? (language === 'ro' ? 'Toate produsele' : 'Все товары')
                  : stockFilter === 'inStock'
                  ? (language === 'ro' ? 'Doar în stoc' : 'Только в наличии')
                  : (language === 'ro' ? 'Doar la comandă' : 'Только под заказ')
              }
            >
              <Package className="w-3.5 h-3.5" />
              {stockFilter !== 'all' && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </button>

            {/* Desktop: popover */}
            <div className="relative flex-shrink-0 hidden md:block" ref={stockRef}>
              <button
                onClick={() => { setStockPopoverOpen(v => !v); setBrandPopoverOpen(false); }}
                className={`relative w-11 h-[52px] flex items-center justify-center border-l border-gray-100 transition-colors ${
                  stockFilter !== 'all' ? 'text-black' : 'text-gray-400 hover:text-black'
                }`}
                title={language === 'ro' ? 'Filtrare după disponibilitate' : 'Фильтр по наличию'}
              >
                <Package className="w-3.5 h-3.5" />
                {stockFilter !== 'all' && (
                  <span className="absolute top-2.5 right-2 w-1.5 h-1.5 bg-black rounded-full" />
                )}
              </button>

              {stockPopoverOpen && (
                <div
                  className="absolute top-full right-0 bg-white border border-gray-200 shadow-xl z-50"
                  style={{ width: 220 }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                      {language === 'ro' ? 'Disponibilitate' : 'Наличие'}
                    </p>
                    {stockFilter !== 'all' && (
                      <button
                        onClick={() => { setStockFilter('all'); setStockPopoverOpen(false); }}
                        className="text-[10px] text-gray-400 hover:text-black transition-colors flex items-center gap-1 uppercase tracking-wider"
                      >
                        <X className="w-2.5 h-2.5" />
                        {language === 'ro' ? 'Resetează' : 'Сбросит'}
                      </button>
                    )}
                  </div>

                  {/* Options */}
                  <div>
                    {([
                      {
                        value: 'all' as const,
                        label: language === 'ro' ? 'Toate produsele' : 'Все товары',
                      },
                      {
                        value: 'inStock' as const,
                        label: language === 'ro' ? 'În stoc' : 'В наличии',
                      },
                      {
                        value: 'onOrder' as const,
                        label: language === 'ro' ? 'La comandă' : 'Под заказ',
                      },
                    ]).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setStockFilter(opt.value); setStockPopoverOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors border-b border-gray-50 last:border-0 ${
                          stockFilter === opt.value
                            ? 'bg-black text-white'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-black'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {stockFilter === opt.value && (
                            <span className="w-1 h-4 bg-white flex-shrink-0 rounded-full" />
                          )}
                          <span className="uppercase tracking-wider">{opt.label}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Brand + Sort: desktop only (mobile has own toolbar) ── */}
            <div className="relative flex-shrink-0 hidden md:block" ref={brandRef}>
              <button
                onClick={() => { setBrandPopoverOpen(v => !v); }}
                className={`relative w-11 h-[52px] flex items-center justify-center border-l border-gray-100 transition-colors ${
                  selectedBrand ? 'text-black' : 'text-gray-400 hover:text-black'
                }`}
                title={language === 'ro' ? 'Filtrare după brand' : 'Фильтр по бренду'}
              >
                <Tag className="w-3.5 h-3.5" />
                {selectedBrand && (
                  <span className="absolute top-2.5 right-2 w-1.5 h-1.5 bg-black rounded-full" />
                )}
              </button>

              {brandPopoverOpen && (
                <div
                  className="absolute top-full right-0 bg-white border border-gray-200 shadow-xl z-50"
                  style={{ width: 260 }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                      {language === 'ro' ? 'Brand' : 'Бренд'}
                    </p>
                    {selectedBrand && (
                      <button
                        onClick={() => { setSelectedBrand(''); setBrandPopoverOpen(false); }}
                        className="text-[10px] text-gray-400 hover:text-black transition-colors flex items-center gap-1 uppercase tracking-wider"
                      >
                        <X className="w-2.5 h-2.5" />
                        {language === 'ro' ? 'Resetează' : 'Сбросит'}
                      </button>
                    )}
                  </div>

                  {/* Brand list */}
                  <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
                    {availableBrands.length === 0 ? (
                      <div className="px-4 py-6 text-xs text-gray-400 text-center">
                        {language === 'ro' ? 'Niciun brand disponibil' : 'Нет доступных брендов'}
                      </div>
                    ) : (
                      <>
                        {/* All option */}
                        <button
                          onClick={() => { setSelectedBrand(''); setBrandPopoverOpen(false); }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors border-b border-gray-50 ${
                            !selectedBrand ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                          }`}
                        >
                          <span className="uppercase tracking-wider">
                            {language === 'ro' ? 'Toate brandurile' : 'Все бренды'}
                          </span>
                          <span className={`tabular-nums text-[10px] font-mono ${!selectedBrand ? 'text-gray-400' : 'text-gray-300'}`}>
                            {availableBrands.reduce((s, b) => s + b.count, 0)}
                          </span>
                        </button>

                        {/* Individual brands */}
                        {availableBrands.map(({ name, count }) => (
                          <button
                            key={name}
                            onClick={() => { setSelectedBrand(name === selectedBrand ? '' : name); setBrandPopoverOpen(false); }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors border-b border-gray-50 last:border-0 ${
                              selectedBrand === name
                                ? 'bg-black text-white'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-black'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {selectedBrand === name && (
                                <span className="w-1 h-4 bg-white flex-shrink-0 rounded-full" />
                              )}
                              <span>{name}</span>
                            </span>
                            <span className={`tabular-nums text-[10px] font-mono ${selectedBrand === name ? 'text-gray-400' : 'text-gray-300'}`}>
                              {count}
                            </span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Price / Sort icon — desktop only ── */}
            <div className="relative flex-shrink-0 hidden md:block">
              <button
                onClick={() => {
                  setSortBy(s => s === 'default' ? 'price-asc' : s === 'price-asc' ? 'price-desc' : 'default');
                  setBrandPopoverOpen(false);
                }}
                className={`relative w-11 h-[52px] flex items-center justify-center border-l border-gray-100 transition-colors ${
                  isPriceFiltered ? 'text-black' : 'text-gray-400 hover:text-black'
                }`}
                title={
                  sortBy === 'default'
                    ? (language === 'ro' ? 'Sortare preț' : 'Сортировка цены')
                    : sortBy === 'price-asc'
                    ? (language === 'ro' ? 'Preț crescător' : 'Цена по возрастанию')
                    : (language === 'ro' ? 'Preț descrescător' : 'Цена по убыванию')
                }
              >
                {sortIcon}
                {isPriceFiltered && (
                  <span className="absolute top-2.5 right-2 w-1.5 h-1.5 bg-black rounded-full" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile filter toolbar — simple: Filters button + grid toggle ── */}
      <div className="md:hidden bg-white border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 flex items-center h-11">

          {/* Filter button with badge */}
          <button
            onClick={() => setFilterSheetOpen(true)}
            className={`flex items-center gap-2 text-xs transition-colors ${
              hasActiveFilters ? 'text-black' : 'text-gray-400'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="uppercase tracking-wider">
              {language === 'ro' ? 'Filtre' : 'Фильтры'}
            </span>
            {hasActiveFilters && (() => {
              const cnt = [
                selectedCategory !== 'all',
                selectedSubcategory !== 'all',
                !!selectedBrand,
                isPriceFiltered,
                stockFilter !== 'all',
                saleOnly,
              ].filter(Boolean).length;
              return (
                <span className="w-4 h-4 bg-black text-white text-[9px] flex items-center justify-center">
                  {cnt}
                </span>
              );
            })()}
          </button>

          {/* Active filter summary */}
          {(selectedCategory !== 'all' || selectedSubcategory !== 'all' || selectedBrand) && (
            <p className="ml-3 text-[10px] text-gray-400 truncate flex-1 min-w-0">
              {[
                selectedCategory !== 'all' ? currentCategory?.name[language as Language] : null,
                selectedSubcategory !== 'all'
                  ? currentCategory?.subcategories.find(s => s.id === selectedSubcategory)?.name[language as Language]
                  : null,
                selectedBrand || null,
              ].filter(Boolean).join(' · ')}
            </p>
          )}

          <div className="flex-1" />

          {/* Grid / List toggle */}
          <button
            onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
            className={`flex items-center justify-center w-10 h-11 border-l border-gray-100 transition-colors ${
              viewMode === 'list' ? 'text-black' : 'text-gray-400'
            }`}
          >
            {viewMode === 'grid'
              ? <LayoutList className="w-4 h-4" />
              : <LayoutGrid className="w-4 h-4" />
            }
          </button>
        </div>
      </div>

      {/* ─── SUBCATEGORY STRIP — desktop only ─── */}
      {currentCategory && (() => {
        const subScrollRef = { current: null as HTMLDivElement | null };
        const scrollSubs = (dir: 'left' | 'right') => {
          subScrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
        };
        return (
          <div className="hidden md:block bg-gray-50 border-b border-gray-100">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center">
                <button
                  onClick={() => scrollSubs('left')}
                  className="flex-shrink-0 flex items-center justify-center w-6 h-9 text-gray-400 hover:text-black transition-colors border-r border-gray-200"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <div
                  ref={(el) => { subScrollRef.current = el; }}
                  className="flex items-center overflow-x-auto flex-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <button
                    onClick={() => setSearchParams({ category: selectedCategory })}
                    className={`flex-shrink-0 px-4 h-9 text-xs border-r border-gray-200 transition-colors uppercase tracking-wider whitespace-nowrap ${
                      selectedSubcategory === 'all' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-black hover:bg-gray-100'
                    }`}
                  >
                    {t('products.all')}
                  </button>
                  {currentCategory.subcategories.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSearchParams({ category: selectedCategory, subcategory: sub.id })}
                      className={`flex-shrink-0 px-4 h-9 text-xs border-r border-gray-200 transition-colors uppercase tracking-wider whitespace-nowrap ${
                        selectedSubcategory === sub.id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-black hover:bg-gray-100'
                      }`}
                    >
                      {sub.name[language as Language]}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => scrollSubs('right')}
                  className="flex-shrink-0 flex items-center justify-center w-6 h-9 text-gray-400 hover:text-black transition-colors border-l border-gray-200"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── MOBILE FILTER BOTTOM SHEET ─── */}
      {filterSheetOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setFilterSheetOpen(false)}
          />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white flex flex-col max-h-[88vh]">

            {/* Sheet header */}
            <div className="flex items-center justify-between px-4 py-3.5 bg-black text-white flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest">
                  {language === 'ro' ? 'Filtre' : 'Фильтры'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-[10px] text-gray-400 hover:text-white uppercase tracking-wider transition-colors"
                  >
                    {language === 'ro' ? 'Resetează' : 'Сбросить'}
                  </button>
                )}
                <button onClick={() => setFilterSheetOpen(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sheet content — scrollable */}
            <div className="overflow-y-auto flex-1">

              {/* ── Sort ── */}
              <div className="border-b border-gray-100">
                <div className="px-4 pt-3.5 pb-1">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                    {language === 'ro' ? 'Sortare' : 'Сортировка'}
                  </p>
                </div>
                {([
                  {
                    value: 'default' as SortOption,
                    icon: <ArrowUpDown className="w-3.5 h-3.5" />,
                    label: language === 'ro' ? 'Implicit (fără sortare)' : 'По умолчанию',
                  },
                  {
                    value: 'price-asc' as SortOption,
                    icon: <ArrowUp className="w-3.5 h-3.5" />,
                    label: language === 'ro' ? 'Întâi cel mai ieftin' : 'Сначала дешевле',
                  },
                  {
                    value: 'price-desc' as SortOption,
                    icon: <ArrowDown className="w-3.5 h-3.5" />,
                    label: language === 'ro' ? 'Întâi cel mai scump' : 'Сначала дороже',
                  },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-xs border-t border-gray-100 transition-colors ${
                      sortBy === opt.value ? 'bg-gray-900 text-white' : 'text-gray-600'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={sortBy === opt.value ? 'opacity-60' : 'text-gray-400'}>
                        {opt.icon}
                      </span>
                      <span className="uppercase tracking-wider">{opt.label}</span>
                    </span>
                    {sortBy === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                ))}
              </div>

              {/* ── Stock / Availability ── */}
              <div className="border-b border-gray-100">
                <div className="px-4 pt-3.5 pb-1">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                    {language === 'ro' ? 'Disponibilitate' : 'Наличие'}
                  </p>
                </div>
                {([
                  {
                    value: 'all' as const,
                    icon: <LayoutGrid className="w-3.5 h-3.5" />,
                    label: language === 'ro' ? 'Toate produsele' : 'Все товары',
                  },
                  {
                    value: 'inStock' as const,
                    icon: <Package className="w-3.5 h-3.5" />,
                    label: language === 'ro' ? 'În stoc' : 'В наличии',
                  },
                  {
                    value: 'onOrder' as const,
                    icon: <Package className="w-3.5 h-3.5" />,
                    label: language === 'ro' ? 'La comandă' : 'Под заказ',
                  },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStockFilter(opt.value)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-xs border-t border-gray-100 transition-colors ${
                      stockFilter === opt.value ? 'bg-gray-900 text-white' : 'text-gray-600'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={stockFilter === opt.value ? 'opacity-60' : 'text-gray-400'}>
                        {opt.icon}
                      </span>
                      <span className="uppercase tracking-wider">{opt.label}</span>
                    </span>
                    {stockFilter === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                ))}
              </div>

              {/* ── Category ── */}
              <div className="border-b border-gray-100">
                <div className="px-4 pt-3.5 pb-1">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                    {language === 'ro' ? 'Categorie' : 'Категория'}
                  </p>
                </div>
                <button
                  onClick={() => { handleCategoryChange('all'); setFilterSheetOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-xs border-t border-gray-100 transition-colors ${
                    selectedCategory === 'all' ? 'bg-black text-white' : 'text-gray-700'
                  }`}
                >
                  <span className="uppercase tracking-wider">
                    {language === 'ro' ? 'Toate categoriile' : 'Все категории'}
                  </span>
                  {selectedCategory === 'all' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { handleCategoryChange(cat.id); }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-xs border-t border-gray-100 transition-colors ${
                      selectedCategory === cat.id ? 'bg-black text-white' : 'text-gray-700'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={selectedCategory === cat.id ? 'opacity-60' : 'text-gray-400'}>
                        {categoryIcons[cat.id]}
                      </span>
                      <span className="uppercase tracking-wider">{cat.name[language as Language]}</span>
                    </span>
                    {selectedCategory === cat.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                ))}
              </div>

              {/* ── Subcategory (only if category selected) ── */}
              {currentCategory && (
                <div className="border-b border-gray-100">
                  <div className="px-4 pt-3.5 pb-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                      {language === 'ro' ? 'Subcategorie' : 'Подкатегория'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSearchParams({ category: selectedCategory })}
                    className={`w-full flex items-center justify-between px-4 py-3 text-xs border-t border-gray-100 uppercase tracking-wider transition-colors ${
                      selectedSubcategory === 'all' ? 'bg-gray-900 text-white' : 'text-gray-600'
                    }`}
                  >
                    {t('products.all')}
                    {selectedSubcategory === 'all' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                  {currentCategory.subcategories.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSearchParams({ category: selectedCategory, subcategory: sub.id })}
                      className={`w-full flex items-center justify-between px-4 py-3 text-xs border-t border-gray-100 uppercase tracking-wider transition-colors ${
                        selectedSubcategory === sub.id ? 'bg-gray-900 text-white' : 'text-gray-600'
                      }`}
                    >
                      {sub.name[language as Language]}
                      {selectedSubcategory === sub.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Brand ── */}
              {availableBrands.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-4 pt-3.5 pb-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                      {language === 'ro' ? 'Brand' : 'Бренд'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedBrand('')}
                    className={`w-full flex items-center justify-between px-4 py-3 text-xs border-t border-gray-100 uppercase tracking-wider transition-colors ${
                      !selectedBrand ? 'bg-gray-900 text-white' : 'text-gray-600'
                    }`}
                  >
                    <span>{language === 'ro' ? 'Toate brandurile' : 'Все бренды'}</span>
                    <span className={`tabular-nums font-mono text-[10px] ${!selectedBrand ? 'text-gray-400' : 'text-gray-300'}`}>
                      {availableBrands.reduce((s, b) => s + b.count, 0)}
                    </span>
                  </button>
                  {availableBrands.map(({ name, count }) => (
                    <button
                      key={name}
                      onClick={() => setSelectedBrand(name === selectedBrand ? '' : name)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-xs border-t border-gray-100 uppercase tracking-wider transition-colors ${
                        selectedBrand === name ? 'bg-gray-900 text-white' : 'text-gray-600'
                      }`}
                    >
                      <span>{name}</span>
                      <span className={`tabular-nums font-mono text-[10px] ${selectedBrand === name ? 'text-gray-400' : 'text-gray-300'}`}>
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* safe area */}
              <div className="h-2" />
            </div>

            {/* Apply button */}
            <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white">
              <button
                onClick={() => setFilterSheetOpen(false)}
                className="w-full bg-black text-white py-3 text-xs uppercase tracking-widest"
              >
                {language === 'ro'
                  ? `Aplică · ${allFiltered.length} produse`
                  : `Применить · ${allFiltered.length} товаров`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT ─── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">

        {/* ── Supabase loading skeleton ── */}
        {dbLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-100 aspect-square mb-2" />
                <div className="h-3 bg-gray-100 mb-1.5 w-3/4" />
                <div className="h-3 bg-gray-100 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* ── DB error: table not created yet ── */}
        {!dbLoading && dbError && (
          <div className="border border-red-200 bg-red-50 p-8 md:p-12 text-center max-w-2xl mx-auto mt-8">
            <div className="w-10 h-10 bg-red-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-lg font-bold">!</span>
            </div>
            <p className="text-sm text-gray-900 mb-1">
              {language === 'ro' ? 'Eroare la conectarea cu baza de date' : 'Ошибка подключения к базе данных'}
            </p>
            <p className="text-xs text-red-600 font-mono mb-4 break-all">{dbError}</p>
            <div className="bg-white border border-red-100 text-xs text-gray-600 p-4 text-left space-y-2">
              <p className="font-medium text-gray-800">
                {language === 'ro' ? 'Cauze posibile:' : 'Возможные причины:'}
              </p>
              <p>1. {language === 'ro' ? 'Tabelul «products» nu există → rulează schema.sql' : 'Таблица «products» не создана → выполни schema.sql'}</p>
              <p>2. {language === 'ro' ? 'URL sau cheie Supabase greșite' : 'Неверный URL или ключ Supabase'}</p>
              <p>3. {language === 'ro' ? 'Proiectul Supabase este pauzat (plan gratuit)' : 'Проект Supabase на паузе (бесплатный план)'}</p>
              <p className="pt-1 border-t border-red-100 text-gray-400">
                {language === 'ro'
                  ? 'Supabase Dashboard → SQL Editor → New query → вставь schema.sql → Run'
                  : 'Supabase Dashboard → SQL Editor → New query → вставь schema.sql → Run'}
              </p>
            </div>
          </div>
        )}

        {/* ── Connected but no products yet ── */}
        {!dbLoading && !dbError && connected && products.length === 0 && (
          <div className="border border-amber-200 bg-amber-50 p-8 md:p-12 text-center max-w-2xl mx-auto mt-8">
            <div className="w-10 h-10 bg-amber-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-lg font-bold">?</span>
            </div>
            <p className="text-sm text-gray-900 mb-1">
              {language === 'ro' ? 'Nu s-au găsit produse' : 'Товары не найдены'}
            </p>
            <p className="text-xs text-amber-700 mb-4">
              {language === 'ro'
                ? 'Conexiunea cu Supabase funcționează, dar nu există produse active.'
                : 'Подключение к Supabase работает, но активных товаров нет.'}
            </p>
            <div className="bg-white border border-amber-100 text-xs text-gray-600 p-4 text-left space-y-2">
              <p className="font-medium text-gray-800">
                {language === 'ro' ? 'Cauze posibile:' : 'Возможные причины:'}
              </p>
              <p>1. {language === 'ro'
                ? 'RLS (Row Level Security) blochează citirile anonime → adaugă politica SELECT pentru anon'
                : 'RLS (Row Level Security) блокирует чтение → добавь политику SELECT для anon'}
              </p>
              <p className="font-mono bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] text-amber-800 break-all">
                CREATE POLICY "anon_read" ON products FOR SELECT TO anon USING (true);
              </p>
              <p>2. {language === 'ro'
                ? 'Tabelul este gol sau toate produsele au active=false'
                : 'Таблица пуста или все товары имеют active=false'}
              </p>
              <p>3. {language === 'ro'
                ? 'Importă produsele: Table Editor → products → Import data from CSV'
                : 'Импортируй товары: Table Editor → products → Import data from CSV'}
              </p>
            </div>
          </div>
        )}

        {/* ── Normal catalog view ── */}
        {!dbLoading && !dbError && products.length > 0 && (
          <>
            {/* Active filter pills */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                {selectedCategory !== 'all' && (
                  <span className="flex items-center gap-1.5 text-xs bg-black text-white px-3 py-1.5 uppercase tracking-wider">
                    {currentCategory?.name[language as Language]}
                    <button onClick={() => setSearchParams({})} className="ml-1 hover:text-gray-300"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedSubcategory !== 'all' && currentCategory && (
                  <span className="flex items-center gap-1.5 text-xs bg-gray-800 text-white px-3 py-1.5 uppercase tracking-wider">
                    {currentCategory.subcategories.find(s => s.id === selectedSubcategory)?.name[language as Language]}
                    <button onClick={() => setSearchParams({ category: selectedCategory })} className="ml-1 hover:text-gray-300"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedBrand && (
                  <span className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 uppercase tracking-wider">
                    <Tag className="w-3 h-3 text-gray-400" />
                    {selectedBrand}
                    <button onClick={() => setSelectedBrand('')} className="ml-1 hover:text-gray-300"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {stockFilter !== 'all' && (
                  <span className="flex items-center gap-1.5 text-xs bg-gray-700 text-white px-3 py-1.5 uppercase tracking-wider">
                    <Package className="w-3 h-3 text-gray-300" />
                    {stockFilter === 'inStock'
                      ? (language === 'ro' ? 'În stoc' : 'В наличии')
                      : (language === 'ro' ? 'La comandă' : 'Под заказ')}
                    <button onClick={() => setStockFilter('all')} className="ml-1 hover:text-gray-300"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {saleOnly && (
                  <span className="flex items-center gap-1.5 text-xs bg-red-500 text-white px-3 py-1.5 uppercase tracking-wider">
                    <Zap className="w-3 h-3 fill-white" />
                    {language === 'ro' ? 'Promoție' : 'Акция'}
                    <button onClick={() => setSaleOnly(false)} className="ml-1 hover:text-gray-300"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {sortBy !== 'default' && (
                  <span className="flex items-center gap-1.5 text-xs border border-gray-300 text-gray-600 px-3 py-1.5 uppercase tracking-wider">
                    {sortBy === 'price-asc'
                      ? (language === 'ro' ? 'Întâi mai ieftin' : 'Сначала дешевле')
                      : (language === 'ro' ? 'Întâi mai scump' : 'Сначала дороже')}
                    <button onClick={() => setSortBy('default')} className="ml-1 hover:text-black"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {searchTerm && (
                  <span className="flex items-center gap-1.5 text-xs border border-gray-300 text-gray-600 px-3 py-1.5">
                    <Search className="w-3 h-3" />
                    "{searchTerm}"
                    <button onClick={() => { setSearchTerm(''); setSearchParams({}); }} className="ml-1 hover:text-black"><X className="w-3 h-3" /></button>
                  </span>
                )}
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-gray-400 hover:text-black transition-colors ml-1">
                  <X className="w-3 h-3" />
                  {language === 'ro' ? 'Șterge tot' : 'Сбросить всё'}
                </button>
              </div>
            )}

            {/* Results info */}
            {allFiltered.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-400">
                  {language === 'ro'
                    ? `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, allFiltered.length)} din ${allFiltered.length} produse`
                    : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, allFiltered.length)} из ${allFiltered.length} товаров`}
                </p>
                {searchTerm && (
                  <p className="text-xs text-gray-400">
                    {language === 'ro' ? 'Sortat după relevanță' : 'Отсортировано по релевантности'}
                  </p>
                )}
              </div>
            )}

            {/* Products grid */}
            {paginatedProducts.length > 0 ? (
              <>
                <div className={
                  viewMode === 'list'
                    ? 'flex flex-col gap-2 md:grid md:grid-cols-3 md:gap-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
                    : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3'
                }>
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      listView={viewMode === 'list'}
                      onBrandClick={(brandName) => {
                        setSelectedBrand(brandName);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    />
                  ))}
                </div>

                {/* ─── PAGINATION ─── */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-10">
                    {/* Prev */}
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="flex items-center justify-center w-9 h-9 border border-gray-200 text-gray-400 hover:text-black hover:border-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {getPageNumbers().map((n, i) =>
                      n === '...' ? (
                        <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-xs text-gray-400">
                          …
                        </span>
                      ) : (
                        <button
                          key={n}
                          onClick={() => setPage(n as number)}
                          className={`w-9 h-9 text-xs border transition-colors ${
                            safePage === n
                              ? 'bg-black text-white border-black'
                              : 'border-gray-200 text-gray-600 hover:border-black hover:text-black'
                          }`}
                        >
                          {n}
                        </button>
                      )
                    )}

                    {/* Next */}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="flex items-center justify-center w-9 h-9 border border-gray-200 text-gray-400 hover:text-black hover:border-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Page info */}
                {totalPages > 1 && (
                  <p className="text-center text-xs text-gray-400 mt-3">
                    {language === 'ro' ? `Pagina ${safePage} din ${totalPages}` : `Страница ${safePage} из ${totalPages}`}
                  </p>
                )}
              </>
            ) : (
              <div className="bg-gray-50 border border-gray-100 p-16 md:p-24 text-center">
                <div className="w-12 h-12 bg-gray-200 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm">{t('products.noResults')}</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-xs text-black border border-black px-5 py-2 hover:bg-black hover:text-white transition-colors uppercase tracking-wider"
                >
                  {language === 'ro' ? 'Șterge filtrele' : 'Сбросить фильтры'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}