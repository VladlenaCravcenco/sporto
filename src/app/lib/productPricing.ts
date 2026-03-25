import type { Product } from '../data/products';

export function hasSalePrice(product: Pick<Product, 'price' | 'sale_price'>): boolean {
  return typeof product.sale_price === 'number' && product.sale_price > 0 && product.sale_price < product.price;
}

export function getCurrentPrice(product: Pick<Product, 'price' | 'sale_price'>): number {
  return hasSalePrice(product) ? (product.sale_price as number) : product.price;
}
