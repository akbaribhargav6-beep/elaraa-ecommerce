'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

interface Toast {
  id: number;
  message: string;
  variant: 'error' | 'success';
}

interface ToastContextValue {
  notify: (message: string, variant?: 'error' | 'success') => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

// Every cart/wishlist/quick-view action used to fail silently on error (the
// underlying fetch rejects, nothing catches it, the button just goes back to
// normal with no explanation) — which is exactly what "Add to Cart does
// nothing" looks like from the outside. This gives those handlers something
// to call so a real failure is visible instead of silent.
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const notify = useCallback((message: string, variant: 'error' | 'success' = 'error') => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, AUTO_DISMISS_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none px-4 w-full max-w-md">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto text-xs sm:text-sm px-4 py-3 rounded-sm shadow-xl w-full text-center"
            style={
              t.variant === 'error'
                ? { background: '#2B2620', color: '#F8F5F0', border: '1px solid rgba(220,38,38,.5)' }
                : { background: 'var(--black)', color: 'var(--ivory)', border: '1px solid rgba(201,166,107,.4)' }
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
