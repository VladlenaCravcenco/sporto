'use client';

import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { CartProvider, useCart, useOptionalCart } from '../contexts/CartContext';
import type { CardProduct } from './ProductCardView';

type Props = { product: CardProduct; language: 'ro' | 'ru' };

function CartAction({ product, language }: Props) {
  const { cart, addToCart, removeFromCart, updateQuantity } = useCart();
  const quantity = cart.find(item => item.id === product.id)?.quantity || 0;
  const ru = language === 'ru';
  if (quantity) return <div className="flex h-10 items-center rounded-[5px] bg-black text-white" aria-label={ru ? 'Количество в корзине' : 'Cantitate în coș'}>
    <button type="button" aria-label={ru ? 'Уменьшить количество' : 'Micșorează cantitatea'} onClick={() => quantity === 1 ? removeFromCart(product.id) : updateQuantity(product.id, -1)} className="flex h-10 w-10 items-center justify-center rounded-l-[5px] hover:bg-gray-800"><Minus className="h-4 w-4" /></button>
    <span aria-live="polite" className="min-w-10 text-center text-sm tabular-nums">{quantity}</span>
    <button type="button" aria-label={ru ? 'Увеличить количество' : 'Mărește cantitatea'} onClick={() => updateQuantity(product.id, 1)} className="flex h-10 w-10 items-center justify-center rounded-r-[5px] hover:bg-gray-800"><Plus className="h-4 w-4" /></button>
  </div>;
  return <button type="button" onClick={() => addToCart({
    id: product.id, name: { ro: product.name_ro, ru: product.name_ru || product.name_ro },
    price: product.sale_price != null && product.sale_price > 0 && product.sale_price < product.price ? product.sale_price : product.price,
    image: product.image_url || '', category: product.category || '', sku: product.sku || undefined,
  })} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[5px] bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700">
    <ShoppingCart className="h-4 w-4" />{ru ? 'В корзину' : 'Adaugă în coș'}
  </button>;
}

export function ProductCardCartAction(props: Props) {
  const context = useOptionalCart();
  return context ? <CartAction {...props} /> : <CartProvider><CartAction {...props} /></CartProvider>;
}
