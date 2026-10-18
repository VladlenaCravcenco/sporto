import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { supabase, fetchAllSupabaseRows, type ProductRow } from '../../lib/supabase';
import { Search, Star, X, Check, RefreshCw, ExternalLink, SlidersHorizontal } from 'lucide-react';
import { useAdminLang } from '../contexts/AdminLangContext';
import { buildProductPath } from '../lib/product-url';
import { OptimizedImage } from '../components/OptimizedImage';
import { cacheInvalidate } from '../../lib/queryCache';

type Row = Pick<ProductRow, 'id' | 'name_ro' | 'name_ru' | 'category' | 'price' | 'sku' | 'image_url' | 'featured' | 'brand'>;

export function AdminFeatured() {
  const { t, lang } = useAdminLang();
  const [allProducts, setAllProducts] = useState<Row[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeTab, setActiveTab]     = useState<'featured' | 'all'>('featured');
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);
  const [filterOpen, setFilterOpen]   = useState(false);

  const CATEGORY_LABELS_RO: Record<string, string> = {
    'aparate-cardio':      'Aparate cardio',
    'aparate-forta':       'Aparate forță',
    'greutati':            'Greutăți',
    'fitness-yoga':        'Fitness / Yoga',
    'sporturi-colective':  'Sporturi colective',
    'sporturi-individuale':'Sporturi individuale',
    'arte-martiale':       'Arte marțiale',
    'inot':                'Înot',
    'tenis-masa':          'Tenis de masă',
    'jocuri':              'Jocuri',
    'forta-exterior':      'Forță exterior',
    'inventar-institutii': 'Inventar instituții',
  };
  const CATEGORY_LABELS_RU: Record<string, string> = {
    'aparate-cardio':      'Кардиотренажёры',
    'aparate-forta':       'Силовые тренажёры',
    'greutati':            'Гантели и штанги',
    'fitness-yoga':        'Фитнес / Йога',
    'sporturi-colective':  'Командные виды',
    'sporturi-individuale':'Индивидуальные виды',
    'arte-martiale':       'Единоборства',
    'inot':                'Плавание',
    'tenis-masa':          'Настольный теннис',
    'jocuri':              'Игры',
    'forta-exterior':      'Уличные тренажёры',
    'inventar-institutii': 'Инвентарь для учреждений',
  };
  const CATEGORY_LABELS = lang === 'ru' ? CATEGORY_LABELS_RU : CATEGORY_LABELS_RO;

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const load = async () => {
    setLoading(true);
    const data = await fetchAllSupabaseRows<Row>((from, to) =>
      supabase
        .from('products')
        .select('id, name_ro, name_ru, category, price, sku, image_url, featured, brand')
        .eq('active', true)
        .order('name_ro', { ascending: true })
        .range(from, to)
    );
    setAllProducts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (product: Row) => {
    setSaving(product.id);
    const next = !product.featured;
    const { error } = await supabase
      .from('products')
      .update({ featured: next })
      .eq('id', product.id);

    if (error) {
      showToast(t.featured.errorSave, false);
    } else {
      cacheInvalidate('products:');
      setAllProducts(prev =>
        prev.map(p => p.id === product.id ? { ...p, featured: next } : p)
      );
      const name = lang === 'ru' ? (product.name_ru || product.name_ro) : product.name_ro;
      showToast(next ? `✓ "${name}" ${t.featured.added}` : `✗ "${name}" ${t.featured.removed}`);
    }
    setSaving(null);
  };

  const featured = useMemo(() => allProducts.filter(p => p.featured), [allProducts]);

  const filtered = useMemo(() => {
    const base = activeTab === 'featured' ? featured : allProducts;
    const q = search.toLowerCase().trim();
    return base.filter(p => {
      const matchSearch = !q
        || p.name_ro.toLowerCase().includes(q)
        || (p.name_ru ?? '').toLowerCase().includes(q)
        || (p.sku ?? '').toLowerCase().includes(q)
        || p.id.includes(q);
      const matchCat = !categoryFilter || p.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [allProducts, activeTab, featured, search, categoryFilter]);

  const categories = useMemo(() =>
    [...new Set(allProducts.map(p => p.category))].sort(),
    [allProducts]
  );

  return (
    <div className="min-h-screen admin-canvas">

      {toast && (
        <div className={`fixed top-16 right-3 left-3 sm:left-auto sm:right-4 sm:w-80 z-50 px-4 py-3 text-xs flex items-center gap-2 shadow-lg ${toast.ok ? 'admin-solid admin-on-solid' : 'bg-red-600 admin-on-solid'}`}>
          {toast.ok ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Star className="w-3.5 h-3.5 flex-shrink-0" />}
          <span className="truncate">{toast.msg}</span>
        </div>
      )}

      <div className="admin-page-toolbar admin-surface border-b admin-border sticky top-12 z-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center h-11 gap-2">
            <Star className="w-4 h-4 admin-muted flex-shrink-0" />
            <span className="text-sm admin-ink flex-shrink-0">{t.featured.title}</span>
            <span className="text-[11px] admin-solid admin-on-solid px-2 py-0.5 tabular-nums flex-shrink-0">
              {featured.length}
            </span>
            <span className="text-[11px] admin-muted flex-shrink-0 hidden sm:inline">
              / {allProducts.length}
            </span>
            <div className="flex-1" />

            <button
              onClick={() => setFilterOpen(v => !v)}
              className={`sm:hidden flex items-center gap-1.5 h-8 px-3 text-xs border transition-colors ${
                categoryFilter
                  ? 'admin-solid admin-on-solid admin-border-strong'
                  : 'admin-border admin-muted hover:border-gray-400 admin-hover-ink'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              {categoryFilter ? CATEGORY_LABELS[categoryFilter]?.slice(0, 10) + (CATEGORY_LABELS[categoryFilter]?.length > 10 ? '…' : '') : t.featured.allCategories}
            </button>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="hidden sm:block h-8 px-3 text-xs border admin-border admin-surface focus:outline-none admin-focus-border max-w-[180px] truncate"
            >
              <option value="">{t.featured.allCategories}</option>
              {categories.map(k => (
                <option key={k} value={k}>{CATEGORY_LABELS[k] || k}</option>
              ))}
            </select>

            <button
              onClick={load}
              disabled={loading}
              className="w-8 h-8 flex items-center justify-center admin-muted admin-hover-ink transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="pb-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 admin-muted pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t.featured.searchPlaceholder}
                className="w-full h-8 pl-9 pr-8 text-xs border admin-border focus:outline-none admin-focus-border transition-colors admin-surface"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 admin-muted admin-hover-ink"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {filterOpen && (
            <div className="sm:hidden pb-2.5">
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => { setCategoryFilter(''); setFilterOpen(false); }}
                  className={`px-3 py-2 text-[11px] border text-left truncate transition-colors ${
                    !categoryFilter ? 'admin-solid admin-on-solid admin-border-strong' : 'admin-border admin-muted hover:border-gray-400'
                  }`}
                >
                  {t.featured.allCategories}
                </button>
                {categories.map(k => (
                  <button
                    key={k}
                    onClick={() => { setCategoryFilter(k); setFilterOpen(false); }}
                    className={`px-3 py-2 text-[11px] border text-left truncate transition-colors ${
                      categoryFilter === k ? 'admin-solid admin-on-solid admin-border-strong' : 'admin-border admin-muted hover:border-gray-400'
                    }`}
                  >
                    {CATEGORY_LABELS[k] || k}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4">

        <div className="flex mb-4 border admin-border overflow-hidden">
          {(['featured', 'all'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-none sm:px-5 h-9 text-xs border-r last:border-0 admin-border transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab ? 'admin-solid admin-on-solid' : 'admin-muted admin-hover-ink'
              }`}
            >
              {tab === 'featured'
                ? <><Star className="w-3 h-3" /><span>{t.featured.tabFeatured}</span></>
                : <span>{t.featured.tabAll}</span>
              }
              <span className={`text-xs tabular-nums ${activeTab === tab ? 'opacity-60' : 'opacity-40'}`}>
                {tab === 'featured' ? featured.length : allProducts.length}
              </span>
            </button>
          ))}
        </div>

        {categoryFilter && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs admin-muted  ">
              {t.featured.allCategories}:
            </span>
            <button
              onClick={() => setCategoryFilter('')}
              className="inline-flex items-center gap-1.5 admin-solid admin-on-solid text-xs px-2.5 py-1"
            >
              {CATEGORY_LABELS[categoryFilter] || categoryFilter}
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="admin-surface border admin-border animate-pulse h-36 sm:h-40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-surface border admin-border py-16 text-center">
            <Star className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm admin-muted">
              {activeTab === 'featured' ? t.featured.noFeatured : t.featured.noResults}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
            {filtered.map(product => {
              const isSaving = saving === product.id;
              const isFeatured = product.featured;
              const name = lang === 'ru'
                ? (product.name_ru || product.name_ro)
                : product.name_ro;

              return (
                <div
                  key={product.id}
      className={`group admin-surface border flex flex-col transition-all ${
  isFeatured ? 'admin-border-strong' : 'admin-border hover:border-gray-300'
}`}
>

  <div className="relative">
    <div className="aspect-square admin-canvas overflow-hidden">
      {product.image_url ? (
        <OptimizedImage
          src={product.image_url}
          alt={product.name_ro}
          className="w-full h-full object-cover rounded-lg"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Star className="w-6 h-6 text-gray-200" />
        </div>
      )}
    </div>

                    {isFeatured && (
                      <div className="absolute top-1.5 left-1.5 admin-solid admin-on-solid w-5 h-5 flex items-center justify-center">
                        <Star className="w-3 h-3 fill-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 px-2.5 pt-2 pb-1.5 min-w-0">
                    <p className="text-[11px] admin-ink line-clamp-2 leading-snug mb-1">
                      {name}
                    </p>
                    <p className="text-xs admin-muted truncate leading-none">
                      {CATEGORY_LABELS[product.category] || product.category}
                    </p>
                    {product.brand && (
                      <p className="text-xs admin-muted truncate mt-0.5">{product.brand}</p>
                    )}
                    <p className="text-xs admin-ink tabular-nums mt-1.5">
                      {Number(product.price).toLocaleString()} MDL
                    </p>
                  </div>

                  <div className="border-t admin-border flex mt-auto">
                    <button
                      onClick={() => toggle(product)}
                      disabled={isSaving}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] transition-colors ${
                        isFeatured
                          ? 'admin-solid admin-on-solid admin-hover-solid'
                          : 'admin-muted admin-hover-ink admin-hover-surface'
                      }`}
                    >
                      {isSaving
                        ? <RefreshCw className="w-3 h-3 animate-spin" />
                        : <Star className={`w-3 h-3 ${isFeatured ? 'fill-white' : ''}`} />
                      }
                      <span className="hidden sm:inline">
                        {isFeatured ? t.featured.tabFeatured : t.common.add}
                      </span>
                    </button>
                    <Link
                      to={buildProductPath({
                        id: product.id,
                        name: { ro: product.name_ro, ru: product.name_ru || product.name_ro },
                      })}
                      target="_blank"
                      className="flex items-center justify-center w-9 border-l admin-border admin-muted admin-hover-ink transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
