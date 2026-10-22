import { buildProductPath, getLocalizedProductSlug } from '../../src/app/lib/product-url';

type Product = { id: string | number; name_ro: string | null; name_ru: string | null };
function routeProduct(product: Product) {
  return { id: String(product.id), name: { ro: product.name_ro || product.name_ru || '', ru: product.name_ru || product.name_ro || '' } };
}
export function productPath(product: Product, language: 'ro' | 'ru') {
  return `/${language}${buildProductPath(routeProduct(product), language)}`;
}
export function productSlug(product: Product, language: 'ro' | 'ru') {
  return getLocalizedProductSlug(routeProduct(product), language);
}
