import type { Product } from '../data/products';

export type ProductRouteLanguage = 'ro' | 'ru';

function decodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeKey(value: string): string {
  return value.trim();
}

function transliterateRuToLatin(value: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };

  return value.replace(/[А-Яа-яЁё]/g, (char) => {
    const lower = char.toLowerCase();
    const mapped = map[lower] ?? lower;
    return char === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1);
  });
}

function slugify(value: string): string {
  return transliterateRuToLatin(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' si ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function getProductRouteKey(product: Pick<Product, 'id' | 'sku'>): string {
  return normalizeKey(String(product.id));
}

export function getLocalizedProductSlug(
  product: Pick<Product, 'name' | 'sku'>,
  language: ProductRouteLanguage = 'ro',
): string {
  const rawName = normalizeKey(product.name[language] || product.name.ro || product.name.ru || '');
  const baseSlug = slugify(rawName);
  return baseSlug || 'produs';
}

export function extractProductIdFromParam(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const decoded = normalizeKey(decodePathSegment(value));
  if (!decoded) return undefined;

  const slashParts = decoded.split('/').filter(Boolean);
  const lastSegment = slashParts[slashParts.length - 1] || decoded;
  const legacyParts = lastSegment.split('--');
  return legacyParts[legacyParts.length - 1] || lastSegment;
}

export function inferProductRouteLanguage(
  product: Pick<Product, 'name' | 'sku'>,
  slug: string | undefined,
): ProductRouteLanguage | null {
  if (!slug) return null;
  const decodedSlug = slugify(decodePathSegment(slug));
  if (!decodedSlug) return null;
  if (decodedSlug === getLocalizedProductSlug(product, 'ru')) return 'ru';
  if (decodedSlug === getLocalizedProductSlug(product, 'ro')) return 'ro';
  return null;
}

export function buildProductSlug(
  product: Pick<Product, 'id' | 'name' | 'sku'>,
  language: ProductRouteLanguage = 'ro',
): string {
  return encodeURIComponent(getLocalizedProductSlug(product, language));
}

export function buildProductPath(
  product: Pick<Product, 'id' | 'name' | 'sku'>,
  language: ProductRouteLanguage = 'ro',
): string {
  return `/product/${buildProductSlug(product, language)}/${encodeURIComponent(getProductRouteKey(product))}`;
}
