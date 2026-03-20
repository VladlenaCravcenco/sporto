import { useState, type ReactNode } from 'react';
import { useSupabaseFeatured, useProductCount, useCategoryCount, usePromoCount } from '../hooks/useSupabaseProducts';
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
  Package,
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
} from 'lucide-react';

const categoryIcons: Record<string, ReactNode> = {
  'aparate-cardio': <Heart className="w-5 h-5" />,          // Кардио - сердце
  'aparate-forta': <Dumbbell className="w-5 h-5" />,        // Силовые тренажёры - гантель
  'greutati': <Weight className="w-5 h-5" />,               // Грузы - гиря
  'fitness-yoga': <YinYang className="w-5 h-5" />,          // Фитнес/йога - инь-янь
  'sporturi-colective': <Users className="w-5 h-5" />,      // Командные виды - люди
  'sporturi-individuale': <Trophy className="w-5 h-5" />,   // Индивидуальные - трофей
  'arte-martiale': <Swords className="w-5 h-5" />,          // Боевые искусства - мечи
  'inot': <Waves className="w-5 h-5" />,                    // Плавание - волны
  'tenis-masa': <TableTennis className="w-5 h-5" />,        // Настольный теннис - ракетка с мячом
  'jocuri': <Gamepad2 className="w-5 h-5" />,               // Игры - геймпад
  'forta-exterior': <TreePine className="w-5 h-5" />,       // Уличные тренажёры - дерево
  'inventar-institutii': <Building2 className="w-5 h-5" />, // Оборудование для учреждений - здание
};

export function Home() {
  const { language, t } = useLanguage();
  const categories = useCategories();
  const { products: featuredProducts, loading: featuredLoading } = useSupabaseFeatured();
  const { banners, loading: bannersLoading } = useSupabaseBanners();
  const [modalOpen, setModalOpen] = useState(false);
  const productCount = useProductCount();
  const categoryCount = useCategoryCount();
  const promoCount = usePromoCount();

  const lang = language as Language;
  const seo = SEO_PAGES.home[lang];

  const stats = [
    { value: '2023', label: language === 'ro' ? 'Fondată în' : 'Год основания' },
    { value: 'B2B', label: language === 'ro' ? 'Prețuri wholesale' : 'Оптовые цены' },
    { value: '24h', label: language === 'ro' ? 'Timp de răspuns' : 'Время ответа' },
    { value: 'EU', label: language === 'ro' ? 'Echipamente italiene' : 'Техника из Италии' },
  ];

  const hasBanners = !bannersLoading && banners.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <SeoHead
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        canonical="/"
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
              {/* Combined Products & Categories card */}
              <Link 
                to="/catalog"
                className="bg-gray-950 text-white p-4 sm:p-6 md:p-8 flex flex-col justify-between min-h-[120px] lg:min-h-0 lg:flex-1 group hover:bg-gray-900 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider sm:tracking-widest leading-tight">
                    {language === 'ro' ? 'Catalog' : 'Каталог'}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-4xl sm:text-5xl md:text-6xl text-white tabular-nums leading-none">{productCount}</div>
                    <div className="text-[10px] sm:text-xs text-gray-600 mt-1 uppercase tracking-widest">
                      {language === 'ro' ? 'produse' : 'товаров'}
                    </div>
                  </div>
                  <div className="flex items-end gap-3 pt-2 border-t border-gray-800">
                    <div className="text-2xl sm:text-3xl text-white tabular-nums leading-none">{categoryCount}</div>
                    <div className="text-[10px] sm:text-xs text-gray-600 uppercase tracking-widest pb-0.5">
                      {language === 'ro' ? 'categorii' : 'категорий'}
                    </div>
                  </div>
                </div>
              </Link>
              {/* Promos card */}
              <Link 
                to="/catalog?sale=true"
                className="bg-gradient-to-br from-red-600 to-red-700 text-white p-4 sm:p-6 md:p-8 flex flex-col justify-between min-h-[120px] lg:min-h-0 lg:flex-1 group hover:from-red-700 hover:to-red-800 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] sm:text-xs text-red-200 uppercase tracking-wider sm:tracking-widest leading-tight">
                    {language === 'ro' ? 'Promoții' : 'Акции'}
                  </span>
                  <Tag className="w-4 h-4 text-red-300 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-5xl sm:text-6xl md:text-7xl text-white tabular-nums leading-none">{promoCount}</div>
                  <div className="text-[10px] sm:text-xs text-red-200 mt-1 uppercase tracking-widest">
                    {language === 'ro' ? 'cu reducere' : 'со скидкой'}
                  </div>
                </div>
              </Link>
            </div>

            {/* Bottom Stats strip */}
            <div className="col-span-12 grid grid-cols-4 border border-gray-100">
              {stats.map((stat, i) => (
                <div
                  key={stat.value}
                  className={`px-5 py-5 text-center ${i < 3 ? 'border-r border-gray-100' : ''}`}
                >
                  <div className="text-sm md:text-base text-black tabular-nums">{stat.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ─── PARTNERS MARQUEE ── */}
      <PartnersMarquee />

      {/* ─── CATEGORIES BENTO ─── */}
      <section className="py-12 md:py-16 bg-gray-50">
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
                      {categoryIcons[category.id]}
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
                        {categoryIcons[category.id]}
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
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl text-gray-900">{t('products.featured')}</h2>
            </div>
            <Link
              to="/catalog"
              className="text-xs text-gray-400 hover:text-black flex items-center gap-1.5 transition-colors uppercase tracking-wider"
            >
              {t('products.all')}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Products bento grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">

            {featuredLoading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`animate-pulse bg-gray-100 ${i === 0 ? 'col-span-2 row-span-2 min-h-[320px]' : 'min-h-[160px]'}`}
                />
              ))
            ) : featuredProducts.length === 0 ? (
              <div className="col-span-4 py-16 text-center">
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
                {/* Large featured product */}
                {featuredProducts[0] && (
                  <div className="col-span-2 row-span-1 md:row-span-2">
                    <Link
                      to={`/product/${featuredProducts[0].id}`}
                      className="group block bg-black text-white h-full min-h-[240px] overflow-hidden relative flex flex-col"
                    >
                      <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id="grid-feat" width="32" height="32" patternUnits="userSpaceOnUse">
                            <path d="M32 0 L0 0 0 32" fill="none" stroke="#fff" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid-feat)" />
                      </svg>
                      {featuredProducts[0].image ? (
                        <img
                          src={featuredProducts[0].image}
                          alt={featuredProducts[0].name[language as Language]}
                          className="absolute inset-0 w-full h-full object-cover opacity-30"
                        />
                      ) : null}
                      <div className="relative z-10 p-6 flex flex-col h-full justify-between flex-1">
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 bg-white/10 flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">
                            {language === 'ro' ? 'Produs recomandat' : 'Рекомендуем'}
                          </div>
                          <h3 className="text-lg md:text-xl text-white mb-3 leading-snug">
                            {featuredProducts[0].name[language as Language]}
                          </h3>
                          <div className="flex items-center justify-between">
                            <div className="text-white">
                              <span className="text-xl tabular-nums">
                                {featuredProducts[0].price.toLocaleString()}
                              </span>
                              <span className="text-xs text-gray-500 ml-1">MDL</span>
                            </div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider border border-gray-700 px-2 py-0.5">
                              {language === 'ro' ? 'Detalii' : 'Подробнее'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                )}

                {/* Regular products */}
                {featuredProducts.slice(1, 7).map((product) => (
                  <div key={product.id} className="col-span-1">
                    <ProductCard product={product} />
                  </div>
                ))}
              </>
            )}

            {/* CTA card */}
            <div className="col-span-2 md:col-span-1 lg:col-span-1 border border-gray-200 p-6 flex flex-col justify-between bg-gray-50">
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
              <div key={item.num} className="bg-gray-50 border border-gray-100 p-5 md:p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 bg-black flex items-center justify-center text-white">
                    {item.icon}
                  </div>
                  <span className="text-xs text-gray-200 tabular-nums">{item.num}</span>
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-gray-900 mb-2">{item.title}</h3>
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

      <ConsultationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        type="turnkey"
      />
    </div>
  );
}