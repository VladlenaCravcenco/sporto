'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check } from 'lucide-react';
import { CartProvider, useCart, type CartItem } from '../../src/app/contexts/CartContext';

function PurchaseButton({ item, language, inStock }: { inStock: boolean; item: Omit<CartItem, 'quantity'>; language: 'ro' | 'ru' }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  return <div className="mt-5 flex flex-wrap items-center gap-4">
    <button type="button" onClick={() => { addToCart(item); setAdded(true); }} className="inline-flex min-h-12 items-center justify-center gap-3 rounded-[5px] bg-red-600 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
      {added ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
      {inStock ? (language === 'ro' ? 'Adaugă în coș' : 'Добавить в корзину') : (language === 'ro' ? 'La comandă' : 'Под заказ')}
    </button>
    {added && <span role="status" className="text-sm text-gray-600">
      {language === 'ro' ? 'Adăugat. ' : 'Добавлено. '}
      <Link href={`/${language}/order-request`} className="underline underline-offset-4">{language === 'ro' ? 'Vezi coșul' : 'Перейти в корзину'}</Link>
    </span>}
  </div>;
}

export function ProductPurchase(props: { inStock: boolean; item: Omit<CartItem, 'quantity'>; language: 'ro' | 'ru' }) {
  return <CartProvider><PurchaseButton {...props} /></CartProvider>;
}
