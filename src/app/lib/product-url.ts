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

export function extractProductIdFromParam(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const parts = value.split('--');
  return parts[parts.length - 1] || value;
}

export function buildProductSlug(product: Pick<Product, 'id' | 'name'>): string {
  const baseName = product.name.ro || product.name.ru || product.id;
  const slug = slugify(baseName);
  return slug ? `${slug}--${product.id}` : product.id;
}

export function buildProductPath(product: Pick<Product, 'id' | 'name'>): string {
  return `/product/${buildProductSlug(product)}`;
}
