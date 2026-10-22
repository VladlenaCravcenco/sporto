'use client';

import { CartProvider } from '../../src/app/contexts/CartContext';
import { OrderRequest } from '../../src/app/pages/OrderRequest';

export default function CheckoutContent() {
  return <CartProvider><OrderRequest /></CartProvider>;
}
