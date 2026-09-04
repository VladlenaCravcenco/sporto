import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Package, ShieldCheck, Tag } from 'lucide-react';
import { getProductDetail, getProductYoutubeId, type ProductDetailData } from '../../../../_lib/product-data';
import type { Language } from '../../../../_components/HeaderPreview';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.VITE_SITE_URL || 'https://www.sporto.md').replace(/\/+$/, '');
const supportedLanguages = new Set<Language>(['ro', 'ru']);

interface ProductPageProps {
  params: Promise<{ lang: string; slug: string; sku: string }>;
}

function slugify(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'produs';
}

function productPath(product: ProductDetailData['product'], language: Language) {
  const name = language === 'ru' ? product.name_ru || product.name_ro : product.name_ro;
  return `/${language}/product/${encodeURIComponent(slugify(name))}/${encodeURIComponent(product.id)}`;
}

function formatPrice(value: number, language: Language) {
  return new Intl.NumberFormat(language === 'ru' ? 'ru-MD' : 'ro-MD', { maximumFractionDigits: 2 }).format(value);
}

function localizedText(language: Language, ro: string | null, ru: string | null) {
  return language === 'ru' ? ru || ro || '' : ro || ru || '';
}

function getDescription(data: ProductDetailData, language: Language) {
  return localizedText(language, data.product.seo_description_ro || data.product.description_ro, data.product.seo_description_ru || data.product.description_ru);
}

function getImages(data: ProductDetailData) {
  return [...new Set([...(data.product.images || []), ...(data.product.image_url ? [data.product.image_url] : [])])];
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { lang, slug, sku } = await params;
  if (!supportedLanguages.has(lang as Language)) return {};
  const language = lang as Language;
  const data = await getProductDetail(sku, sku);
  if (!data) return {};
  const name = localizedText(language, data.product.name_ro, data.product.name_ru);
  const canonical = `${siteUrl}${productPath(data.product, language)}`;
  return {
    title: name,
    description: getDescription(data, language).slice(0, 160),
    keywords: localizedText(language, data.product.seo_keywords_ro, data.product.seo_keywords_ru) || undefined,
    alternates: {
      canonical,
      languages: {
        ro: `${siteUrl}${productPath(data.product, 'ro')}`,
        ru: `${siteUrl}${productPath(data.product, 'ru')}`,
        'x-default': `${siteUrl}${productPath(data.product, 'ro')}`,
      },
    },
    openGraph: { type: 'website', title: name, description: getDescription(data, language).slice(0, 160), url: canonical, images: getImages(data).slice(0, 1) },
  };
}

function ProductJsonLd({ data, language, canonical }: { data: ProductDetailData; language: Language; canonical: string }) {
  const product = data.product;
  const name = localizedText(language, product.name_ro, product.name_ru);
  const description = getDescription(data, language);
  const onSale = product.sale_price != null && product.sale_price > 0 && product.sale_price < product.price;
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Product', name, description, sku: product.sku || product.id,
      url: canonical, image: getImages(data), brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
      offers: { '@type': 'Offer', url: canonical, priceCurrency: 'MDL', price: onSale ? product.sale_price : product.price, availability: product.qty && product.qty > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder' },
    }) }} />
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { lang, slug, sku } = await params;
  if (!supportedLanguages.has(lang as Language)) notFound();
  const language = lang as Language;
  const data = await getProductDetail(sku, sku);
  if (!data) notFound();

  const product = data.product;
  const canonical = `${siteUrl}${productPath(product, language)}`;
  if (decodeURIComponent(slug) !== slugify(localizedText(language, product.name_ro, product.name_ru)) || sku !== product.id) {
    redirect(productPath(product, language));
  }
  const name = localizedText(language, product.name_ro, product.name_ru);
  const description = localizedText(language, product.description_ro, product.description_ru);
  const images = getImages(data);
  const onSale = product.sale_price != null && product.sale_price > 0 && product.sale_price < product.price;
  const currentPrice = onSale ? product.sale_price as number : product.price;
  const inStock = (product.qty || 0) > 0;
  const categoryLabel = product.category.replace(/-/g, ' ');

  return (
    <main className="min-h-[70vh] bg-white py-8 md:py-12">
      <ProductJsonLd data={data} language={language} canonical={canonical} />
      <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <Link href={`/${language}/catalog`} className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {language === 'ro' ? 'Înapoi la catalog' : 'Вернуться в каталог'}
        </Link>
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
          <Link href={`/${language}`} className="hover:text-gray-900">SPORTO</Link><span className="mx-2">/</span>
          <Link href={`/${language}/catalog`} className="hover:text-gray-900">{language === 'ro' ? 'Catalog' : 'Каталог'}</Link><span className="mx-2">/</span>
          <span className="text-gray-900">{name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="flex aspect-square items-center justify-center overflow-hidden border border-gray-100 bg-gray-50">
              {images[0] ? <img src={images[0]} alt={name} className="h-full w-full object-contain p-6" /> : <Package className="h-12 w-12 text-gray-300" aria-hidden="true" />}
            </div>
            {images.length > 1 && <div className="mt-3 grid grid-cols-4 gap-3">{images.slice(1, 5).map(image => <img key={image} src={image} alt="" className="aspect-square w-full object-contain border border-gray-100 bg-gray-50 p-2" />)}</div>}
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <div className="mb-3 flex flex-wrap gap-2 text-xs uppercase tracking-wider text-gray-500"><span>{categoryLabel}</span>{product.brand && <span>• {product.brand}</span>}</div>
              <h1 className="text-3xl font-semibold text-gray-950 md:text-4xl">{name}</h1>
              {product.sku && <p className="mt-3 text-sm text-gray-500">{language === 'ro' ? 'SKU' : 'Артикул'}: {product.sku}</p>}
            </div>
            <p className="whitespace-pre-wrap text-base leading-7 text-gray-600">{description || (language === 'ro' ? 'Informații despre produs la cerere.' : 'Информация о товаре предоставляется по запросу.')}</p>
            <div className="border-y border-gray-200 py-5">
              {onSale && <p className="text-sm text-gray-400 line-through">{formatPrice(product.price, language)} MDL</p>}
              <p className={`text-3xl font-semibold ${onSale ? 'text-red-600' : 'text-gray-950'}`}>{formatPrice(currentPrice, language)} <span className="text-base font-normal">MDL</span></p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm"><span className={inStock ? 'text-green-700' : 'text-gray-500'}>{inStock ? (language === 'ro' ? 'Disponibil' : 'В наличии') : (language === 'ro' ? 'La comandă' : 'Под заказ')}</span>{product.has_warranty && <span className="inline-flex items-center gap-1 text-gray-600"><ShieldCheck className="h-4 w-4 text-red-600" />{language === 'ro' ? 'Garanție' : 'Гарантия'}</span>}{onSale && <span className="inline-flex items-center gap-1 text-red-600"><Tag className="h-4 w-4" />{language === 'ro' ? 'Promoție' : 'Акция'}</span>}</div>
            </div>
            {data.specifications.length > 0 && <section><h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">{language === 'ro' ? 'Specificații' : 'Характеристики'}</h2><dl className="divide-y divide-gray-200 border border-gray-100 bg-gray-50 px-5">{data.specifications.map(item => <div key={item.name} className="flex justify-between gap-4 py-3 text-sm"><dt className="text-gray-500">{item.name}</dt><dd className="text-right text-gray-900">{item.value}</dd></div>)}</dl></section>}
            {data.brand?.catalog_pdf && <a href={data.brand.catalog_pdf} target="_blank" rel="noreferrer" className="text-sm font-medium text-red-600 hover:underline">{language === 'ro' ? 'Descarcă catalogul brandului' : 'Скачать каталог бренда'}</a>}
          </div>
        </div>
        {getProductYoutubeId(product) && <div className="mt-12 border-t border-gray-100 pt-8"><h2 className="mb-4 text-xl font-semibold">{language === 'ro' ? 'Video' : 'Видео'}</h2><div className="aspect-video max-w-3xl"><iframe className="h-full w-full" src={`https://www.youtube.com/embed/${getProductYoutubeId(product)}`} title={name} loading="lazy" allowFullScreen /></div></div>}
      </div>
    </main>
  );
}