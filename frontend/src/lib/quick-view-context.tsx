'use client';

import { createContext, useCallback, useContext, useState } from 'react';

interface QuickViewContextValue {
  activeSlug: string | null;
  openQuickView: (slug: string) => void;
  closeQuickView: () => void;
}

const QuickViewContext = createContext<QuickViewContextValue | null>(null);

export function QuickViewProvider({ children }: { children: React.ReactNode }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const openQuickView = useCallback((slug: string) => setActiveSlug(slug), []);
  const closeQuickView = useCallback(() => setActiveSlug(null), []);

  return (
    <QuickViewContext.Provider value={{ activeSlug, openQuickView, closeQuickView }}>
      {children}
    </QuickViewContext.Provider>
  );
}

export function useQuickView() {
  const ctx = useContext(QuickViewContext);
  if (!ctx) throw new Error('useQuickView must be used within QuickViewProvider');
  return ctx;
}
