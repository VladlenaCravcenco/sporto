import type { Product } from '../data/products';

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

export function getProductRouteKey(product: Pick<Product, 'id' | 'sku'>): string {
  const sku = normalizeKey(product.sku || '');
  return sku || String(product.id);
}

export function extractProductIdFromParam(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const decoded = normalizeKey(decodePathSegment(value));
  if (!decoded) return undefined;

  const legacyParts = decoded.split('--');
  return legacyParts[legacyParts.length - 1] || decoded;
}

export function buildProductSlug(product: Pick<Product, 'id' | 'sku'>): string {
  return encodeURIComponent(getProductRouteKey(product));
}

export function buildProductPath(product: Pick<Product, 'id' | 'sku'>): string {
  return `/product/${buildProductSlug(product)}`;
}
