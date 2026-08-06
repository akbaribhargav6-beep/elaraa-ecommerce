'use client';

import { useEffect, useState } from 'react';
import type { ProductDTO } from '@elaraa/shared';
import { api } from '@/lib/api-client';

interface NotifyMeModalProps {
  product: ProductDTO;
  variantId?: string;
  onClose: () => void;
}

export function NotifyMeModal({ product, variantId, onClose }: NotifyMeModalProps) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/api/stock-notifications', {
        productId: product.id,
        variantId,
        phone: phone.trim(),
        email: email.trim() || undefined,
      });
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white max-w-md w-full rounded-sm shadow-2xl relative p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:text-black transition-colors"
        >
          ✕
        </button>

        {done ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-3">✓</div>
            <h3 className="serif text-2xl">You're on the List</h3>
            <p className="text-sm opacity-70 mt-2">We'll text you the moment {product.name} is back in stock.</p>
          </div>
        ) : (
          <>
            <p className="eyebrow">Out of Stock</p>
            <h3 className="serif text-2xl mt-1">Notify Me</h3>
            <p className="text-sm opacity-70 mt-2">
              Leave your number and we'll let you know the moment <span className="font-medium">{product.name}</span> is
              back in stock.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-widest opacity-60 mb-1.5 font-medium">Mobile Number *</label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 text-sm bg-white border outline-none"
                  style={{ borderColor: 'rgba(43,38,32,.2)' }}
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest opacity-60 mb-1.5 font-medium">Email Address (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 text-sm bg-white border outline-none"
                  style={{ borderColor: 'rgba(43,38,32,.2)' }}
                />
              </div>

              {error && <p className="text-xs" style={{ color: '#b91c1c' }}>{error}</p>}

              <button type="submit" disabled={submitting} className="btn-luxury btn-gold-solid w-full justify-center h-12">
                <span>{submitting ? 'Submitting…' : 'Notify Me'}</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
