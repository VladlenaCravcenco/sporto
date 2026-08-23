import { usePaginatedCatalogProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseBrands } from '../hooks/useSupabaseBrands';
import { SeoHead, SEO_PAGES, buildBreadcrumbJsonLd } from '../components/SeoHead';
import {
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  LayoutList,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Tag,
  Zap,
  Package,
  ShieldCheck,
  ArrowUpRight,
  Check,
} from 'lucide-react';
import { useState, useMemo, useRef, useEffect, useDeferredValue } from 'react';
import { getCategoryIcon } from '../lib/category-icons';
import { Link, useSearchParams } from 'react-router';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { useCategories } from '../contexts/CategoriesContext';
import { ProductCard } from '../components/ProductCard';
import { AnimatePresence, motion } from 'motion/react';
import { getAttributeUnit, resolveProductIdsForAttributeFilters, useCatalogAttributeFilters } from '../hooks/useProductAttributes';

type SortOption = 'default' | 'price-asc' | 'price-desc';
type FilterSectionId = 'sort' | 'stock' | 'category' | 'subcategory' | 'brand' | 'offers' | 'warranty';
type StockFilter = 'all' | 'inStock' | 'onOrder';
type MobileFilterDraft = {
  categories: string[];
  subcategories: string[];
  brands: string[];
  sortBy: SortOption;
  stockFilter: StockFilter;
  saleOnly: boolean;
  warrantyOnly: boolean;
};

const PAGE_SIZE = 24;

export function Catalog() {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const lang = language as Language;
  const categories = useCategories();

  // ── Supabase ────────────────────────────────────────────────────────
  const { brands: allBrands } = useSupabaseBrands();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get('subcategory') || 'all');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [page, setPage] = useState(1);
  const [saleOnly, setSaleOnly] = useState(searchParams.get('sale') === 'true');
  const [warrantyOnly, setWarrantyOnly] = useState(searchParams.get('warranty') === 'true');

  const [brandPopoverOpen, setBrandPopoverOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [mobileFilterDraft, setMobileFilterDraft] = useState<MobileFilterDraft>({
    categories: searchParams.getAll('category'),
    subcategories: searchParams.getAll('subcategory'),
    brands: searchParams.getAll('brand'),
    sortBy,
    stockFilter: (searchParams.get('stock') as StockFilter) || 'all',
    saleOnly,
    warrantyOnly,
  });
  const [mobileAttributeDraft, setMobileAttributeDraft] = useState<Record<string, string[]>>({});
  const [openFilterSections, setOpenFilterSections] = useState<Record<FilterSectionId, boolean>>({
    sort: false,
    stock: false,
    category: false,
    subcategory: false,
    brand: false,
    offers: false,
    warranty: false,
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [stockFilter, setStockFilter] = useState<StockFilter>(
    (searchParams.get('stock') as StockFilter) || 'all',
  );
  const [stockPopoverOpen, setStockPopoverOpen] = useState(false);
  const [showAllDesktopSubcategories, setShowAllDesktopSubcategories] = useState(false);
  const [showAllDesktopBrands, setShowAllDesktopBrands] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const categoryDragRef = useRef({ active: false, dragged: false, startX: 0, scrollLeft: 0 });
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
    const warranty = searchParams.get('warranty') === 'true';
    const sort = searchParams.get('sort');
    const stock = searchParams.get('stock');
    setSelectedCategory(cat);
    setSelectedSubcategory(sub);
    setSearchTerm(q);
    setSelectedBrand(br);
    setSaleOnly(sale);
    setWarrantyOnly(warranty);
    setSortBy(sort === 'price-asc' || sort === 'price-desc' ? sort : 'default');
    setStockFilter(stock === 'inStock' || stock === 'onOrder' ? stock : 'all');
    setPage(1);
  }, [searchParams]);

  // ── Reset page on filter change ──────────────────────────────────────────
  useEffect(() => { setPage(1); }, [selectedCategory, selectedSubcategory, sortBy, selectedBrand, saleOnly, warrantyOnly, stockFilter, searchTerm]);

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

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      event.preventDefault();
      container.scrollLeft += delta;
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const currentCategory = categories.find((c) => c.id === selectedCategory);
  const currentSubcategory = currentCategory?.subcategories.find((s) => s.id === selectedSubcategory);
  const searchParamsKey = searchParams.toString();
  const { appliedCategories, appliedSubcategories, appliedBrands } = useMemo(() => {
    const params = new URLSearchParams(searchParamsKey);
    return {
      appliedCategories: params.getAll('category'),
      appliedSubcategories: params.getAll('subcategory'),
      appliedBrands: params.getAll('brand'),
    };
  }, [searchParamsKey]);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const attributeSelections = useMemo(() => {
    const selections: Record<string, string[]> = {};
    new URLSearchParams(searchParamsKey).forEach((value, key) => {
      if (!key.startsWith('attr.')) return;
      const attributeId = key.slice(5);
      selections[attributeId] = [...(selections[attributeId] ?? []), value];
    });
    return selections;
  }, [searchParamsKey]);
  const { filters: dynamicCatalogFilters } = useCatalogAttributeFilters(currentCategory?.id);
  const mobileAttributeCategory = mobileFilterDraft.categories.length === 1 ? mobileFilterDraft.categories[0] : undefined;
  const { filters: mobileDynamicCatalogFilters } = useCatalogAttributeFilters(mobileAttributeCategory);
  const [attributeProductIds, setAttributeProductIds] = useState<string[] | undefined>(undefined);
  const [mobileAttributeProductIds, setMobileAttributeProductIds] = useState<string[] | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    resolveProductIdsForAttributeFilters(attributeSelections).then((ids) => {
      if (!cancelled) setAttributeProductIds(ids ?? undefined);
    });
    return () => { cancelled = true; };
  }, [attributeSelections]);

  useEffect(() => {
    let cancelled = false;
    resolveProductIdsForAttributeFilters(mobileAttributeDraft).then((ids) => {
      if (!cancelled) setMobileAttributeProductIds(ids ?? undefined);
    });
    return () => { cancelled = true; };
  }, [mobileAttributeDraft]);

  const catalogSeo = useMemo(() => {
    const catalogDefaults = SEO_PAGES.catalog[lang];
    const categoryName = currentCategory?.name[lang];
    const subcategoryName = currentSubcategory?.name[lang];
    const canonicalParams = new URLSearchParams();

    if (currentCategory) canonicalParams.set('category', currentCategory.id);
    if (currentCategory && currentSubcategory) canonicalParams.set('subcategory', currentSubcategory.id);
    if (lang === 'ru') canonicalParams.set('lang', 'ru');

    const canonical = `/catalog${canonicalParams.size ? `?${canonicalParams.toString()}` : ''}`;

    if (currentCategory && currentSubcategory && subcategoryName && categoryName) {
      return {
        title: lang === 'ro'
          ? `${subcategoryName} în Chișinău | Sporto Moldova`
          : `${subcategoryName} в Кишинёве | Sporto Молдова`,
        description: lang === 'ro'
          ? `${subcategoryName} din categoria ${categoryName}, disponibile în Moldova prin Sporto. Vezi produsele, prețurile și solicită o ofertă.`
          : `${subcategoryName} из категории «${categoryName}» в Молдове от Sporto. Смотрите товары и цены, запрашивайте предложение.`,
        keywords: lang === 'ro'
          ? `${subcategoryName}, ${categoryName}, echipament sportiv Moldova, Sporto Chișinău`
          : `${subcategoryName}, ${categoryName}, спортивное оборудование Молдова, Sporto Кишинёв`,
        canonical,
      };
    }

    if (currentCategory && categoryName) {
      const categoryDescription = currentCategory.description[lang]?.trim();
      return {
        title: lang === 'ro'
          ? `${categoryName} în Chișinău | Sporto Moldova`
          : `${categoryName} в Кишинёве | Sporto Молдова`,
        description: categoryDescription || (lang === 'ro'
          ? `${categoryName} disponibile în Moldova prin Sporto. Vezi produsele, prețurile și solicită o ofertă.`
          : `${categoryName} в Молдове от Sporto. Смотрите товары и цены, запрашивайте предложение.`),
        keywords: lang === 'ro'
          ? `${categoryName}, echipament sportiv Moldova, Sporto Chișinău`
          : `${categoryName}, спортивное оборудование Молдова, Sporto Кишинёв`,
        canonical,
      };
    }

    return { ...catalogDefaults, canonical };
  }, [currentCategory, currentSubcategory, lang]);

  const catalogHeading = currentSubcategory?.name[lang] || currentCategory?.name[lang] || t('nav.catalog');
  const catalogBreadcrumbs = [
    { name: lang === 'ro' ? 'Acasă' : 'Главная', url: lang === 'ru' ? 'https://www.sporto.md/ru' : 'https://www.sporto.md/' },
    { name: lang === 'ro' ? 'Catalog' : 'Каталог', url: `https://www.sporto.md/catalog${lang === 'ru' ? '?lang=ru' : ''}` },
    ...(currentCategory ? [{
      name: currentCategory.name[lang],
      url: `https://www.sporto.md/catalog?category=${encodeURIComponent(currentCategory.id)}${lang === 'ru' ? '&lang=ru' : ''}`,
    }] : []),
    ...(currentCategory && currentSubcategory ? [{
      name: currentSubcategory.name[lang],
      url: `https://www.sporto.md${catalogSeo.canonical}`,
    }] : []),
  ];

  const { products, total: totalProducts, loading: dbLoading, error: dbError, connected } = usePaginatedCatalogProducts({
    page,
    pageSize: PAGE_SIZE,
    category: appliedCategories.length > 1 ? appliedCategories : selectedCategory,
    subcategory: appliedSubcategories.length > 1 ? appliedSubcategories : selectedSubcategory,
    brand: appliedBrands.length > 1 ? appliedBrands : (selectedBrand || undefined),
    productIds: attributeProductIds,
    saleOnly,
    warrantyOnly,
    stockFilter,
    searchTerm: deferredSearchTerm,
    sortBy,
    prioritizeBrand: selectedCategory === 'all'
      && selectedSubcategory === 'all'
      && !selectedBrand
      && !saleOnly
      && !warrantyOnly
      && stockFilter === 'all'
      && !deferredSearchTerm.trim()
      && sortBy === 'default'
      && Object.keys(attributeSelections).length === 0
        ? 'inSPORTline'
        : undefined,
  });
  const {
    total: mobileFilterTotal,
    loading: mobileFilterLoading,
  } = usePaginatedCatalogProducts({
    page: 1,
    pageSize: 1,
    category: mobileFilterDraft.categories,
    subcategory: mobileFilterDraft.subcategories,
    brand: mobileFilterDraft.brands,
    productIds: mobileAttributeProductIds,
    saleOnly: mobileFilterDraft.saleOnly,
    warrantyOnly: mobileFilterDraft.warrantyOnly,
    stockFilter: mobileFilterDraft.stockFilter,
    searchTerm: deferredSearchTerm,
    sortBy: mobileFilterDraft.sortBy,
  });
  const displayProducts = products;
  const displayTotal = totalProducts;
  const displayLoading = dbLoading;
  const displayError = dbError;
  const displayConnected = connected;

  const availableBrands = useMemo(() => {
    return allBrands.filter((brand) => brand.active !== false).map((brand) => ({ name: brand.name, count: 1 }));
  }, [allBrands]);
  const selectedBrandData = useMemo(
    () => allBrands.find((brand) => brand.name.toLowerCase() === selectedBrand.toLowerCase()),
    [allBrands, selectedBrand],
  );
  const desktopSubcategories = useMemo(() => {
    if (!currentCategory || showAllDesktopSubcategories) return currentCategory?.subcategories ?? [];
    const visible = currentCategory.subcategories.slice(0, 5);
    const selected = currentCategory.subcategories.find((subcategory) => subcategory.id === selectedSubcategory);
    return selected && !visible.some((subcategory) => subcategory.id === selected.id)
      ? [...visible.slice(0, 4), selected]
      : visible;
  }, [currentCategory, selectedSubcategory, showAllDesktopSubcategories]);
  const desktopBrands = useMemo(() => {
    if (showAllDesktopBrands) return availableBrands;
    const visible = availableBrands.slice(0, 5);
    const selected = availableBrands.find((brand) => brand.name === selectedBrand);
    return selected && !visible.some((brand) => brand.name === selected.name)
      ? [...visible.slice(0, 4), selected]
      : visible;
  }, [availableBrands, selectedBrand, showAllDesktopBrands]);

  const totalPages = Math.max(1, Math.ceil(displayTotal / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (!displayLoading && page > totalPages) {
      setPage(totalPages);
    }
  }, [displayLoading, page, totalPages]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleCategoryChange = (value: string) => {
    const params: Record<string, string> = {};
    if (value !== 'all') params.category = value;
    setSelectedBrand('');
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSortBy('default');
    setSelectedBrand('');
    setStockFilter('all');
    setSaleOnly(false);
    setWarrantyOnly(false);
    setSearchParams({});
  };

  const setAttributeSelection = (attributeId: string, values: string[]) => {
    const params = new URLSearchParams(searchParams);
    params.delete(`attr.${attributeId}`);
    values.forEach((value) => params.append(`attr.${attributeId}`, value));
    setSearchParams(params);
  };

  const setMobileAttributeSelection = (attributeId: string, values: string[]) => {
    setMobileAttributeDraft((current) => {
      if (values.length === 0) {
        const next = { ...current };
        delete next[attributeId];
        return next;
      }
      return { ...current, [attributeId]: values };
    });
  };

  const openMobileFilters = () => {
    setMobileFilterDraft({
      categories: appliedCategories,
      subcategories: appliedSubcategories,
      brands: appliedBrands,
      sortBy,
      stockFilter,
      saleOnly,
      warrantyOnly,
    });
    setMobileAttributeDraft(attributeSelections);
    setFilterSheetOpen(true);
  };

  const clearMobileFilters = () => {
    setMobileFilterDraft({
      categories: [],
      subcategories: [],
      brands: [],
      sortBy: 'default',
      stockFilter: 'all',
      saleOnly: false,
      warrantyOnly: false,
    });
    setMobileAttributeDraft({});
  };

  const applyMobileFilters = () => {
    const params = new URLSearchParams();
    const query = searchTerm.trim();
    if (query) params.set('search', query);
    mobileFilterDraft.categories.forEach((category) => params.append('category', category));
    mobileFilterDraft.subcategories.forEach((subcategory) => params.append('subcategory', subcategory));
    mobileFilterDraft.brands.forEach((brand) => params.append('brand', brand));
    Object.entries(mobileAttributeDraft).forEach(([attributeId, values]) => {
      values.forEach((value) => params.append(`attr.${attributeId}`, value));
    });
    if (mobileFilterDraft.saleOnly) params.set('sale', 'true');
    if (mobileFilterDraft.warrantyOnly) params.set('warranty', 'true');
    if (mobileFilterDraft.sortBy !== 'default') params.set('sort', mobileFilterDraft.sortBy);
    if (mobileFilterDraft.stockFilter !== 'all') params.set('stock', mobileFilterDraft.stockFilter);

    setSearchParams(params);
    setFilterSheetOpen(false);
  };

  const mobileDraftCategories = categories.filter((category) => mobileFilterDraft.categories.includes(category.id));
  const mobileDraftSubcategories = categories
    .filter((category) => mobileFilterDraft.categories.length === 0 || mobileFilterDraft.categories.includes(category.id))
    .flatMap((category) => category.subcategories);
  const mobileDraftHasActiveFilters = mobileFilterDraft.categories.length > 0
    || mobileFilterDraft.subcategories.length > 0
    || mobileFilterDraft.brands.length > 0
    || mobileFilterDraft.sortBy !== 'default'
    || mobileFilterDraft.stockFilter !== 'all'
    || mobileFilterDraft.saleOnly
    || mobileFilterDraft.warrantyOnly
    || Object.keys(mobileAttributeDraft).length > 0;

  const scrollCats = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
  };

  const toggleFilterSection = (section: FilterSectionId) => {
    setOpenFilterSections((current) => ({ ...current, [section]: !current[section] }));
  };

  const filterSection = (
    id: FilterSectionId,
    title: string,
    summary: string,
    children: React.ReactNode,
  ) => (
    <div className="border-b border-gray-100">
      <button
        type="button"
        onClick={() => toggleFilterSection(id)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
          openFilterSections[id] ? 'bg-black text-white' : 'bg-white text-gray-900'
        }`}
      >
        <div className="min-w-0">
          <p className="text-xs">{title}</p>
          <p className={`text-[10px] truncate ${openFilterSections[id] ? 'text-gray-400' : 'text-gray-400'}`}>{summary}</p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${openFilterSections[id] ? 'rotate-180 text-white' : 'text-gray-400'}`} />
      </button>
      {openFilterSections[id] && (
        <div className="pb-2">
          {children}
        </div>
      )}
    </div>
  );

  const filterOptionClass = () =>
    'w-full flex items-center justify-between gap-3 px-4 py-2 text-[13px] text-gray-700 border-t border-gray-50 transition-colors hover:bg-gray-50';

  const filterCheckbox = (selected: boolean) => (
    <span className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 ${selected ? 'border-black bg-black' : 'border-gray-300 bg-white'}`}>
      {selected && <span className="w-1.5 h-2.5 border-r border-b border-white rotate-45 -translate-y-px" />}
    </span>
  );

  const toggleDraftValue = (key: 'categories' | 'subcategories' | 'brands', value: string) => {
    setMobileFilterDraft((draft) => ({
      ...draft,
      [key]: draft[key].includes(value)
        ? draft[key].filter((item) => item !== value)
        : [...draft[key], value],
    }));
  };

  const startCategoryDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;

    const container = event.currentTarget;
    categoryDragRef.current = {
      active: true,
      dragged: false,
      startX: event.clientX,
      scrollLeft: container.scrollLeft,
    };
  };

  const moveCategoryDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = categoryDragRef.current;
    if (!drag.active) return;

    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) > 4 && !drag.dragged) {
      drag.dragged = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.classList.add('cursor-grabbing', 'select-none');
    }
    if (!drag.dragged) return;
    event.currentTarget.scrollLeft = drag.scrollLeft - distance;
  };

  const stopCategoryDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!categoryDragRef.current.active) return;
    categoryDragRef.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    event.currentTarget.classList.remove('cursor-grabbing', 'select-none');
    window.setTimeout(() => {
      categoryDragRef.current.dragged = false;
    }, 0);
  };

  const preventCategoryClickAfterDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!categoryDragRef.current.dragged) return;
    event.preventDefault();
    event.stopPropagation();
    categoryDragRef.current.dragged = false;
  };

  const isPriceFiltered = sortBy !== 'default';
  const hasActiveFilters = searchTerm !== '' || selectedCategory !== 'all' || selectedSubcategory !== 'all' || isPriceFiltered || !!selectedBrand || stockFilter !== 'all' || saleOnly || warrantyOnly || Object.keys(attributeSelections).length > 0;

  const sortIcon = sortBy === 'price-asc'
    ? <ArrowUp className="w-3.5 h-3.5" />
    : sortBy === 'price-desc'
      ? <ArrowDown className="w-3.5 h-3.5" />
      : <ArrowUpDown className="w-3.5 h-3.5" />;

  const mobileAppliedFilters = [
    ...appliedBrands,
    stockFilter === 'inStock'
      ? (language === 'ro' ? 'În stoc' : 'В наличии')
      : stockFilter === 'onOrder'
      ? (language === 'ro' ? 'La comandă' : 'Под заказ')
      : null,
    saleOnly ? (language === 'ro' ? 'Promoție' : 'Акция') : null,
    warrantyOnly ? (language === 'ro' ? 'Cu garanție' : 'С гарантией') : null,
    sortBy === 'price-asc'
      ? (language === 'ro' ? 'Întâi mai ieftin' : 'Сначала дешевле')
      : sortBy === 'price-desc'
      ? (language === 'ro' ? 'Întâi mai scump' : 'Сначала дороже')
      : null,
    searchTerm ? `"${searchTerm}"` : null,
  ].filter(Boolean).join(', ');

  const catalogPath = (
    <div className="flex items-center gap-1.5 text-xs text-gray-400 overflow-x-auto whitespace-nowrap scrollbar-none">
      <Link
        to={language === 'ru' ? '/ru' : '/'}
        className="shrink-0 hover:text-gray-900 transition-colors"
      >
        {language === 'ro' ? 'Acasă' : 'Главная'}
      </Link>
      <span>/</span>
      {currentCategory ? (
        <Link to="/catalog" className="shrink-0 hover:text-gray-900 transition-colors">
          {language === 'ro' ? 'Catalog' : 'Каталог'}
        </Link>
      ) : (
        <span className="text-gray-600 shrink-0">{language === 'ro' ? 'Catalog' : 'Каталог'}</span>
      )}
      {currentCategory && (
        <>
          <span>/</span>
          {currentSubcategory ? (
            <Link
              to={`/catalog?category=${currentCategory.id}`}
              className="shrink-0 hover:text-gray-900 transition-colors"
            >
              {currentCategory.name[lang]}
            </Link>
          ) : (
            <span className="text-gray-600 shrink-0">{currentCategory.name[lang]}</span>
          )}
        </>
      )}
      {currentSubcategory && (
        <>
          <span>/</span>
          <span className="text-gray-600 shrink-0">{currentSubcategory.name[lang]}</span>
        </>
      )}
    </div>
  );

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
    <div className="min-h-screen bg-[#f5f6f7]">
      <SeoHead
        title={catalogSeo.title}
        description={catalogSeo.description}
        keywords={catalogSeo.keywords}
        canonical={catalogSeo.canonical}
        lang={lang}
        jsonLd={buildBreadcrumbJsonLd(catalogBreadcrumbs)}
      />

      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {catalogPath}
        </div>
      </div>

      {/* ─── MOBILE PAGE HEADER ─── */}
      <div className="md:hidden bg-black text-white px-4 pt-4 pb-4">
        <div className="flex items-end justify-between gap-3">
          <h1 className="text-xl leading-tight text-white">{catalogHeading}</h1>
          <span className="flex-shrink-0 text-xs text-gray-400 tabular-nums">
            {displayLoading ? '—' : displayTotal} {language === 'ro' ? 'produse' : 'товаров'}
          </span>
        </div>
      </div>

      {/* ─── PAGE HEADER — desktop ─── */}
      <div className="hidden md:block bg-black text-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl text-white">{catalogHeading}</h1>
            </div>
            <div className="text-right">
              <div className="text-2xl text-white tabular-nums">
                {displayLoading ? '—' : displayTotal}
              </div>
              <div className="text-xs text-gray-500">
                {language === 'ro' ? 'produse găsite' : 'товаров найдено'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CATEGORY STRIP ─── */}
      <div className="hidden md:block bg-white border-b border-gray-100 sticky top-[104px] z-40">
        <div className="max-w-[1600px] mx-auto px-0 md:px-6 lg:px-8">
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
              onPointerDown={startCategoryDrag}
              onPointerMove={moveCategoryDrag}
              onPointerUp={stopCategoryDrag}
              onPointerCancel={stopCategoryDrag}
              onClickCapture={preventCategoryClickAfterDrag}
              className="flex items-center overflow-x-auto flex-1 cursor-grab"
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
                  <span className="flex-shrink-0">{getCategoryIcon(cat.icon)}</span>
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
              className={`hidden relative flex-shrink-0 items-center justify-center border-l border-gray-100 transition-colors w-9 h-[44px] md:w-11 md:h-[52px] ${
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
            <div className="hidden" ref={stockRef}>
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
            <div className="hidden" ref={brandRef}>
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
            <div className="hidden">
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

      {selectedCategory === 'all' && appliedCategories.length === 0 && appliedSubcategories.length === 0 && (
        <section className="md:hidden bg-gray-50 border-b border-gray-100 px-4 py-5">
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category, i) => (
              <Link
                key={category.id}
                to={`/catalog?category=${category.id}`}
                className={`group border transition-colors ${
                  i === 0
                    ? 'col-span-2 flex items-center gap-3 p-4 bg-black border-black text-white'
                    : 'min-h-[112px] flex flex-col justify-between p-3 bg-white border-gray-200 text-gray-900'
                }`}
              >
                {i === 0 ? (
                  <>
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white/10 text-white">
                      {getCategoryIcon(category.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs uppercase tracking-wider leading-tight text-white">
                        {category.name[language as Language]}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        {category.subcategories.length} {language === 'ro' ? 'sub.' : 'подкат.'}
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500">
                        {getCategoryIcon(category.icon)}
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider leading-tight text-gray-900">
                        {category.name[language as Language]}
                      </div>
                      <div className="text-[10px] mt-1 text-gray-400">
                        {category.subcategories.length} {language === 'ro' ? 'sub.' : 'подкат.'}
                      </div>
                    </div>
                  </>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── Mobile filter toolbar — simple: Filters button + grid toggle ── */}
      <div className="md:hidden bg-white border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 flex items-start min-h-11 py-2 gap-3">

          {/* Filter button with badge */}
          <button
            onClick={openMobileFilters}
            className={`flex-shrink-0 flex items-center gap-1.5 text-xs transition-colors pt-0.5 ${
              hasActiveFilters ? 'text-black' : 'text-gray-400'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>
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

          {mobileAppliedFilters && (
            <p className="flex-1 min-w-0 text-[10px] leading-4 text-gray-400">
              {mobileAppliedFilters}
            </p>
          )}

          {!mobileAppliedFilters && <div className="flex-1" />}

          {/* Grid / List toggle */}
          <button
            onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
            className={`flex-shrink-0 flex items-center justify-center w-8 h-7 border-l border-gray-100 transition-colors ${
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
          <div className="hidden bg-gray-50 border-b border-gray-100">
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
      <AnimatePresence>
      {filterSheetOpen && (
        <motion.div
          className="fixed inset-0 z-[200] md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60"
            onClick={() => setFilterSheetOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          {/* Sheet */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-white flex flex-col max-h-[88vh]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >

            {/* Sheet header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-black text-white flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="text-sm">
                  {language === 'ro' ? 'Filtre' : 'Фильтры'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                {mobileDraftHasActiveFilters && (
                  <button
                    onClick={clearMobileFilters}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
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
              {filterSection(
                'sort',
                language === 'ro' ? 'Sortare' : 'Сортировка',
                mobileFilterDraft.sortBy === 'default'
                  ? (language === 'ro' ? 'Implicit' : 'По умолчанию')
                  : mobileFilterDraft.sortBy === 'price-asc'
                  ? (language === 'ro' ? 'Preț crescător' : 'Цена по возрастанию')
                  : (language === 'ro' ? 'Preț descrescător' : 'Цена по убыванию'),
                <>
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
                    onClick={() => setMobileFilterDraft((draft) => ({ ...draft, sortBy: opt.value }))}
                    className={filterOptionClass()}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className={mobileFilterDraft.sortBy === opt.value ? 'opacity-60' : 'text-gray-400'}>
                        {opt.icon}
                      </span>
                      <span className="truncate">{opt.label}</span>
                    </span>
                    {filterCheckbox(mobileFilterDraft.sortBy === opt.value)}
                  </button>
                ))}
                </>,
              )}

              {/* ── Stock / Availability ── */}
              {filterSection(
                'stock',
                language === 'ro' ? 'Disponibilitate' : 'Наличие',
                mobileFilterDraft.stockFilter === 'all'
                  ? (language === 'ro' ? 'Toate produsele' : 'Все товары')
                  : mobileFilterDraft.stockFilter === 'inStock'
                  ? (language === 'ro' ? 'În stoc' : 'В наличии')
                  : (language === 'ro' ? 'La comandă' : 'Под заказ'),
                <>
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
                    onClick={() => setMobileFilterDraft((draft) => ({ ...draft, stockFilter: opt.value }))}
                    className={filterOptionClass()}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className={mobileFilterDraft.stockFilter === opt.value ? 'opacity-60' : 'text-gray-400'}>
                        {opt.icon}
                      </span>
                      <span className="truncate">{opt.label}</span>
                    </span>
                    {filterCheckbox(mobileFilterDraft.stockFilter === opt.value)}
                  </button>
                ))}
                </>,
              )}

              {/* ── Offers ── */}
              {filterSection(
                'offers',
                language === 'ro' ? 'Promoții' : 'Акции',
                mobileFilterDraft.saleOnly
                  ? (language === 'ro' ? 'Doar produse la promoție' : 'Только товары по акции')
                  : (language === 'ro' ? 'Toate produsele' : 'Все товары'),
                <>
                  <button
                    onClick={() => setMobileFilterDraft((draft) => ({ ...draft, saleOnly: false }))}
                    className={filterOptionClass()}
                  >
                    <span>{language === 'ro' ? 'Toate produsele' : 'Все товары'}</span>
                    {filterCheckbox(!mobileFilterDraft.saleOnly)}
                  </button>
                  <button
                    onClick={() => setMobileFilterDraft((draft) => ({ ...draft, saleOnly: true }))}
                    className={filterOptionClass()}
                  >
                    <span className="flex items-center gap-2.5">
                      <Zap className="w-3.5 h-3.5" />
                      {language === 'ro' ? 'Doar produse la promoție' : 'Только товары по акции'}
                    </span>
                    {filterCheckbox(mobileFilterDraft.saleOnly)}
                  </button>
                </>,
              )}

              {/* ── Warranty ── */}
              {filterSection(
                'warranty',
                language === 'ro' ? 'Garanție' : 'Гарантия',
                mobileFilterDraft.warrantyOnly
                  ? (language === 'ro' ? 'Doar produse cu garanție' : 'Только товары с гарантией')
                  : (language === 'ro' ? 'Toate produsele' : 'Все товары'),
                <>
                  <button
                    onClick={() => setMobileFilterDraft((draft) => ({ ...draft, warrantyOnly: false }))}
                    className={filterOptionClass()}
                  >
                    <span>{language === 'ro' ? 'Toate produsele' : 'Все товары'}</span>
                    {filterCheckbox(!mobileFilterDraft.warrantyOnly)}
                  </button>
                  <button
                    onClick={() => setMobileFilterDraft((draft) => ({ ...draft, warrantyOnly: true }))}
                    className={filterOptionClass()}
                  >
                    <span className="flex items-center gap-2.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {language === 'ro' ? 'Doar produse cu garanție' : 'Только товары с гарантией'}
                    </span>
                    {filterCheckbox(mobileFilterDraft.warrantyOnly)}
                  </button>
                </>,
              )}

              {/* ── Category ── */}
              {filterSection(
                'category',
                language === 'ro' ? 'Categorie' : 'Категория',
                mobileFilterDraft.categories.length === 0
                  ? (language === 'ro' ? 'Toate categoriile' : 'Все категории')
                  : mobileDraftCategories.map((category) => category.name[language as Language]).join(', '),
                <>
                <button
                  onClick={() => setMobileFilterDraft((draft) => ({ ...draft, categories: [], subcategories: [] }))}
                  className={filterOptionClass()}
                >
                  <span>
                    {language === 'ro' ? 'Toate categoriile' : 'Все категории'}
                  </span>
                  {filterCheckbox(mobileFilterDraft.categories.length === 0)}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      const removing = mobileFilterDraft.categories.includes(cat.id);
                      setMobileFilterDraft((draft) => ({
                        ...draft,
                        categories: removing
                          ? draft.categories.filter((item) => item !== cat.id)
                          : [...draft.categories, cat.id],
                        subcategories: removing
                          ? draft.subcategories.filter((subcategory) => !cat.subcategories.some((item) => item.id === subcategory))
                          : draft.subcategories,
                      }));
                    }}
                    className={filterOptionClass()}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className="text-gray-400">
                        {getCategoryIcon(cat.icon)}
                      </span>
                      <span className="truncate">{cat.name[language as Language]}</span>
                    </span>
                    {filterCheckbox(mobileFilterDraft.categories.includes(cat.id))}
                  </button>
                ))}
                </>,
              )}

              {/* ── Subcategory (only if category selected) ── */}
              {mobileFilterDraft.categories.length > 0 && (
                filterSection(
                  'subcategory',
                  language === 'ro' ? 'Subcategorie' : 'Подкатегория',
                  mobileFilterDraft.subcategories.length === 0
                    ? t('products.all')
                    : mobileDraftSubcategories
                        .filter((subcategory) => mobileFilterDraft.subcategories.includes(subcategory.id))
                        .map((subcategory) => subcategory.name[language as Language])
                        .join(', '),
                  <>
                  <button
                    onClick={() => setMobileFilterDraft((draft) => ({ ...draft, subcategories: [] }))}
                    className={filterOptionClass()}
                  >
                    {t('products.all')}
                    {filterCheckbox(mobileFilterDraft.subcategories.length === 0)}
                  </button>
                  {mobileDraftSubcategories.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => toggleDraftValue('subcategories', sub.id)}
                      className={filterOptionClass()}
                    >
                      <span className="truncate text-left">{sub.name[language as Language]}</span>
                      {filterCheckbox(mobileFilterDraft.subcategories.includes(sub.id))}
                    </button>
                  ))}
                  </>,
                )
              )}

              {mobileDynamicCatalogFilters.map((filter) => {
                const selected = mobileAttributeDraft[filter.attribute.id] ?? [];
                const title = language === 'ro' ? filter.attribute.name_ro : filter.attribute.name_ru;
                const unit = getAttributeUnit(filter.attribute, language === 'ro' ? 'ro' : 'ru');
                const summary = selected.length > 0
                  ? selected.map((value) => {
                    const displayValue = value.replace(/^num:/, '');
                    return `${displayValue}${unit ? ` ${unit}` : ''}`;
                  }).join(', ')
                  : (language === 'ro' ? 'Toate valorile' : 'Все значения');
                return filterSection(
                  `attribute-${filter.attribute.id}` as FilterSectionId,
                  `${title}${unit ? `, ${unit}` : ''}`,
                  summary,
                  <>
                      {filter.options.map((option) => {
                        const active = selected.includes(option);
                        const label = filter.attribute.value_type === 'boolean'
                          ? option === 'true' ? (language === 'ro' ? 'Da' : 'Да') : (language === 'ro' ? 'Nu' : 'Нет')
                          : `${option.replace(/^num:/, '')}${unit ? ` ${unit}` : ''}`;
                        return (
                          <button
                            key={option}
                            onClick={() => setMobileAttributeSelection(
                              filter.attribute.id,
                              active ? selected.filter((value) => value !== option) : [...selected, option],
                            )}
                            className={filterOptionClass()}
                          >
                            <span>{label}</span>
                            {filterCheckbox(active)}
                          </button>
                        );
                      })}
                  </>,
                );
              })}

              {/* ── Brand ── */}
              {availableBrands.length > 0 && (
                filterSection(
                  'brand',
                  language === 'ro' ? 'Brand' : 'Бренд',
                  mobileFilterDraft.brands.length > 0
                    ? mobileFilterDraft.brands.join(', ')
                    : (language === 'ro' ? 'Toate brandurile' : 'Все бренды'),
                  <>
                  <button
                    onClick={() => setMobileFilterDraft((draft) => ({ ...draft, brands: [] }))}
                    className={filterOptionClass()}
                  >
                    <span>{language === 'ro' ? 'Toate brandurile' : 'Все бренды'}</span>
                    <span className="flex items-center gap-2 tabular-nums font-mono text-[10px] text-gray-400">
                      {availableBrands.reduce((s, b) => s + b.count, 0)}
                      {filterCheckbox(mobileFilterDraft.brands.length === 0)}
                    </span>
                  </button>
                  {availableBrands.map(({ name, count }) => (
                    <button
                      key={name}
                      onClick={() => toggleDraftValue('brands', name)}
                      className={filterOptionClass()}
                    >
                      <span className="truncate">{name}</span>
                      <span className="flex items-center gap-2 tabular-nums font-mono text-[10px] text-gray-400">
                        {count}
                        {filterCheckbox(mobileFilterDraft.brands.includes(name))}
                      </span>
                    </button>
                  ))}
                  </>,
                )
              )}

              {/* safe area */}
              <div className="h-2" />
            </div>

            {/* Apply button */}
            <div className="flex-shrink-0 p-3 border-t border-gray-100 bg-white">
              <button
                onClick={applyMobileFilters}
                disabled={mobileFilterLoading}
                className="w-full bg-black text-white py-2.5 text-sm"
              >
                {mobileFilterLoading
                  ? (language === 'ro' ? 'Se calculează...' : 'Подсчет...')
                  : language === 'ro'
                  ? `Aplică · ${mobileFilterTotal} produse`
                  : `Применить · ${mobileFilterTotal} товаров`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ─── MAIN CONTENT ─── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="md:grid md:grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)] md:gap-8">
          <aside className="hidden md:block">
            <div className="border border-gray-100 bg-white">
              <div className="flex items-center justify-between gap-3 px-4 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs uppercase tracking-widest text-gray-900">
                    {language === 'ro' ? 'Filtre' : 'Фильтры'}
                  </span>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="!text-[10px] text-gray-400 hover:text-black transition-colors"
                  >
                    {language === 'ro' ? 'Reset' : 'Сброс'}
                  </button>
                )}
              </div>

              <div>
                {currentCategory && (
                  <div className="border-b border-gray-100 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">
                      {language === 'ro' ? 'Subcategorie' : 'Подкатегория'}
                    </p>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSearchParams({ category: selectedCategory })}
                        className={`w-full px-3 py-2 text-left !text-[11px] uppercase tracking-wider transition-colors ${
                          selectedSubcategory === 'all'
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                        }`}
                      >
                        {t('products.all')}
                      </button>
                      {desktopSubcategories.map((subcategory) => (
                        <button
                          key={subcategory.id}
                          onClick={() => setSearchParams({ category: selectedCategory, subcategory: subcategory.id })}
                          className={`w-full px-3 py-2 text-left !text-[11px] uppercase tracking-wider transition-colors ${
                            selectedSubcategory === subcategory.id
                              ? 'bg-gray-900 text-white'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                          }`}
                        >
                          {subcategory.name[language as Language]}
                        </button>
                      ))}
                      {currentCategory.subcategories.length > 5 && (
                        <button
                          onClick={() => setShowAllDesktopSubcategories((value) => !value)}
                          className="w-full flex items-center justify-between px-3 py-2 !text-[10px] text-gray-400 hover:text-black transition-colors"
                        >
                          <span>
                            {showAllDesktopSubcategories
                              ? (language === 'ro' ? 'Arată mai puțin' : 'Скрыть')
                              : (language === 'ro' ? 'Arată mai multe' : 'Показать больше')}
                          </span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${showAllDesktopSubcategories ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {dynamicCatalogFilters.map((filter) => {
                  const selected = attributeSelections[filter.attribute.id] ?? [];
                  const unit = getAttributeUnit(filter.attribute, language === 'ro' ? 'ro' : 'ru');
                  return (
                    <div key={filter.attribute.id} className="border-b border-gray-100 p-4">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">
                        {language === 'ro' ? filter.attribute.name_ro : filter.attribute.name_ru}
                        {unit ? `, ${unit}` : ''}
                      </p>
                      <div className="space-y-1">
                          {filter.options.map((option) => {
                            const active = selected.includes(option);
                            const label = filter.attribute.value_type === 'boolean'
                              ? option === 'true'
                                ? (language === 'ro' ? 'Da' : 'Да')
                                : (language === 'ro' ? 'Nu' : 'Нет')
                              : `${option.replace(/^num:/, '')}${unit ? ` ${unit}` : ''}`;
                            return (
                              <button
                                key={option}
                                onClick={() => setAttributeSelection(
                                  filter.attribute.id,
                                  active ? selected.filter((value) => value !== option) : [...selected, option],
                                )}
                                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left !text-[11px] text-gray-500 hover:bg-gray-50 hover:text-black"
                              >
                                <span>{label}</span>
                                <span className={`w-3.5 h-3.5 border flex items-center justify-center ${active ? 'bg-black border-black' : 'border-gray-300'}`}>
                                  {active && <Check className="w-2.5 h-2.5 text-white" />}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}

                <div className="border-b border-gray-100 p-4">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">
                    {language === 'ro' ? 'Disponibilitate' : 'Наличие'}
                  </p>
                  <div className="space-y-1">
                    {([
                      { value: 'all' as StockFilter, label: language === 'ro' ? 'Toate produsele' : 'Все товары' },
                      { value: 'inStock' as StockFilter, label: language === 'ro' ? 'În stoc' : 'В наличии' },
                      { value: 'onOrder' as StockFilter, label: language === 'ro' ? 'La comandă' : 'Под заказ' },
                    ]).map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setStockFilter(option.value)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left !text-[11px] uppercase tracking-wider transition-colors ${
                          stockFilter === option.value
                            ? 'bg-black text-white'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                        }`}
                      >
                        {option.label}
                        {stockFilter === option.value && <span className="w-1.5 h-1.5 bg-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-b border-gray-100 p-4">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">
                    {language === 'ro' ? 'Promoții' : 'Акции'}
                  </p>
                  <button
                    onClick={() => setSaleOnly((value) => !value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left !text-[11px] uppercase tracking-wider transition-colors ${
                      saleOnly
                        ? 'bg-red-500 text-white'
                        : 'text-gray-500 hover:bg-red-50 hover:text-red-500'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Zap className={`w-3.5 h-3.5 ${saleOnly ? 'fill-white' : ''}`} />
                      {language === 'ro' ? 'Doar produse la promoție' : 'Только товары по акции'}
                    </span>
                    {saleOnly && <span className="w-1.5 h-1.5 bg-white" />}
                  </button>
                </div>

                <div className="border-b border-gray-100 p-4">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">
                    {language === 'ro' ? 'Garanție' : 'Гарантия'}
                  </p>
                  <button
                    onClick={() => setWarrantyOnly((value) => !value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left !text-[11px] uppercase tracking-wider transition-colors ${
                      warrantyOnly
                        ? 'bg-black text-white'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {language === 'ro' ? 'Doar cu garanție' : 'Только с гарантией'}
                    </span>
                    {warrantyOnly && <span className="w-1.5 h-1.5 bg-white" />}
                  </button>
                </div>

                {availableBrands.length > 0 && (
                  <div className="border-b border-gray-100 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">
                      {language === 'ro' ? 'Brand' : 'Бренд'}
                    </p>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedBrand('')}
                        className={`w-full px-3 py-2 text-left !text-[11px] uppercase tracking-wider transition-colors ${
                          !selectedBrand
                            ? 'bg-black text-white'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                        }`}
                      >
                        {language === 'ro' ? 'Toate brandurile' : 'Все бренды'}
                      </button>
                      {desktopBrands.map(({ name }) => (
                        <button
                          key={name}
                          onClick={() => setSelectedBrand(name === selectedBrand ? '' : name)}
                          className={`w-full px-3 py-2 text-left !text-[11px] uppercase tracking-wider transition-colors ${
                            selectedBrand === name
                              ? 'bg-black text-white'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                      {availableBrands.length > 5 && (
                        <button
                          onClick={() => setShowAllDesktopBrands((value) => !value)}
                          className="w-full flex items-center justify-between px-3 py-2 !text-[10px] text-gray-400 hover:text-black transition-colors"
                        >
                          <span>
                            {showAllDesktopBrands
                              ? (language === 'ro' ? 'Arată mai puțin' : 'Скрыть')
                              : (language === 'ro' ? 'Arată mai multe' : 'Показать больше')}
                          </span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${showAllDesktopBrands ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">
                    {language === 'ro' ? 'Sortare' : 'Сортировка'}
                  </p>
                  <div className="space-y-1">
                    {([
                      { value: 'default' as SortOption, label: language === 'ro' ? 'Implicit' : 'По умолчанию' },
                      { value: 'price-asc' as SortOption, label: language === 'ro' ? 'Preț crescător' : 'Сначала дешевле' },
                      { value: 'price-desc' as SortOption, label: language === 'ro' ? 'Preț descrescător' : 'Сначала дороже' },
                    ]).map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left !text-[11px] uppercase tracking-wider transition-colors ${
                          sortBy === option.value
                            ? 'bg-black text-white'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                        }`}
                      >
                        {option.label}
                        {sortBy === option.value && <span className="w-1.5 h-1.5 bg-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0">

        {/* ── Supabase loading skeleton ── */}
        {displayLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3">
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
        {!displayLoading && displayError && (
          <div className="border border-red-200 bg-red-50 p-8 md:p-12 text-center max-w-2xl mx-auto mt-8">
            <div className="w-10 h-10 bg-red-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-lg font-bold">!</span>
            </div>
            <p className="text-sm text-gray-900 mb-1">
              {language === 'ro' ? 'Eroare la conectarea cu baza de date' : 'Ошибка подключения к базе данных'}
            </p>
            <p className="text-xs text-red-600 font-mono mb-4 break-all">{displayError}</p>
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

        {/* ── Selected brand has no products matching the filters ── */}
        {!displayLoading && !displayError && displayConnected && displayTotal === 0 && selectedBrandData && (
          <div className="border border-gray-200 bg-white p-8 md:p-14 text-center max-w-2xl mx-auto mt-8">
            <div className="min-h-16 flex items-center justify-center mb-6">
              {selectedBrandData.logo_url ? (
                <img
                  src={selectedBrandData.logo_url}
                  alt={selectedBrandData.name}
                  className="max-h-14 max-w-[220px] object-contain"
                />
              ) : (
                <div className="text-xl uppercase tracking-widest text-gray-900">
                  {selectedBrandData.name}
                </div>
              )}
            </div>
            <h2 className="text-lg text-gray-900 mb-2">
              {saleOnly
                ? (language === 'ro' ? 'Nu există produse la promoție' : 'Нет товаров по акции')
                : (language === 'ro' ? 'Nu există produse pentru filtrele selectate' : 'Нет товаров по выбранным фильтрам')}
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              {saleOnly
                ? (language === 'ro'
                    ? `Brandul ${selectedBrandData.name} nu are momentan produse la promoție.`
                    : `У бренда ${selectedBrandData.name} сейчас нет товаров по акции.`)
                : (language === 'ro'
                    ? `Schimbați filtrele sau vedeți toate produsele ${selectedBrandData.name}.`
                    : `Измените фильтры или посмотрите все товары ${selectedBrandData.name}.`)}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                to={`/brands/${selectedBrandData.slug}`}
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-xs uppercase tracking-wider hover:bg-gray-800 transition-colors"
              >
                {language === 'ro' ? 'Pagina brandului' : 'Перейти на страницу бренда'}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={clearFilters}
                className="border border-gray-300 text-gray-600 px-6 py-3 !text-xs uppercase tracking-wider hover:border-black hover:text-black transition-colors"
              >
                {language === 'ro' ? 'Resetează filtrele' : 'Сбросить фильтры'}
              </button>
            </div>
          </div>
        )}

        {/* ── Filter combination has no results ── */}
        {!displayLoading && !displayError && displayConnected && displayTotal === 0 && hasActiveFilters && !selectedBrandData && (
          <div className="border border-gray-200 bg-gray-50 p-8 md:p-14 text-center max-w-2xl mx-auto mt-8">
            <Search className="w-6 h-6 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-900 mb-2">
              {language === 'ro' ? 'Nu s-au găsit produse' : 'Товары по выбранным фильтрам не найдены'}
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 bg-black text-white px-6 py-3 !text-xs uppercase tracking-wider hover:bg-gray-800 transition-colors"
            >
              {language === 'ro' ? 'Resetează filtrele' : 'Сбросить фильтры'}
            </button>
          </div>
        )}

        {/* ── Connected but catalog itself is empty ── */}
        {!displayLoading && !displayError && displayConnected && displayTotal === 0 && !hasActiveFilters && (
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
        {!displayLoading && !displayError && displayTotal > 0 && (
          <>
            {/* Active filter pills */}
            {hasActiveFilters && (
              <div className="hidden md:flex items-center gap-2 mb-5 flex-wrap">
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
                {warrantyOnly && (
                  <span className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3 text-gray-300" />
                    {language === 'ro' ? 'Cu garanție' : 'С гарантией'}
                    <button onClick={() => setWarrantyOnly(false)} className="ml-1 hover:text-gray-300"><X className="w-3 h-3" /></button>
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
            {displayTotal > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-400">
                  {language === 'ro'
                    ? `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, displayTotal)} din ${displayTotal} produse`
                    : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, displayTotal)} из ${displayTotal} товаров`}
                </p>
              </div>
            )}

            {/* Products grid */}
            {displayProducts.length > 0 ? (
              <>
                <div className={
                  viewMode === 'list'
                    ? 'flex flex-col gap-2 md:grid md:grid-cols-3 md:gap-3 xl:grid-cols-4'
                    : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3'
                }>
                  {displayProducts.map((product) => (
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
      </div>
    </div>
  );
}
