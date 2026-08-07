'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { CartDTO } from '@elaraa/shared';
import { api } from './api-client';
import { CART_SHOULD_REFRESH_EVENT } from './auth-context';

interface CartContextValue {
  cart: CartDTO | null;
  isLoading: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (productId: string, variantId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refetch: () => Promise<void>;
}

const EMPTY_CART: CartDTO = { id: '', items: [], subtotal: 0, itemCount: 0 };

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const refetch = useCallback(async () => {
    try {
      const data = await api.get<{ cart: CartDTO }>('/api/cart');
      setCart(data.cart);
    } catch {
      setCart(EMPTY_CART);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    const handler = () => refetch();
    window.addEventListener(CART_SHOULD_REFRESH_EVENT, handler);
    return () => window.removeEventListener(CART_SHOULD_REFRESH_EVENT, handler);
  }, [refetch]);

  const addItem = useCallback(
    async (productId: string, variantId: string, quantity = 1) => {
      const data = await api.post<{ cart: CartDTO }>('/api/cart/items', { productId, variantId, quantity });
      setCart(data.cart);
      setIsDrawerOpen(true);
    },
    []
  );

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      try {
        const data = await api.patch<{ cart: CartDTO }>(`/api/cart/items/${itemId}`, { quantity });
        setCart(data.cart);
      } catch (err) {
        // Item wasn't found in the identity the server resolved for this
        // request (e.g. a stale/desynced guest cart) — resync from the
        // server instead of leaving the button looking like it did nothing.
        await refetch();
        throw err;
      }
    },
    [refetch]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      try {
        const data = await api.delete<{ cart: CartDTO }>(`/api/cart/items/${itemId}`);
        setCart(data.cart);
      } catch (err) {
        await refetch();
        throw err;
      }
    },
    [refetch]
  );

  const clearCart = useCallback(async () => {
    const data = await api.delete<{ cart: CartDTO }>('/api/cart');
    setCart(data.cart);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        addItem,
        updateItem,
        removeItem,
        clearCart,
        refetch,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
