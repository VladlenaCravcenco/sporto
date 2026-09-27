import { CatalogFilters } from '../../_components/CatalogFilters';
import { getFilteredCatalog } from '../../_lib/catalog-filter-data';
import type { CatalogQuery } from '../../_lib/catalog-filters';
import { ProductCardView } from '../../../src/app/components/ProductCardView';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight, Package } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { type CatalogProduct, type CatalogSort } from '../../_lib/catalog-data';
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

function parsePage(rawValue: string | string[] | undefined) {
  if (rawValue === undefined) return 1;
  if (Array.isArray(rawValue) || !/^\d+$/.test(rawValue)) return null;
  const page = Number(rawValue);
  return Number.isSafeInteger(page) && page > 0 ? page : null;
}

function parseSort(rawValue: string | string[] | undefined): CatalogSort | null {
  if (rawValue === undefined) return 'recommended';
  if (Array.isArray(rawValue)) return null;
  return rawValue === 'recommended' || rawValue === 'price-asc' || rawValue === 'price-desc' || rawValue === 'name-asc'
    ? rawValue
    : null;
}

function catalogHref(language: Language, page: number, sort: CatalogSort, filters: CatalogQuery = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value == null || key === 'page' || key === 'sort') continue;
    for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
  }
  if (sort !== 'recommended') params.set('sort', sort);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return `/${language}/catalog${query ? `?${query}` : ''}`;
}

export async function generateMetadata({ params, searchParams }: CatalogPageProps): Promise<Metadata> {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  if (!languages.has(lang as Language)) return {};
  const isRo = lang === 'ro';
  const parsedPage = parsePage(query.page);
  const page = parsedPage && parsedPage > 1 ? parsedPage : 1;
  const canonical = `${siteUrl}${catalogHref(lang as Language, page, 'recommended')}`;
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
        ro: `${siteUrl}${catalogHref('ro', page, 'recommended')}`,
        ru: `${siteUrl}${catalogHref('ru', page, 'recommended')}`,
        'x-default': `${siteUrl}${catalogHref('ro', page, 'recommended')}`,
      },
    },
  };
}

export default async function CatalogPage({ params, searchParams }: CatalogPageProps) {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  if (!languages.has(lang as Language)) notFound();
  const language = lang as Language;
  const filters = query;
  const page = parsePage(query.page);
  const sort = parseSort(query.sort);
  if (page === null || sort === null) redirect(`/${language}/catalog`);
  if ((page === 1 && query.page !== undefined) || (sort === 'recommended' && query.sort !== undefined)) {
    redirect(catalogHref(language, page, sort, filters));
  }

  const data = await getFilteredCatalog(query, page, sort, language);
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

        <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        {data.status === 'ready' && <CatalogFilters key={JSON.stringify(query)} facets={data.facets} query={query} language={language} />}
        <div className="min-w-0">
        {data.status === 'ready' && data.products.length > 0 && (
          <>
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <p className="text-sm text-gray-500">
                {language === 'ro'
                  ? `${data.totalProducts} produse`
                  : `${data.totalProducts} товаров`}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                {data.totalPages > 1 && (
                  <p className="pb-2.5 text-sm font-medium text-gray-700">
                    {language === 'ro'
                      ? `Pagina ${data.page} din ${data.totalPages}`
                      : `Страница ${data.page} из ${data.totalPages}`}
                  </p>
                )}
                <form action={`/${language}/catalog`} method="get" className="flex items-end gap-2">
                  {Object.entries(filters).filter(([key]) => key !== 'sort' && key !== 'page').flatMap(([key, value]) => (Array.isArray(value) ? value : value ? [value] : []).map((item, index) => <input key={`${key}-${index}`} type="hidden" name={key} value={item} />))}
                  <label className="flex min-w-[220px] flex-col gap-1.5 text-sm font-medium text-gray-700">
                    {language === 'ro' ? 'Sortare' : 'Сортировка'}
                    <select
                      name="sort"
                      defaultValue={sort}
                      className="h-11 rounded-[5px] border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800 outline-none transition-colors focus:border-gray-900"
                    >
                      <option value="recommended">{language === 'ro' ? 'Recomandate' : 'Рекомендуемые'}</option>
                      <option value="price-asc">{language === 'ro' ? 'Preț crescător' : 'Сначала дешевле'}</option>
                      <option value="price-desc">{language === 'ro' ? 'Preț descrescător' : 'Сначала дороже'}</option>
                      <option value="name-asc">{language === 'ro' ? 'După denumire' : 'По названию'}</option>
                    </select>
                  </label>
                  <button type="submit" className="h-11 rounded-[5px] bg-red-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-700">
                    {language === 'ro' ? 'Aplică' : 'Применить'}
                  </button>
                </form>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {data.products.map(product => (
                <ProductCardView key={product.id} product={product} language={language} href={productHref(product, language)} />
              ))}
            </div>

            {data.totalPages > 1 && (
              <nav aria-label={language === 'ro' ? 'Paginarea catalogului' : 'Пагинация каталога'} className="mt-10 flex items-center justify-between gap-4 border-t border-gray-200 pt-6">
                {data.page > 1 ? (
                  <a href={catalogHref(language, data.page - 1, sort, filters)} className="inline-flex min-h-11 items-center gap-2 rounded-[5px] border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-800 transition-colors hover:border-gray-900">
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
                          href={catalogHref(language, item, sort, filters)}
                          aria-current={item === data.page ? 'page' : undefined}
                          className={`flex h-11 min-w-11 items-center justify-center rounded-[5px] border px-3 text-sm font-semibold transition-colors ${item === data.page ? 'border-black bg-black text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-900'}`}
                        >
                          {item}
                        </a>
                      </span>
                    ))}
                </div>

                {data.page < data.totalPages ? (
                  <a href={catalogHref(language, data.page + 1, sort, filters)} className="inline-flex min-h-11 items-center gap-2 rounded-[5px] bg-red-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-700">
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
              {language === 'ro' ? 'Nu există produse pentru filtrele selectate' : 'По выбранным фильтрам товаров нет'}
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
        </div>
      </div>
    </section>
  );
}
