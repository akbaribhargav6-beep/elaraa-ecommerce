'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api-client';
import { useAuth } from './auth-context';

interface WishlistItem {
  id: string;
  productId: string;
  variantId: string | null;
}

interface WishlistContextValue {
  isWishlisted: (productId: string) => boolean;
  toggle: (productId: string, variantId?: string) => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

// Mirrors CartContext's shape: fetch once on login, keep an in-memory list,
// and expose a single toggle() so any ProductCard can show/flip heart state
// without each card managing its own wishlist fetch.
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    try {
      const data = await api.get<{ items: WishlistItem[] }>('/api/wishlist');
      setItems(data.items);
    } catch {
      setItems([]);
    }
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const isWishlisted = useCallback((productId: string) => items.some((i) => i.productId === productId), [items]);

  const toggle = useCallback(
    async (productId: string, variantId?: string) => {
      if (!user) {
        window.location.href = '/login';
        return;
      }
      const existing = items.find((i) => i.productId === productId);
      setLoading(true);
      try {
        if (existing) {
          const data = await api.delete<{ items: WishlistItem[] }>(`/api/wishlist/${existing.id}`);
          setItems(data.items);
        } else {
          const data = await api.post<{ items: WishlistItem[] }>('/api/wishlist', { productId, variantId });
          setItems(data.items);
        }
      } finally {
        setLoading(false);
      }
    },
    [items, user]
  );

  return <WishlistContext.Provider value={{ isWishlisted, toggle, loading }}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
