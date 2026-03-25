import type { Product } from '../data/products';

export function isProductInStock(product: Pick<Product, 'qty' | 'inStock'>): boolean {
  if (typeof product.qty === 'number') return product.qty > 0;
  return product.inStock !== false;
}
