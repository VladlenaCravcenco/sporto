import type { Product } from '../data/products';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/**
 * Extracts the product identifier (SKU or ID) from URL param.
 * URL format: "название-товара-sku" or "название-товара-id" (for fallback)
 * Returns the last part after final dash: SKU or UUID
 */
export function extractProductIdFromParam(value: string | undefined): string | undefined {
  if (!value) return undefined;
  // Get the last part after the final dash — this is either SKU or UUID
  const parts = value.split('-');
  return parts[parts.length - 1] || value;
}

/**
 * Builds URL slug: "название-товара-sku" (short & beautiful)
 * Falls back to ID only if no SKU available
 */
export function buildProductSlug(product: Pick<Product, 'id' | 'name' | 'sku'>): string {
  const baseName = product.name.ro || product.name.ru || product.id;
  const slug = slugify(baseName);
  // Use SKU if available (shorter & better for SEO), fallback to ID
  const identifier = product.sku || product.id;
  return slug ? `${slug}-${identifier}` : identifier;
}

export function buildProductPath(product: Pick<Product, 'id' | 'name' | 'sku'>): string {
  return `/product/${buildProductSlug(product)}`;
}
