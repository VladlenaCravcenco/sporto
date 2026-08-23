import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSupabaseFeatured, usePromoCount } from '../hooks/useSupabaseProducts';
import { Link } from 'react-router';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { useCategories } from '../contexts/CategoriesContext';
import { useSupabaseBanners } from '../hooks/useSupabaseBanners';
import { ProductCard } from '../components/ProductCard';
import { SeoHead, SEO_PAGES } from '../components/SeoHead';
import { Button } from '../components/ui/button';
import { HeroBannerSlider } from '../components/HeroBannerSlider';
import { PartnersMarquee } from '../components/PartnersMarquee';
import { ServicesBento } from '../components/ServicesBento';
import { ConsultationModal } from '../components/ConsultationModal';
import { YinYang } from '../components/icons/YinYang';
import { TableTennis } from '../components/icons/TableTennis';
import { getCategoryIcon } from '../lib/category-icons';
import {
  Dumbbell,
  Bike,
  Weight,
  Waves,
  Trophy,
  Users,
  Swords,
  Activity,
  Gamepad2,
  Building2,
  TreePine,
  ArrowRight,
  Wrench,
  CheckCircle,
  TrendingUp,
  Award,
  ArrowUpRight,
  Zap,
  Tag,
  Heart,
  CircleDot,
  Wind,
  Target,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export function Home() {
  const { language, t } = useLanguage();
  const categories = useCategories();
  const { products: featuredProducts, loading: featuredLoading } = useSupabaseFeatured();
  const { banners, loading: bannersLoading } = useSupabaseBanners();
  const [modalOpen, setModalOpen] = useState(false);
  const promoCount = usePromoCount();
  const featuredViewport = useRef<HTMLDivElement>(null);
  const featuredPaused = useRef(false);

  const scrollFeatured = useCallback((direction: 1 | -1) => {
    if (!featuredViewport.current) return;
    const card = featuredViewport.current.querySelector<HTMLElement>('[data-featured-card]');
    const distance = (card?.offsetWidth ?? 280) + 12;
    const atEnd = featuredViewport.current.scrollLeft + featuredViewport.current.clientWidth >= featuredViewport.current.scrollWidth - 8;
    const atStart = featuredViewport.current.scrollLeft <= 8;

    if (direction === 1 && atEnd) {
      featuredViewport.current.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }
    if (direction === -1 && atStart) {
      featuredViewport.current.scrollTo({ left: featuredViewport.current.scrollWidth, behavior: 'smooth' });
      return;
    }
    featuredViewport.current.scrollBy({ left: direction * distance, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (featuredProducts.length < 2) return;
    const timer = window.setInterval(() => {
      if (!featuredPaused.current) scrollFeatured(1);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [featuredProducts.length, scrollFeatured]);

  const lang = language as Language;
  const seo = SEO_PAGES.home[lang];
  const canonicalPath = lang === 'ru' ? '/ru' : '/';

  const hasBanners = !bannersLoading && banners.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <SeoHead
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        canonical={canonicalPath}
        lang={lang}
      />

      {/* ─── BENTO HERO ─── */}
      <section className="bg-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 lg:py-14">
          <div className="grid grid-cols-12 gap-2 md:gap-3">

            {/* Main Hero Card — dark, spans 8 cols */}
            <div className="col-span-12 lg:col-span-8 overflow-hidden">
              {hasBanners ? (
                <HeroBannerSlider
                  banners={banners}
                  language={lang}
                  onCtaClick={() => setModalOpen(true)}
                />
              ) : (
                <div className="bg-black text-white p-10 md:p-14 lg:p-16 flex flex-col justify-between min-h-[420px] lg:min-h-[540px]">
                  <div className="flex items-center gap-3">
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl lg:text-[3.25rem] text-white mb-6 leading-tight max-w-xl">
                      {t('hero.title')}
                    </h1>
                    <p className="text-sm text-gray-400 mb-10 max-w-sm leading-relaxed">
                      {t('hero.subtitle')}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button size="lg" onClick={() => setModalOpen(true)} className="bg-white text-black hover:bg-gray-100 rounded-none border-0 px-8">
                        {t('hero.cta')}
                      </Button>
                      <Link to="/catalog">
                        <Button
                          size="lg"
                          variant="outline"
                          className="rounded-none border-gray-700 text-gray-300 hover:border-white hover:text-white bg-transparent px-8"
                        >
                          {t('hero.catalog')}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right column — 2 stacked cards */}
            <div className="col-span-12 lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-2 md:gap-3">
              <Link 
                to="/turnkey-solutions"
                className="bg-gray-950 text-white p-4 sm:p-6 md:p-8 flex flex-col justify-between min-h-[180px] lg:min-h-0 lg:flex-1 group hover:bg-black transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-end mb-6">
                  <ArrowUpRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl text-white uppercase leading-tight mb-4">
                    {language === 'ro' ? 'Soluții la cheie' : 'Решения под ключ'}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-sm mb-5">
                    {language === 'ro' ? 'De la proiectare și selecția echipamentelor până la livrare și instalare.' : 'От проектирования и подбора оборудования до доставки и установки.'}
                  </p>
                </div>
              </Link>
              {/* Promos card */}
              <Link 
                to="/catalog?sale=true"
                className="bg-gradient-to-br from-red-600 to-red-700 text-white p-4 sm:p-6 md:p-8 flex flex-col justify-between min-h-[120px] lg:min-h-0 lg:flex-1 group hover:from-red-700 hover:to-red-800 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <span />
                  <Tag className="w-4 h-4 text-red-300 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-5xl sm:text-6xl md:text-7xl text-white tabular-nums leading-none">{promoCount}</div>
                  <div className="text-[10px] sm:text-xs text-red-200 mt-1 uppercase tracking-widest">
                    {language === 'ro' ? 'Promoții cu reducere' : 'Товаров со скидкой'}
                  </div>
                </div>
              </Link>
            </div>

          </div>
        </div>
      </section>

      <div className="flex flex-col">
      {/* ─── CATEGORIES BENTO ─── */}
      <section className="order-2 py-12 md:py-16 bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl text-gray-900">{t('categories.title')}</h2>
            </div>
            <Link
              to="/catalog"
              className="text-xs text-gray-400 hover:text-black flex items-center gap-1.5 transition-colors uppercase tracking-wider"
            >
              {language === 'ro' ? 'Toate' : 'Все'}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Bento category grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-3">
            {categories.map((category, i) => (
              <Link
                key={category.id}
                to={`/catalog?category=${category.id}`}
                className={`group flex gap-4 border transition-all duration-200 hover:bg-black hover:border-black ${
                  i === 0
                    ? 'col-span-2 flex-row items-center p-5 md:p-7 bg-black border-black text-white'
                    : 'flex-col p-4 md:p-5 bg-white border-gray-200 text-gray-900'
                }`}
              >
                {i === 0 ? (
                  /* ── First card: full-width horizontal layout ── */
                  <>
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-white/10 text-white">
                      {getCategoryIcon(category.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm uppercase tracking-wider text-white">
                        {category.name[language as Language]}
                      </div>
                      {category.subcategories && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {category.subcategories.length}{' '}
                          {language === 'ro' ? 'sub.' : 'подкат.'}
                        </div>
                      )}
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors flex-shrink-0" />
                  </>
                ) : (
                  /* ── Other cards: vertical layout ── */
                  <>
                    <div className="flex items-start justify-between">
                      <div className="w-9 h-9 flex items-center justify-center bg-gray-100 text-gray-500 group-hover:bg-white/10 group-hover:text-white transition-colors">
                        {getCategoryIcon(category.icon)}
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-white transition-all" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider leading-tight text-gray-900 group-hover:text-white">
                        {category.name[language as Language]}
                      </div>
                      {category.subcategories && (
                        <div className="text-xs mt-0.5 text-gray-400 group-hover:text-gray-500">
                          {category.subcategories.length}{' '}
                          {language === 'ro' ? 'sub.' : 'подкат.'}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS BENTO ─── */}
      <section className="order-1 py-12 md:py-16 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl text-gray-900">{t('products.featured')}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/catalog"
                className="hidden sm:flex text-xs text-gray-400 hover:text-black items-center gap-1.5 transition-colors uppercase tracking-wider"
              >
                {t('products.all')}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button type="button" onClick={() => scrollFeatured(-1)} className="w-9 h-9 border border-gray-200 flex items-center justify-center text-gray-400 hover:border-black hover:text-black transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => scrollFeatured(1)} className="w-9 h-9 border border-gray-200 flex items-center justify-center text-gray-400 hover:border-black hover:text-black transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Products bento grid */}
          <div
            ref={featuredViewport}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onMouseEnter={() => { featuredPaused.current = true; }}
            onMouseLeave={() => { featuredPaused.current = false; }}
          >

            {featuredLoading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-none w-[78vw] sm:w-[300px] lg:w-[calc((100%_-_36px)_/_4)] aspect-[3/4] animate-pulse bg-gray-100"
                />
              ))
            ) : featuredProducts.length === 0 ? (
              <div className="w-full py-16 text-center">
                <p className="text-sm text-gray-400 mb-3">
                  {language === 'ro'
                    ? 'Niciun produs recomandat selectat.'
                    : 'Рекомендуемые товары не выбраны.'}
                </p>
                <Link
                  to="/admin/featured"
                  className="text-xs uppercase tracking-wider border border-gray-300 px-4 py-2 text-gray-500 hover:border-black hover:text-black transition-colors"
                >
                  {language === 'ro' ? 'Alege produse' : 'Выбрать товары'}
                </Link>
              </div>
            ) : (
              <>
                {featuredProducts.slice(0, 20).map((product) => (
                  <div key={product.id} data-featured-card className="flex-none w-[78vw] sm:w-[300px] lg:w-[calc((100%_-_36px)_/_4)] snap-start flex [&>a]:w-full">
                    <ProductCard product={product} />
                  </div>
                ))}
              </>
            )}

            {/* CTA card */}
            <div className="flex-none w-[78vw] sm:w-[300px] lg:w-[calc((100%_-_36px)_/_4)] snap-start border border-gray-200 p-6 flex flex-col justify-between bg-gray-50 min-h-[360px]">
              <div className="text-xs text-gray-400 uppercase tracking-widest">
                {language === 'ro' ? 'Catalog complet' : 'Полный каталог'}
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  {language === 'ro'
                    ? 'Găsiți toate produsele în catalogul nostru'
                    : 'Все товары в нашем каталоге'}
                </p>
                <Link
                  to="/catalog"
                  className="inline-flex items-center gap-2 text-xs text-black border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors uppercase tracking-wider"
                >
                  {language === 'ro' ? 'Deschide' : 'Открыть'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* ─── SERVICES BENTO ─── */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-xl text-gray-900">{t('services.title')}</h2>
          </div>

          <ServicesBento />
        </div>
      </section>

      {/* ─── WHY US BENTO ─── */}
      <section className="py-12 md:py-16 bg-white border-t border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-xl text-gray-900">{t('about.title')}</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
            {[
              { icon: <TrendingUp className="w-5 h-5" />, title: t('about.experience'), desc: t('about.experience.desc'), num: '01' },
              { icon: <Award className="w-5 h-5" />, title: t('about.quality'), desc: t('about.quality.desc'), num: '02' },
              { icon: <Users className="w-5 h-5" />, title: t('about.support'), desc: t('about.support.desc'), num: '03' },
              { icon: <CheckCircle className="w-5 h-5" />, title: t('about.prices'), desc: t('about.prices.desc'), num: '04' },
            ].map((item) => (
              <div key={item.num} className="min-w-0 bg-gray-50 border border-gray-100 p-5 md:p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 bg-black flex items-center justify-center text-white">
                    {item.icon}
                  </div>
                  <span className="text-xs text-gray-200 tabular-nums">{item.num}</span>
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-gray-900 mb-2 break-words [overflow-wrap:anywhere]">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BENTO ─── */}
      <section className="py-12 md:py-16 bg-black text-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 md:grid md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl md:text-3xl text-white mb-4 leading-tight">{t('cta.title')}</h2>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:justify-end">
              <Button size="lg" onClick={() => setModalOpen(true)} className="w-full md:w-auto bg-white text-black hover:bg-gray-100 rounded-none px-10">
                {t('cta.button')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Link to="/catalog" className="w-full md:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full md:w-auto rounded-none border-gray-800 text-gray-400 hover:border-white hover:text-white bg-transparent px-10"
                >
                  {t('hero.catalog')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PartnersMarquee />

      <ConsultationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        type="turnkey"
      />
    </div>
  );
}
