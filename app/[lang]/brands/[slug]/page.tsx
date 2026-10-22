import { CatalogScrollRestoration } from '../../../_components/CatalogScrollRestoration';
import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getBrand } from '../../../_lib/brand-data';
import { getFilteredCatalog } from '../../../_lib/catalog-filter-data';
import { localizedMetadata, siteUrl } from '../../../_lib/page-seo';
import { productPath } from '../../../_lib/product-url';
import { CatalogLink } from '../../../_components/CatalogLink';
import { ProductCardView } from '../../../../src/app/components/ProductCardView';
import type { CatalogQuery } from '../../../_lib/catalog-filters';
import { SiteBreadcrumbs } from '../../../../src/app/components/SiteBreadcrumbs';
import { publicHttpUrl } from '../../../_lib/public-url';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ lang: string; slug: string }>; searchParams: Promise<CatalogQuery> };
const load = cache(async (params: Props['params'], searchParams: Props['searchParams']) => {
  const [{ lang, slug }, query] = await Promise.all([params, searchParams]);
  if (lang !== 'ro' && lang !== 'ru') notFound();
  const brand = await getBrand(slug);
  if (!brand) notFound();
  const rawPage = query.page;
  const page = rawPage === undefined ? 1 : typeof rawPage === 'string' && /^\d+$/.test(rawPage) ? Number(rawPage) : NaN;
  if (!Number.isSafeInteger(page) || page < 1) notFound();
  const filters = { ...query, brand: brand.name };
  const data = await getFilteredCatalog(filters, page, 'recommended', lang);
  if (data.status !== 'ready') {
    if (data.status === 'out-of-range') notFound();
    throw new Error('Brand catalog unavailable');
  }
  return { lang: lang as 'ro' | 'ru', brand, query, page, data };
});
function brandPath(slug: string, page = 1, query: CatalogQuery = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (['brand', 'page', 'sort', 'lang'].includes(key) || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
  }
  if (page > 1) params.set('page', String(page));
  return `/brands/${encodeURIComponent(slug)}${params.size ? '?' + params : ''}`;
}
export async function generateMetadata(props: Props): Promise<Metadata> {
  const { lang, brand, query, page, data } = await load(props.params, props.searchParams);
  const ro = lang === 'ro';
  const description = (ro ? brand.description_ro : brand.description_ru || brand.description_ro)?.replace(/\s+/g, ' ').trim().slice(0, 165)
    || (ro ? `Echipamente sportive ${brand.name} în Moldova. Descoperă produsele, caracteristicile și prețurile în catalogul SPORTO.` : `Спортивное оборудование ${brand.name} в Молдове. Товары, характеристики и цены в каталоге SPORTO.`);
  return { ...localizedMetadata(lang, brandPath(brand.slug, page, query), `${brand.name} — ${ro ? 'echipamente sportive în Moldova' : 'спортивное оборудование в Молдове'}${page > 1 ? (ro ? ` — pagina ${page}` : ` — страница ${page}`) : ''}`, description, brand.hero_image_url || brand.banner_desktop_url),
    robots: { index: data.totalProducts > 0 && !Object.keys(query).some(key => key !== 'page'), follow: true } };
}
export default async function BrandPage(props: Props) {
  const { lang, brand, query, page, data } = await load(props.params, props.searchParams);
  const ro = lang === 'ro';
  if (query.page === '1') permanentRedirect(`/${lang}${brandPath(brand.slug, 1, query)}`);
  const description = ro ? brand.description_ro : brand.description_ru || brand.description_ro;
  const country = ro ? brand.country_ro : brand.country_ru || brand.country_ro;
  const website = publicHttpUrl(brand.website_url || (brand.website ? (/^https?:\/\//i.test(brand.website) ? brand.website : `https://${brand.website}`) : undefined));
  const catalogPdf = publicHttpUrl(brand.catalog_pdf);
  const schema = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: brand.name, url: `${siteUrl}/${lang}${brandPath(brand.slug, page, query)}`, inLanguage: lang,
    about: { '@type': 'Brand', name: brand.name, ...(brand.logo_url ? { logo: brand.logo_url } : {}), ...(description ? { description } : {}) },
    mainEntity: { '@type': 'ItemList', itemListElement: data.products.map((product, index) => ({ '@type': 'ListItem', position: (page - 1) * 24 + index + 1, url: `${siteUrl}${productPath(product, lang)}`, name: lang === 'ro' ? product.name_ro : product.name_ru || product.name_ro })) } };
  return <div className="min-h-screen bg-[#f5f6f7]">
    <CatalogScrollRestoration />
    <SiteBreadcrumbs language={lang} siteUrl={siteUrl} items={[{ label: ro ? 'Acasă' : 'Главная', href: `/${lang}` }, { label: ro ? 'Catalog' : 'Каталог', href: `/${lang}/catalog` }, { label: brand.name, href: `/${lang}${brandPath(brand.slug)}` }]} className="mx-auto max-w-[1920px] px-6 py-5 lg:px-16" />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
    <section className="bg-black text-white">
      <div className="mx-auto max-w-[1920px] px-6 py-12 lg:px-16">
        {brand.logo_url && <img src={brand.logo_url} alt={brand.name} className="mb-8 max-h-28 max-w-[80%] object-contain brightness-0 invert" />}
        <h1 className={brand.logo_url ? 'sr-only' : 'text-4xl font-semibold md:text-6xl'}>{brand.name} — {ro ? 'echipamente sportive' : 'спортивное оборудование'}</h1>
        <div className="mt-8 flex flex-wrap gap-8 border-t border-gray-800 pt-6">
          <p>{data.totalProducts} {ro ? 'produse' : 'товаров'}</p>
          {country && <p>{brand.country_flag} {country}</p>}
          {brand.founded && <p>{ro ? 'Fondată' : 'Основана'}: {brand.founded}</p>}
          {website && <a href={website} rel="noopener noreferrer" target="_blank" className="underline">{ro ? 'Website oficial' : 'Сайт бренда'}</a>}
          {catalogPdf && <a href={catalogPdf} className="underline">{ro ? 'Catalog PDF' : 'Каталог PDF'}</a>}
        </div>
      </div>
      {(brand.banner_desktop_url || brand.banner_mobile_url) && <picture>
        {brand.banner_mobile_url && <source media="(max-width: 767px)" srcSet={brand.banner_mobile_url} />}
        <img src={brand.banner_desktop_url || brand.banner_mobile_url!} alt={brand.name} className="max-h-80 w-full object-cover" />
      </picture>}
    </section>
    <div className="mx-auto max-w-[1920px] px-6 py-12 lg:px-16">
      {description && <section className="mb-10 max-w-3xl"><h2 className="mb-4 text-xl font-semibold">{ro ? 'Despre brand' : 'О бренде'}</h2><p className="whitespace-pre-line leading-7 text-gray-600">{description}</p></section>}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><h2 className="text-2xl">{ro ? 'Produse' : 'Товары'} {brand.name}</h2><CatalogLink href={`/${lang}/catalog`} className="text-sm underline">{ro ? 'Catalog complet' : 'Полный каталог'}</CatalogLink></div>
      <nav aria-label={ro ? 'Categorii disponibile' : 'Доступные категории'} className="mb-8 flex flex-wrap gap-2">
        <CatalogLink href={`/${lang}${brandPath(brand.slug)}`} className="rounded border bg-white px-3 py-2 text-sm">{ro ? 'Toate' : 'Все'}</CatalogLink>
        {data.facets.groups.find(group => group.key === 'category')?.options.filter(option => option.count > 0).map(option => <CatalogLink key={option.value} href={`/${lang}${brandPath(brand.slug, 1, { category: option.value })}`} className="rounded border bg-white px-3 py-2 text-sm">{option.label}</CatalogLink>)}
      </nav>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">{data.products.map(product => <ProductCardView key={product.id} product={product} language={lang} href={productPath(product, lang)} linkComponent={CatalogLink} />)}</div>
      {data.totalProducts === 0 && <p className="py-12 text-gray-600">{ro ? 'Nu există produse disponibile pentru selecția curentă.' : 'Для текущего выбора доступных товаров нет.'}</p>}
      {data.totalPages > 1 && <nav aria-label={ro ? 'Paginare' : 'Пагинация'} className="mt-8 flex flex-wrap items-center gap-3">
        {page > 1 && <CatalogLink href={`/${lang}${brandPath(brand.slug, page - 1, query)}`} className="border bg-white px-4 py-3">{ro ? 'Înapoi' : 'Назад'}</CatalogLink>}
        <span>{page} / {data.totalPages}</span>
        {page < data.totalPages && <CatalogLink href={`/${lang}${brandPath(brand.slug, page + 1, query)}`} className="border bg-white px-4 py-3">{ro ? 'Înainte' : 'Далее'}</CatalogLink>}
      </nav>}
    </div>
    <section className="bg-black text-white"><div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-6 px-6 py-12 lg:px-16"><h2 className="text-xl">{ro ? 'Interesat de echipamentele' : 'Интересуют товары'} {brand.name}?</h2><CatalogLink href={`/${lang}/contacts`} className="bg-white px-6 py-3 text-sm text-black">{ro ? 'Contactează-ne' : 'Свяжитесь с нами'}</CatalogLink></div></section>
  </div>;
}
