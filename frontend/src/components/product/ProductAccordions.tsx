'use client';

import { useState } from 'react';
import type { ProductDTO } from '@elaraa/shared';

// Content per item: for "Design Story" and "Specifications" this is real,
// per-product data (shortDescription/description/material). The remaining
// items are shared policy copy (matching /policy) rather than fabricated
// per-product measurements we don't actually track.
export function ProductAccordions({ product }: { product: ProductDTO }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const items = [
    {
      title: 'Design Story & Inspiration',
      body: (
        <div className="space-y-3">
          {product.shortDescription && <p>{product.shortDescription}</p>}
          {product.description && <p>{product.description}</p>}
        </div>
      ),
    },
    {
      title: 'Specifications & Materials',
      body: (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-3" style={{ background: 'rgba(43,38,32,.05)' }}>
            <span className="uppercase tracking-widest text-[9px] opacity-50 block">Material</span>
            <strong className="text-sm">{product.material ?? 'Premium alloy base'}</strong>
          </div>
          <div className="p-3" style={{ background: 'rgba(43,38,32,.05)' }}>
            <span className="uppercase tracking-widest text-[9px] opacity-50 block">Quality Grade</span>
            <strong className="text-sm">Anti Tarnish &amp; Skin Friendly</strong>
          </div>
        </div>
      ),
    },
    {
      title: 'Jewellery Care Guide',
      body: (
        <ul className="list-disc list-inside space-y-1.5">
          <li>Apply perfumes, hairsprays, and lotions before putting on your jewellery.</li>
          <li>Store in the provided ELARAA anti tarnish velvet box when not in use.</li>
          <li>Gently wipe with the included microfiber polishing cloth after wearing.</li>
          <li>Avoid wearing during swimming, hot springs, or intense gym sessions.</li>
        </ul>
      ),
    },
    {
      title: 'Shipping, Returns & Warranty',
      body: (
        <p>
          Dispatched in discreet, fully insured transit boxes. Delivered across India in 3 to 5 business days. We
          offer a 14 day return policy, and every piece is covered by a 1 year craftsmanship warranty against
          tarnish and defects.
        </p>
      ),
    },
    {
      title: 'Frequently Asked Questions',
      body: (
        <div className="space-y-3">
          <div>
            <strong className="block font-medium">Q: Is this piece anti tarnish?</strong>
            <p className="mt-0.5">A: Yes, it features a premium anti tarnish finish designed for daily wear and long lasting shine.</p>
          </div>
          <div>
            <strong className="block font-medium">Q: Can I request gift packaging?</strong>
            <p className="mt-0.5">A: Yes, every order includes our signature velvet box and ribbon at no extra charge.</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="max-w-4xl mx-auto px-6 mt-20 sm:mt-28 space-y-2">
      <div className="text-center mb-10">
        <p className="eyebrow">The Details & Craft</p>
        <h2 className="serif text-3xl sm:text-4xl mt-2">Everything You Need To Know</h2>
      </div>

      {items.map((item, i) => (
        <div key={item.title} className="border-b" style={{ borderColor: 'rgba(43,38,32,.15)' }}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between text-left py-4 group"
          >
            <span className="serif text-xl group-hover:opacity-70 transition-opacity">{item.title}</span>
            <span
              className="transition-transform duration-300"
              style={{ color: 'var(--gold-deep)', transform: openIndex === i ? 'rotate(180deg)' : 'none' }}
            >
              ▼
            </span>
          </button>
          <div
            className="overflow-hidden transition-[max-height,opacity] duration-500 text-sm opacity-70 leading-relaxed"
            style={{ maxHeight: openIndex === i ? 500 : 0, opacity: openIndex === i ? 1 : 0 }}
          >
            <div className="pb-5">{item.body}</div>
          </div>
        </div>
      ))}
    </section>
  );
}
