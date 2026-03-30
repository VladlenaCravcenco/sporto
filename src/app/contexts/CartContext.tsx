import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: { ro: string; ru: string };
  price: number;
  image: string;
  category: string;
  sku?: string;
  quantity: number;
}

const FREE_DELIVERY_THRESHOLD = 500;
const DELIVERY_COST = 100;

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  deliveryCost: number;
  isFreeDelivery: boolean;
  totalWithDelivery: number;
  isInCart: (id: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) {
      try {
        setCart(JSON.parse(stored));
      } catch {
        setCart([]);
      }
    }
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      saveCart(cart.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      saveCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    saveCart(cart.filter((c) => c.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    saveCart(
      cart.map((c) =>
        c.id === id ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c
      )
    );
  };

  const clearCart = () => saveCart([]);

  const isInCart = (id: string) => cart.some((c) => c.id === id);

  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);
  const totalPrice = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const isFreeDelivery = totalPrice >= FREE_DELIVERY_THRESHOLD;
  const deliveryCost = totalPrice === 0 ? 0 : isFreeDelivery ? 0 : DELIVERY_COST;
  const totalWithDelivery = totalPrice + deliveryCost;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        deliveryCost,
        isFreeDelivery,
        totalWithDelivery,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
