import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { getBrand } from './brand-data';
import { getCategoryLanding } from './catalog-seo';
import { getFilteredCatalog } from './catalog-filter-data';
import type { CatalogQuery } from './catalog-filters';
import type { CatalogSort } from './catalog-data';
import { getPublicPageData } from './public-page-data';
import { getProductDetail } from './product-data';
import { productPath, productSlug } from './product-url';

/** Validate before the locale layout renders its loading boundary, so missing pages return HTTP 404. */
export async function validatePublicRoute(pathname: string, search: string, language: 'ro' | 'ru') {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[1] === 'product' && (parts.length === 3 || parts.length === 4)) {
    let identifier: string, slug: string;
    try {
      identifier = decodeURIComponent(parts[parts.length - 1]);
      slug = decodeURIComponent(parts[2]);
    } catch { notFound(); }
    const data = await getProductDetail(identifier, parts.length === 4 ? identifier : undefined);
    if (!data) notFound();
    if (parts.length === 3 || slug !== productSlug(data.product, language) || identifier !== data.product.id) {
      permanentRedirect(productPath(data.product, language));
    }
    return;
  }
  const isCatalog = parts.length === 2 && parts[1] === 'catalog';
  const isBrand = parts.length === 3 && parts[1] === 'brands';
  if (!isCatalog && !isBrand) {
    if (parts.length === 2 && ['about', 'contacts', 'turnkey-solutions', 'maintenance-service', 'terms-of-cooperation', 'delivery-terms', 'privacy-policy'].includes(parts[1])) await getPublicPageData(parts[1]);
    return;
  }
  const params = new URLSearchParams(search);
  const query: CatalogQuery = Object.create(null);
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    query[key] = values.length === 1 ? values[0] : values;
  }
  const raw = query.page;
  const page = raw === undefined ? 1 : typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isSafeInteger(page) || page < 1) {
    if (isBrand) notFound();
    redirect(`/${language}/catalog`);
  }
  let sort: CatalogSort = 'recommended';
  if (isCatalog) {
    const selected = await getCategoryLanding(query, language);
    if (selected.invalid) notFound();
    if (query.sort !== undefined) {
      if (typeof query.sort !== 'string' || !['recommended', 'price-asc', 'price-desc', 'name-asc'].includes(query.sort)) redirect(`/${language}/catalog`);
      sort = query.sort as CatalogSort;
    }
  } else {
    let slug: string;
    try { slug = decodeURIComponent(parts[2]); } catch { notFound(); }
    const brand = await getBrand(slug);
    if (!brand) notFound();
    query.brand = brand.name;
  }
  const data = await getFilteredCatalog(query, page, sort, language);
  if (data.status === 'out-of-range') notFound();
  if (data.status !== 'ready') throw new Error('Public catalog unavailable');
  if (page === 1 && raw !== undefined || isCatalog && query.sort === 'recommended') {
    if (page === 1) params.delete('page');
    if (isCatalog && query.sort === 'recommended') params.delete('sort');
    permanentRedirect(`${pathname}${params.size ? '?' + params : ''}`);
  }
}
