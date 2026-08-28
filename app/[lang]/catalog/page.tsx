import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight, ArrowUpRight, Package, ShieldCheck, Tag } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { getCatalogPageData, type CatalogProduct } from '../../_lib/catalog-data';
import type { Language } from '../../_components/HeaderPreview';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.VITE_SITE_URL || 'https://www.sporto.md').replace(/\/+$/, '');
const languages = new Set<Language>(['ro', 'ru']);

interface CatalogPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = 'force-dynamic';

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' si ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '') || 'produs';
}

function productHref(product: CatalogProduct, language: Language) {
  const name = language === 'ru' ? product.name_ru || product.name_ro : product.name_ro;
  return `/${language}/product/${encodeURIComponent(slugify(name))}/${encodeURIComponent(product.id)}`;
}

function formatPrice(value: number, language: Language) {
  return new Intl.NumberFormat(language === 'ru' ? 'ru-MD' : 'ro-MD', {
    maximumFractionDigits: 2,
  }).format(value);
}

function parsePage(rawValue: string | string[] | undefined) {
  if (rawValue === undefined) return 1;
  if (Array.isArray(rawValue) || !/^\d+$/.test(rawValue)) return null;
  const page = Number(rawValue);
  return Number.isSafeInteger(page) && page > 0 ? page : null;
}

function pageHref(language: Language, page: number) {
  return page === 1 ? `/${language}/catalog` : `/${language}/catalog?page=${page}`;
}

function ProductCard({ product, language }: { product: CatalogProduct; language: Language }) {
  const name = language === 'ru' ? product.name_ru || product.name_ro : product.name_ro;
  const inStock = (product.qty ?? 0) > 0;
  const onSale = product.sale_price !== null && product.sale_price > 0 && product.sale_price < product.price;
  const currentPrice = onSale ? product.sale_price as number : product.price;

  return (
    <a
      href={productHref(product, language)}
      className="group flex min-w-0 flex-col overflow-hidden rounded-[5px] border border-gray-100 bg-white transition duration-300 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-[0_14px_34px_rgba(15,23,42,0.10)]"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-white">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={name}
            loading="lazy"
            className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <Package className="h-8 w-8 text-gray-200" aria-hidden="true" />
        )}

        <span className={`absolute left-3 top-3 rounded-[3px] px-2 py-1 text-[11px] font-medium ${inStock ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>
          {inStock
            ? (language === 'ro' ? 'Disponibil' : 'В наличии')
            : (language === 'ro' ? 'La comandă' : 'Под заказ')}
        </span>

        {product.has_warranty && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-[3px] border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 shadow-sm">
            <ShieldCheck className="h-3 w-3 text-red-600" aria-hidden="true" />
            {language === 'ro' ? 'Garanție' : 'Гарантия'}
          </span>
        )}

        {onSale && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-[3px] bg-red-600 px-2 py-1 text-[11px] font-medium text-white">
            <Tag className="h-3 w-3" aria-hidden="true" />
            {language === 'ro' ? 'Promoție' : 'Акция'}
          </span>
        )}

        <ArrowUpRight className="absolute bottom-3 right-3 h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
      </div>

      <div className="flex flex-1 flex-col gap-2 border-t border-gray-100 p-4">
        {product.brand && <p className="text-xs font-medium text-gray-500">{product.brand}</p>}
        <h2 className="line-clamp-2 min-h-11 text-[15px] font-medium leading-[1.45] text-gray-900">{name}</h2>
        <p className="text-xs text-gray-400">{product.sku || `ART-${product.id}`}</p>
        <div className="mt-auto border-t border-gray-100 pt-3">
          {onSale && <p className="text-xs text-gray-400 line-through">{formatPrice(product.price, language)} MDL</p>}
          <p className={`text-lg font-semibold ${onSale ? 'text-red-600' : 'text-gray-900'}`}>
            {formatPrice(currentPrice, language)} <span className="text-xs font-normal">MDL</span>
          </p>
        </div>
      </div>
    </a>
  );
}

export async function generateMetadata({ params, searchParams }: CatalogPageProps): Promise<Metadata> {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  if (!languages.has(lang as Language)) return {};
  const isRo = lang === 'ro';
  const parsedPage = parsePage(query.page);
  const page = parsedPage && parsedPage > 1 ? parsedPage : 1;
  const canonical = `${siteUrl}${pageHref(lang as Language, page)}`;
  const pageSuffix = page > 1 ? (isRo ? ` — pagina ${page}` : ` — страница ${page}`) : '';

  return {
    title: isRo
      ? `Catalog de echipamente sportive${pageSuffix} | SPORTO`
      : `Каталог спортивного оборудования${pageSuffix} | SPORTO`,
    description: isRo
      ? 'Catalogul SPORTO de echipamente sportive profesionale disponibile în Moldova.'
      : 'Каталог профессионального спортивного оборудования SPORTO в Молдове.',
    alternates: {
      canonical,
      languages: {
        ro: `${siteUrl}${pageHref('ro', page)}`,
        ru: `${siteUrl}${pageHref('ru', page)}`,
        'x-default': `${siteUrl}${pageHref('ro', page)}`,
      },
    },
  };
}

export default async function CatalogPage({ params, searchParams }: CatalogPageProps) {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  if (!languages.has(lang as Language)) notFound();
  const language = lang as Language;
  const page = parsePage(query.page);
  if (page === null) redirect(`/${language}/catalog`);
  if (page === 1 && query.page !== undefined) redirect(`/${language}/catalog`);

  const data = await getCatalogPageData(page);
  if (data.status === 'out-of-range') notFound();

  return (
    <section className="min-h-[70vh] bg-[#f5f6f7] py-10 md:py-14">
      <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm font-medium text-red-600">SPORTO</p>
          <h1 className="text-3xl font-semibold text-gray-950 md:text-4xl">
            {language === 'ro' ? 'Catalog de produse' : 'Каталог товаров'}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-gray-600">
            {language === 'ro'
              ? 'Echipamente sportive pentru săli, cluburi, instituții și antrenamente personale.'
              : 'Спортивное оборудование для залов, клубов, учреждений и личных тренировок.'}
          </p>
        </div>

        {data.status === 'ready' && data.products.length > 0 && (
          <>
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                {language === 'ro'
                  ? `${data.totalProducts} produse`
                  : `${data.totalProducts} товаров`}
              </p>
              {data.totalPages > 1 && (
                <p className="text-sm font-medium text-gray-700">
                  {language === 'ro'
                    ? `Pagina ${data.page} din ${data.totalPages}`
                    : `Страница ${data.page} из ${data.totalPages}`}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.products.map(product => (
                <ProductCard key={product.id} product={product} language={language} />
              ))}
            </div>

            {data.totalPages > 1 && (
              <nav aria-label={language === 'ro' ? 'Paginarea catalogului' : 'Пагинация каталога'} className="mt-10 flex items-center justify-between gap-4 border-t border-gray-200 pt-6">
                {data.page > 1 ? (
                  <a href={pageHref(language, data.page - 1)} className="inline-flex min-h-11 items-center gap-2 rounded-[5px] border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-800 transition-colors hover:border-gray-900">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    {language === 'ro' ? 'Înapoi' : 'Назад'}
                  </a>
                ) : <span />}

                <div className="hidden items-center gap-2 sm:flex">
                  {Array.from({ length: data.totalPages }, (_, index) => index + 1)
                    .filter(item => item === 1 || item === data.totalPages || Math.abs(item - data.page) <= 1)
                    .map((item, index, visiblePages) => (
                      <span key={item} className="flex items-center gap-2">
                        {index > 0 && item - visiblePages[index - 1] > 1 && <span className="px-1 text-gray-400">…</span>}
                        <a
                          href={pageHref(language, item)}
                          aria-current={item === data.page ? 'page' : undefined}
                          className={`flex h-11 min-w-11 items-center justify-center rounded-[5px] border px-3 text-sm font-semibold transition-colors ${item === data.page ? 'border-black bg-black text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-900'}`}
                        >
                          {item}
                        </a>
                      </span>
                    ))}
                </div>

                {data.page < data.totalPages ? (
                  <a href={pageHref(language, data.page + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-[5px] bg-red-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-700">
                    {language === 'ro' ? 'Înainte' : 'Далее'}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : <span />}
              </nav>
            )}
          </>
        )}

        {data.status === 'ready' && data.products.length === 0 && (
          <div className="rounded-[5px] border border-gray-200 bg-white px-6 py-16 text-center">
            <Package className="mx-auto mb-4 h-8 w-8 text-gray-300" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900">
              {language === 'ro' ? 'Catalogul este momentan gol' : 'Каталог пока пуст'}
            </h2>
          </div>
        )}

        {(data.status === 'error' || data.status === 'unavailable') && (
          <div className="rounded-[5px] border border-red-200 bg-white px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {language === 'ro' ? 'Catalogul nu poate fi încărcat' : 'Не удалось загрузить каталог'}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {language === 'ro' ? 'Încercați din nou puțin mai târziu.' : 'Пожалуйста, попробуйте ещё раз немного позже.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
