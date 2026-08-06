'use client';

import { useMemo, useState } from 'react';
import type { ReviewDTO } from '@elaraa/shared';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';

export function ReviewsSection({ slug, initialReviews }: { slug: string; initialReviews: ReviewDTO[] }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState(initialReviews);
  const [modalOpen, setModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  // Computed from the real reviews list, not fabricated percentages.
  const breakdown = useMemo(() => {
    const counts = [5, 4, 3, 2, 1].map((star) => reviews.filter((r) => r.rating === star).length);
    return [5, 4, 3, 2, 1].map((star, i) => ({
      star,
      count: counts[i],
      percent: reviews.length > 0 ? Math.round((counts[i] / reviews.length) * 100) : 0,
    }));
  }, [reviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await api.post<{ reviews: ReviewDTO[] }>(`/api/products/${slug}/reviews`, { rating, body });
      setReviews(data.reviews);
      setBody('');
      setModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="reviews" className="scroll-mt-28">
      <div className="grid lg:grid-cols-12 gap-10 items-start">
        {/* Rating summary */}
        <div className="lg:col-span-4 bg-white p-6 sm:p-8 border rounded-sm space-y-6" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
          <div>
            <p className="eyebrow">Verified Reviews</p>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-5xl font-light serif">{avgRating.toFixed(1)}</span>
              <span className="text-xs opacity-50">out of 5.0</span>
            </div>
            <div className="text-lg mt-1" style={{ color: 'var(--gold-deep)' }}>
              {'★'.repeat(Math.round(avgRating))}
              {'☆'.repeat(5 - Math.round(avgRating))}
            </div>
            <p className="text-xs opacity-50 mt-1">
              {reviews.length === 0 ? 'No reviews yet' : `Based on ${reviews.length} verified buyer review${reviews.length === 1 ? '' : 's'}`}
            </p>
          </div>

          {reviews.length > 0 && (
            <>
              <div className="h-[1px]" style={{ background: 'rgba(43,38,32,.1)' }} />
              <div className="space-y-2 text-xs opacity-70">
                {breakdown.map((b) => (
                  <div key={b.star} className="flex items-center gap-2">
                    <span className="w-8">{b.star} ★</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(43,38,32,.08)' }}>
                      <div className="h-full" style={{ width: `${b.percent}%`, background: 'var(--gold-deep)' }} />
                    </div>
                    <span className="w-8 text-right font-medium">{b.percent}%</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <Button
            variant="gold"
            className="w-full justify-center"
            onClick={() => (user ? setModalOpen(true) : (window.location.href = '/login'))}
          >
            Write A Review
          </Button>
        </div>

        {/* Review list */}
        <div className="lg:col-span-8 space-y-6">
          {reviews.length === 0 && <p className="text-sm opacity-60">Be the first to review this piece.</p>}
          {reviews.map((r) => (
            <div key={r.id} className="bg-white p-6 border rounded-sm space-y-3" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
              <div className="flex items-center justify-between">
                <div className="text-sm" style={{ color: 'var(--gold-deep)' }}>
                  {'★'.repeat(r.rating)}
                  {'☆'.repeat(5 - r.rating)}
                </div>
                {r.isVerifiedPurchase && <span className="text-[10px] uppercase tracking-wide opacity-50">Verified Purchase</span>}
              </div>
              {r.title && <p className="serif text-lg">{r.title}</p>}
              <p className="text-sm opacity-70 leading-relaxed">{r.body}</p>
              <p className="text-xs opacity-50">{r.userName}</p>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white max-w-lg w-full p-6 sm:p-8 rounded-sm shadow-2xl relative space-y-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setModalOpen(false)} aria-label="Close" className="absolute top-4 right-4 opacity-50 hover:opacity-100">
              ✕
            </button>
            <p className="eyebrow">Share Your Experience</p>
            <h3 className="serif text-2xl">Write A Customer Review</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-xs tracking-[.2em] uppercase opacity-60 mb-2">Your Rating</p>
                <div className="flex gap-1 text-xl">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button type="button" key={n} onClick={() => setRating(n)} style={{ color: n <= rating ? 'var(--gold-deep)' : 'rgba(43,38,32,.25)' }}>
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe the quality, packaging, and feel of the jewellery..."
                rows={4}
                className="w-full border p-3 text-sm bg-transparent outline-none"
                style={{ borderColor: 'rgba(43,38,32,.2)' }}
              />
              <Button variant="gold-solid" className="w-full justify-center" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Review'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
