import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { categories } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { supabase, type BrandRow } from '../../lib/supabase';
import { ArrowLeft, ArrowRight, Globe, MapPin, Tag, Loader2, LayoutGrid, List, ShoppingCart, Package } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';
import { buildProductPath } from '../lib/product-url';

// ─── Fetch single brand by slug ───────────────────────────────────────────────
function useBrandBySlug(slug: string | undefined) {
  const [brand, setBrand] = useState<BrandRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data } = await supabase
        .from('brands')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!cancelled) {
        const row = (data as BrandRow) ?? null;
        setBrand(row && row.active === false ? null : row);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [slug]);

  return { brand, loading };
}

// ─── Page ────────────────────────────────────────────────────────────────────
export function BrandPage() {
  const { brandId } = useParams<{ brandId: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const lang = language as Language;

  const { brand, loading: brandLoading } = useBrandBySlug(brandId);
  const { products: allProducts, loading: productsLoading } = useSupabaseProducts();
  const [mobileView, setMobileView] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState(24);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const loading = brandLoading || productsLoading;

  // Products that belong to this brand (match by name)
  const brandProducts = useMemo(() => {
    if (!brand) return [];
    return allProducts.filter(
      p => p.brand && p.brand.toLowerCase().trim() === brand.name.toLowerCase().trim()
    );
  }, [brand, allProducts]);

  // Filtered by active category
  const filteredProducts = useMemo(() => {
    if (!activeCategory) return brandProducts;
    return brandProducts.filter(p => p.category === activeCategory);
  }, [brandProducts, activeCategory]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  // Reset visible count when category changes
  const handleCategoryClick = (catId: string | null) => {
    setActiveCategory(catId);
    setVisibleCount(24);
  };

  // Categories derived from products
  const coveredCategories = useMemo(() => {
    const catIds = [...new Set(brandProducts.map(p => p.category))];
    return categories.filter(c => catIds.includes(c.id));
  }, [brandProducts]);

  const L = (ro: string, ru: string) => lang === 'ro' ? ro : ru;

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (brandLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
      </div>
    );
  }

  // ─── Brand not found in DB ─────────────────────────────────────────────────
  if (!brand) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">404</p>
          <h1 className="text-2xl mb-6">{L('Brand negăsit', 'Бренд не найден')}</h1>
          <Link to="/" className="text-xs uppercase tracking-wider underline underline-offset-4">
            {L('Înapoi la pagina principală', 'На главную')}
          </Link>
        </div>
      </div>
    );
  }

  // ─── Brand has 0 products → redirect-style 404 ────────────────────────────
  if (!productsLoading && brandProducts.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">
            {L('Brand disponibil în curând', 'Бренд скоро появится')}
          </p>
          <h1 className="text-2xl text-black mb-3">{brand.name}</h1>
          <p className="text-sm text-gray-500 mb-8">
            {L(
              'Produsele acestui brand vor fi disponibile în catalogul nostru în curând.',
              'Товары этого бренда скоро появятся в нашем каталоге.'
            )}
          </p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 bg-black text-white text-xs px-6 py-3 hover:bg-gray-800 transition-colors"
          >
            {L('Catalog complet', 'Полный каталог')}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SeoHead
        title={`${brand.name} — ${lang === 'ro' ? 'Echipamente Sportive' : 'Спортивное Оборудование'} | SPORTOSFERA`}
        description={
          (lang === 'ro' ? brand.description_ro : brand.description_ru) ||
          (lang === 'ro'
            ? `Produse ${brand.name} disponibile în Moldova. Distribuitor oficial B2B. Prețuri angro, livrare rapidă.`
            : `Продукция ${brand.name} доступна в Молдове. Официальный B2B дистрибьютор. Оптовые цены, быстрая доставка.`)
        }
        keywords={`${brand.name}, ${brand.name} Moldova, ${lang === 'ro' ? 'echipament sportiv' : 'спортивное оборудование'} ${brand.name}, ${brand.name} ${lang === 'ro' ? 'pret' : 'цена'}`}
        canonical={`/brands/${brand.slug}`}
        ogImage={brand.hero_image_url || brand.banner_desktop_url || undefined}
        lang={lang}
      />

      {/* ── HERO ── */}
      <div className="relative bg-black overflow-hidden">
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg, transparent, transparent 40px, white 40px, white 41px
            ), repeating-linear-gradient(
              90deg, transparent, transparent 40px, white 40px, white 41px
            )`,
          }}
        />

        {/* Back nav */}
        <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-16 pt-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-600 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {L('Înapoi', 'Назад')}
          </button>
        </div>

        {/* Brand name + logo */}
        <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-16 pt-12 pb-6">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-600 mb-6">
            {L('Partener oficial', 'Официальный партнёр')} · SPORTOSFERA S.R.L.
          </p>

          {/* Logo only (no background, no text duplicate) — if no logo, show text */}
          {brand.logo_url ? (
            <img
              src={brand.logo_url}
              alt={brand.name}
              className="brightness-0 invert object-contain block mx-auto sm:mx-0"
              style={{ height: 'clamp(60px, 10vw, 160px)', width: 'auto', maxWidth: '80%' }}
            />
          ) : (
            <h1
              className="text-white leading-[0.88] tracking-[-0.04em] uppercase select-none"
              style={{ fontSize: 'clamp(3rem, 10vw, 8rem)' }}
            >
              {brand.name}
            </h1>
          )}

          {/* Divider */}
          <div className="mt-8 mb-6 h-px bg-gray-800" />

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:flex sm:flex-wrap sm:items-start sm:gap-x-10 sm:gap-y-5 pb-10">
            {/* Produse */}
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-600 block mb-1">
                {L('Produse', 'Товаров')}
              </span>
              <span className="text-2xl text-white tabular-nums">
                {loading ? '—' : brandProducts.length}
              </span>
            </div>

            {/* Categorii */}
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-600 block mb-1">
                {L('Categorii', 'Категорий')}
              </span>
              <span className="text-2xl text-white tabular-nums">{coveredCategories.length}</span>
            </div>

            {/* Fondată */}
            {brand.founded && (
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-600 block mb-1">
                  {L('Fondată', 'Основана')}
                </span>
                <span className="text-2xl text-white tabular-nums">{brand.founded}</span>
              </div>
            )}

            {/* Țara */}
            {brand.country_ro && (
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{L('Țara', 'Страна')}
                </span>
                <span className="text-2xl text-white">
                  {brand.country_flag ?? ''} {lang === 'ro' ? brand.country_ro : (brand.country_ru ?? brand.country_ro)}
                </span>
              </div>
            )}

            {/* Segment */}
            {brand.segment_ro && (
              <div className="flex flex-col items-center sm:items-start sm:ml-auto">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3" />{L('Segment', 'Сегмент')}
                </span>
                <span className="text-sm text-gray-300">
                  {lang === 'ro' ? brand.segment_ro : (brand.segment_ru ?? brand.segment_ro)}
                </span>
              </div>
            )}

            {/* Website */}
            {brand.website && (
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3" />Website
                </span>
                <a
                  href={brand.website_url || (brand.website.startsWith('http') ? brand.website : `https://${brand.website}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-300 hover:text-white underline underline-offset-4 decoration-gray-600 hover:decoration-white transition-colors"
                >
                  {brand.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ── Ad Banner (replaces photo strip) ── */}
        {(brand.banner_desktop_url || brand.banner_mobile_url) ? (
          <>
            {/* Desktop banner */}
            <div className="hidden md:block w-full overflow-hidden" style={{ maxHeight: 320 }}>
              <img
                src={brand.banner_desktop_url || brand.banner_mobile_url!}
                alt={`${brand.name} banner`}
                className="w-full object-cover"
                style={{ maxHeight: 320 }}
              />
            </div>
            {/* Mobile banner */}
            <div className="md:hidden w-full overflow-hidden" style={{ maxHeight: 240 }}>
              <img
                src={brand.banner_mobile_url || brand.banner_desktop_url!}
                alt={`${brand.name} banner`}
                className="w-full object-cover"
                style={{ maxHeight: 240 }}
              />
            </div>
          </>
        ) : (
          /* Placeholder — beautiful grayscale sports photo */
          <div className="relative h-56 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1748483879355-204bf8fb3397?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBlcXVpcG1lbnQlMjBneW0lMjBibGFjayUyMHdoaXRlfGVufDF8fHx8MTc3MzEzNjgzNXww&ixlib=rb-4.1.0&q=80&w=1080"
              alt="sports"
              className="w-full h-full object-cover grayscale opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </div>
        )}
      </div>

      {/* ── DESCRIPTION + CATEGORIES ── */}
      {(brand.description_ro || brand.description_ru) && (
        <div className="max-w-[1600px] mx-auto px-6 lg:px-16 py-16">
          <div className="grid lg:grid-cols-[2fr_1fr] gap-12 lg:gap-20">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-4">
                {L('Despre brand', 'О бренде')}
              </p>
              <p className="text-gray-600 leading-relaxed max-w-2xl">
                {lang === 'ro'
                  ? brand.description_ro
                  : (brand.description_ru ?? brand.description_ro)}
              </p>
            </div>

            {coveredCategories.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-4">
                  {L('Categorii disponibile', 'Доступные категории')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {coveredCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        handleCategoryClick(cat.id);
                        document.getElementById('brand-products')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-[10px] uppercase tracking-wider text-gray-600 border border-gray-200 hover:border-black hover:text-black px-3 py-1.5 transition-colors"
                    >
                      {cat.name[lang]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PRODUCTS ── */}
      <div id="brand-products" className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-16 py-16">
          <div className="flex items-end justify-between gap-6 mb-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">
                {L('Catalog', 'Каталог')} · {brand.name}
              </p>
              <h2 className="text-2xl text-black">
                {activeCategory
                  ? coveredCategories.find(c => c.id === activeCategory)?.name[lang]
                  : L('Toate produsele', 'Все товары')}
                {!productsLoading && (
                  <span className="text-gray-400 ml-3 text-xl">({filteredProducts.length})</span>
                )}
              </h2>
            </div>
            <Link
              to="/catalog"
              className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500 hover:text-black border-b border-gray-300 hover:border-black pb-0.5 transition-colors flex-shrink-0"
            >
              {L('Catalogul complet', 'Полный каталог')}
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* ── Category filter bar ── */}
          {coveredCategories.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => handleCategoryClick(null)}
                className={`text-[10px] uppercase tracking-wider px-3 py-1.5 border transition-colors ${
                  activeCategory === null
                    ? 'bg-black text-white border-black'
                    : 'text-gray-600 border-gray-200 hover:border-black hover:text-black'
                }`}
              >
                {L('Toate', 'Все')}
                <span className="ml-1.5 opacity-50">({brandProducts.length})</span>
              </button>
              {coveredCategories.map(cat => {
                const count = brandProducts.filter(p => p.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`text-[10px] uppercase tracking-wider px-3 py-1.5 border transition-colors ${
                      activeCategory === cat.id
                        ? 'bg-black text-white border-black'
                        : 'text-gray-600 border-gray-200 hover:border-black hover:text-black'
                    }`}
                  >
                    {cat.name[lang]}
                    <span className="ml-1.5 opacity-50">({count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* View toggle — только мобильный */}
          <div className="flex items-center justify-end gap-1 mb-6 sm:hidden">
            <button
              onClick={() => setMobileView('grid')}
              className={`p-2.5 border transition-colors ${
                mobileView === 'grid'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-400 border-gray-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileView('list')}
              className={`p-2.5 border transition-colors ${
                mobileView === 'list'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-400 border-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {productsLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : mobileView === 'list' ? (
            /* ── List view ── */
            <div className="flex flex-col divide-y divide-gray-100 border-t border-gray-100">
              {visibleProducts.map(product => (
                <Link
                  key={product.id}
                  to={buildProductPath(product)}
                  className="group flex items-center gap-3 bg-white hover:bg-gray-50 py-2.5 px-3 transition-colors"
                >
                  <div className="w-14 h-14 flex-shrink-0 bg-gray-50 border border-gray-100 overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name[lang]}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-200" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-900 leading-snug line-clamp-2 group-hover:text-black">
                      {product.name[lang]}
                    </p>
                    {product.sku && (
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{product.sku}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-gray-900 tabular-nums whitespace-nowrap">
                      {product.price.toLocaleString()}
                      <span className="text-[10px] text-gray-400 ml-0.5">MDL</span>
                    </p>
                    <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-black transition-colors ml-auto mt-1" />
                  </div>
                </Link>
              ))}
              {hasMore && (
                <button
                  onClick={() => setVisibleCount(visibleCount + 24)}
                  className="flex items-center gap-2 bg-black text-white px-6 py-3 text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-colors"
                >
                  {L('Vezi mai multe', 'Показать больше')}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            /* ── Grid view ── */
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {visibleProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => setVisibleCount(visibleCount + 24)}
                    className="flex items-center gap-2 bg-black text-white px-8 py-3 text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-colors"
                  >
                    {L('Vezi mai multe', 'Показать больше')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="bg-black">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-16 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-600 mb-2">
              {L('Interesat de echipamentele', 'Интересуют товары')} {brand.name}?
            </p>
            <p className="text-white text-lg">
              {L('Solicitați o ofertă personalizată', 'Запросите персональное предложение')}
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link
              to="/order-request"
              className="flex items-center gap-2 bg-white text-black px-6 py-3 text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-colors"
            >
              {L('Cerere de ofertă', 'Запросить предложение')}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/contacts"
              className="flex items-center gap-2 border border-gray-700 text-gray-400 hover:border-white hover:text-white px-6 py-3 text-[10px] uppercase tracking-widest transition-colors"
            >
              {L('Contact', 'Контакты')}
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
