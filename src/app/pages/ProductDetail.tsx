import { useParams, useNavigate, Link } from 'react-router';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';
import { categories } from '../data/products';
import { ProductImageGallery } from '../components/ProductImageGallery';
import { ProductVideoSection } from '../components/ProductVideoSection';
import { Button } from '../components/ui/button';
import {
  ArrowLeft, Hash, Barcode, ShoppingCart, Check, ExternalLink,
  ChevronLeft, ChevronRight, ArrowUpRight, Package, Download,
} from 'lucide-react';
import { useSupabaseProduct, useBrandProducts } from '../hooks/useSupabaseProducts';
import { useBrandByName } from '../hooks/useSupabaseBrands';
import { useRef, useEffect, useState, useCallback } from 'react';
import type { Product } from '../data/products';
import { SeoHead, buildProductJsonLd, buildBreadcrumbJsonLd } from '../components/SeoHead';
import { ServicesBento } from '../components/ServicesBento';
import { getCurrentPrice, hasSalePrice } from '../lib/productPricing';

// ─── Brand Products Carousel ──────────────────────────────────────────────────
function BrandCarousel({
  products,
  currentId,
  language,
  t,
}: {
  products: Product[];
  currentId: string;
  language: Language;
  t: (k: string) => string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // How many cards are visible at once
  const getVisible = () => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  };
  const [visible, setVisible] = useState(getVisible);

  useEffect(() => {
    const onResize = () => setVisible(getVisible());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const total = products.length;
  const maxIndex = Math.max(0, total - visible);

  const goTo = useCallback((idx: number) => {
    const next = Math.max(0, Math.min(idx, maxIndex));
    setCurrent(next);
  }, [maxIndex]);

  const next = useCallback(() => goTo(current === maxIndex ? 0 : current + 1), [current, maxIndex, goTo]);
  const prev = useCallback(() => goTo(current === 0 ? maxIndex : current - 1), [current, maxIndex, goTo]);

  // Auto-scroll
  useEffect(() => {
    if (total <= visible) return;
    if (isPaused) return;
    timerRef.current = setInterval(next, 3500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, total, visible, isPaused]);

  // Scroll track
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const cardW = track.scrollWidth / total;
    track.scrollTo({ left: current * cardW, behavior: 'smooth' });
  }, [current, total]);

  if (total === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Track */}
      <div
        ref={trackRef}
        className="flex overflow-hidden gap-2 md:gap-3"
        style={{ scrollBehavior: 'smooth' }}
      >
        {products.map(p => {
          const currentPrice = getCurrentPrice(p);
          const showSalePrice = hasSalePrice(p);
          return (
            <Link
              key={p.id}
              to={`/product/${p.id}`}
              className="group flex-shrink-0 border border-gray-100 bg-white hover:border-black transition-colors duration-200 flex flex-col"
              style={{ width: `calc((100% - ${(visible - 1) * (window?.innerWidth < 640 ? 8 : 12)}px) / ${visible})` }}
            >
            {/* Image */}
            <div className="aspect-square bg-gray-50 overflow-hidden relative">
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.name[language]}
                  className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-200" />
                </div>
              )}
              {p.id === currentId && (
                <span className="absolute top-2 left-2 text-[9px] uppercase tracking-widest bg-black text-white px-1.5 py-0.5">
                  {language === 'ro' ? 'Actual' : 'Текущий'}
                </span>
              )}
            </div>
            {/* Info */}
            <div className="p-3 flex flex-col gap-1 flex-1">
              <p className="text-xs text-gray-900 leading-snug line-clamp-2 group-hover:text-black">
                {p.name[language]}
              </p>
              {p.sku && (
                <p className="text-[10px] text-gray-400 font-mono">{p.sku}</p>
              )}
              <div className="mt-auto pt-2 flex items-center justify-between">
                {showSalePrice ? (
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-xs text-gray-400 tabular-nums line-through">
                      {p.price.toLocaleString()} <span className="text-[10px] text-gray-300">MDL</span>
                    </span>
                    <span className="text-sm text-red-600 tabular-nums">
                      {currentPrice.toLocaleString()} <span className="text-[10px] text-red-500">MDL</span>
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-900 tabular-nums">
                    {currentPrice.toLocaleString()} <span className="text-[10px] text-gray-400">MDL</span>
                  </span>
                )}
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-black transition-colors" />
              </div>
            </div>
            </Link>
          );
        })}
      </div>

      {/* Nav arrows — only if there's something to scroll */}
      {total > visible && (
        <>
          <button
            onClick={prev}
            className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-gray-200 flex items-center justify-center hover:border-black hover:text-black text-gray-400 transition-colors z-10 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-gray-200 flex items-center justify-center hover:border-black hover:text-black text-gray-400 transition-colors z-10 shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dots */}
      {total > visible && (
        <div className="flex justify-center gap-1.5 mt-4">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`transition-all duration-200 ${
                i === current
                  ? 'w-5 h-1.5 bg-black'
                  : 'w-1.5 h-1.5 bg-gray-200 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Services Bento ─────────────────────���───────────────────────────────────
function ServicesBentoSection({ t }: { t: (k: string) => string }) {
  return (
    <section className="py-12 md:py-16 bg-gray-50 border-t border-gray-100">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-[0.15em] mb-1">
            {t('services.title')}
          </p>
          <h2 className="text-xl text-gray-900">{t('services.title')}</h2>
        </div>

        <ServicesBento />
      </div>
    </section>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { addToCart, isInCart } = useCart();

  // ── All hooks at top level ──
  const { product, loading, error } = useSupabaseProduct(id);
  const { products: brandProducts } = useBrandProducts(product?.brand, id);
  const { brand: brandData } = useBrandByName(product?.brand);
  const inCart = product ? isInCart(product.id) : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 animate-pulse">
            <div className="bg-gray-100 aspect-square" />
            <div className="space-y-4">
              <div className="h-4 bg-gray-100 w-1/3" />
              <div className="h-8 bg-gray-100 w-2/3" />
              <div className="h-4 bg-gray-100 w-full" />
              <div className="h-4 bg-gray-100 w-3/4" />
              <div className="h-12 bg-gray-100 w-1/2 mt-6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">
            {language === 'ro' ? 'Produsul nu a fost găsit' : 'Товар не найден'}
          </p>
          <Button onClick={() => navigate('/catalog')} className="bg-gray-900 text-white hover:bg-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  const category    = categories.find((c) => c.id === product.category);
  const subcategory = category?.subcategories.find((s) => s.id === product.subcategory);
  const currentPrice = getCurrentPrice(product);
  const showSalePrice = hasSalePrice(product);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: currentPrice,
      image: product.image,
      category: product.category,
      sku: product.sku || undefined,
    });
    toast.success(
      language === 'ro'
        ? `"${product.name.ro}" adăugat în coș`
        : `"${product.name.ru}" добавлен в корзину`
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <SeoHead
        title={`${product.name[language as Language]} | SPORTOSFERA`}
        description={
          product.description[language as Language] ||
          (language === 'ro'
            ? `Cumpărați ${product.name.ro} la prețuri angro. ${product.brand ? `Brand: ${product.brand}.` : ''} Disponibil în Moldova.`
            : `Купить ${product.name.ru} по оптовым ценам. ${product.brand ? `Бренд: ${product.brand}.` : ''} Доставка по Молдове.`)
        }
        keywords={`${product.name.ro}, ${product.name.ru}${product.brand ? `, ${product.brand}` : ''}${product.sku ? `, ${product.sku}` : ''}, echipament sportiv Moldova, спортивное оборудование Молдова`}
        canonical={`/product/${product.id}`}
        ogImage={product.image || undefined}
        lang={language as 'ro' | 'ru'}
        jsonLd={[
          buildProductJsonLd(product),
          buildBreadcrumbJsonLd([
            { name: language === 'ro' ? 'Acasă' : 'Главная', url: 'https://sportosfera.md/' },
            { name: language === 'ro' ? 'Catalog' : 'Каталог', url: 'https://sportosfera.md/catalog' },
            ...(category ? [{ name: category.name[language as Language], url: `https://sportosfera.md/catalog?category=${category.id}` }] : []),
            { name: product.name[language as Language], url: `https://sportosfera.md/product/${product.id}` },
          ]),
        ]}
      />
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 overflow-x-auto whitespace-nowrap scrollbar-none">
            <Link to="/" className="hover:text-gray-900 transition-colors shrink-0">
              {t('nav.home')}
            </Link>
            <span>/</span>
            <Link to="/catalog" className="hover:text-gray-900 transition-colors shrink-0">
              {t('nav.catalog')}
            </Link>
            {category && (
              <>
                <span>/</span>
                <Link
                  to={`/catalog?category=${category.id}`}
                  className="hover:text-gray-900 transition-colors shrink-0"
                >
                  {category.name[language as Language]}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-gray-600 truncate">{product.name[language as Language]}</span>
          </div>
        </div>
      </div>

      {/* ── Main product block ── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-900 transition-colors mb-6 sm:mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </button>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-10 lg:gap-16">
          {/* Image Gallery */}
          <ProductImageGallery
            images={product.images?.length ? product.images : (product.image ? [product.image] : [])}
            productName={product.name[language as Language]}
          />

          {/* Details */}
          <div className="flex flex-col gap-5 sm:gap-6">
            {/* Category tags */}
            <div className="flex items-center gap-2 flex-wrap">
              {category && (
                <Link
                  to={`/catalog?category=${category.id}`}
                  className="text-xs text-gray-400 uppercase tracking-wider border border-gray-200 px-2 py-1 hover:border-gray-900 hover:text-gray-900 transition-colors"
                >
                  {category.name[language as Language]}
                </Link>
              )}
              {subcategory && (
                <span className="text-xs text-gray-300 uppercase tracking-wider">
                  / {subcategory.name[language as Language]}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl text-gray-900 mb-3">
                {product.name[language as Language]}
              </h1>
              <p className="text-gray-500 leading-relaxed">
                {product.description[language as Language]}
              </p>
            </div>

            {/* Codes block */}
            {(product.cod || product.brand || (product.brand && brandData?.catalog_pdf)) && (
              <div className="flex flex-wrap gap-2">
                {product.cod && (
                  <div className="flex items-center gap-2 border border-gray-200 bg-gray-50 px-3 py-2">
                    <Hash className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-gray-400 leading-none mb-0.5">
                        {language === 'ro' ? 'Cod articol' : 'Артикул'}
                      </p>
                      <p className="text-sm text-gray-800 font-mono">{product.cod}</p>
                    </div>
                  </div>
                )}
                {product.brand && (
                  <div className="flex items-center gap-2 border border-gray-200 bg-gray-50 px-3 py-2">
                    <div className="flex-1">
                      <p className="text-[9px] uppercase tracking-widest text-gray-400 leading-none mb-0.5">
                        {language === 'ro' ? 'Brand' : 'Бренд'}
                      </p>
                      {brandData?.slug ? (
                        <Link
                          to={`/brands/${brandData.slug}`}
                          className="text-sm text-black hover:underline underline-offset-2 flex items-center gap-1"
                        >
                          {product.brand}
                          <ExternalLink className="w-2.5 h-2.5 text-gray-400" />
                        </Link>
                      ) : (
                        <p className="text-sm text-gray-800">{product.brand}</p>
                      )}
                    </div>
                  </div>
                )}
                {/* Brand catalog PDF */}
                {product.brand && brandData?.catalog_pdf && (
                  <a
                    href={brandData.catalog_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 border border-gray-200 bg-gray-50 px-3 py-2 hover:border-black hover:bg-white transition-colors ml-auto"
                  >
                    <Download className="w-3.5 h-3.5 text-gray-400" />
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-gray-400 leading-none mb-0.5">
                        {language === 'ro' ? 'Catalog PDF' : 'Каталог PDF'}
                      </p>
                      <p className="text-sm text-gray-800">
                        {language === 'ro' ? 'Descarcă' : 'Скачать'}
                      </p>
                    </div>
                  </a>
                )}
              </div>
            )}

            {/* Price */}
            <div className="border-t border-b border-gray-100 py-5">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                {t('products.price')}
              </div>
              {showSalePrice ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg text-gray-400 line-through tabular-nums">
                      {product.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-300">MDL</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl text-red-600 tabular-nums">
                      {currentPrice.toLocaleString()}
                    </span>
                    <span className="text-red-500">MDL</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl text-gray-900 tabular-nums">
                    {currentPrice.toLocaleString()}
                  </span>
                  <span className="text-gray-400">MDL</span>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {language === 'ro' ? 'Preț inclusiv TVA' : 'Цена включая НДС'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                onClick={handleAddToCart}
                className={`w-full h-12 text-base ${
                  inCart ? 'bg-gray-900 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'
                }`}
              >
                {inCart ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    {language === 'ro' ? 'În coș' : 'В корзине'}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {t('products.addToRequest')}
                  </>
                )}
              </Button>
              {inCart && (
                <Link to="/order-request" className="w-full">
                  <Button size="lg" variant="outline" className="w-full h-12 text-base border-gray-300 hover:border-gray-900">
                    {language === 'ro' ? 'Vezi coșul' : 'Посмотреть корзину'}
                  </Button>
                </Link>
              )}
            </div>

            {/* Specifications */}
            {Object.keys(product.specifications[language as Language]).length > 0 && (
              <div>
                <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-4">
                  {t('products.specifications')}
                </h2>
                <div className="border border-gray-100 bg-gray-50 px-5 py-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {Object.entries(product.specifications[language as Language])
                      .map(([key, value]) => `${key}: ${value}`)
                      .join('\n')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video section */}
        <ProductVideoSection
          youtubeId={product.youtubeId}
          productName={product.name[language as Language]}
          language={language as 'ro' | 'ru'}
        />
      </div>

      {/* ── Brand Products Carousel ── */}
      {product.brand && brandProducts.length > 0 && (
        <section className="py-12 md:py-14 border-t border-gray-100 bg-white">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-[0.15em] mb-1">
                  {language === 'ro' ? 'Mai multe de la' : 'Ещё от'}
                </p>
                <h2 className="text-xl text-gray-900">{product.brand}</h2>
              </div>
              <Link
                to={`/catalog?brand=${encodeURIComponent(product.brand)}`}
                className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 hover:text-black transition-colors uppercase tracking-wider border-b border-gray-200 hover:border-black pb-0.5"
              >
                {language === 'ro' ? 'Toate produsele' : 'Все товары'}
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Carousel */}
            <div className="px-5">
              <BrandCarousel
                products={brandProducts}
                currentId={product.id}
                language={language as Language}
                t={t}
              />
            </div>

            {/* Mobile "all" link */}
            <div className="sm:hidden mt-5 text-center">
              <Link
                to={`/catalog?brand=${encodeURIComponent(product.brand)}`}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-black transition-colors uppercase tracking-wider border border-gray-200 hover:border-black px-4 py-2"
              >
                {language === 'ro' ? 'Toate produsele brandului' : 'Все товары бренда'}
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Services Bento ── */}
      <ServicesBentoSection t={t} />
    </div>
  );
}
