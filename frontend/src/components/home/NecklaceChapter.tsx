'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { ProductDTO } from '@elaraa/shared';
import { getUploadUrl } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { useSafeAddToCart } from '@/lib/use-safe-cart-actions';
import { Button } from '@/components/ui/Button';

export function NecklaceChapter({ product, chapter, reversed }: { product: ProductDTO; chapter: string; reversed?: boolean }) {
  const addToCart = useSafeAddToCart();
  const [adding, setAdding] = useState(false);
  const primary = product.images[0];
  const hover = product.images[2] ?? product.images[1] ?? product.images[0];
  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];

  async function handleAdd() {
    if (!defaultVariant || adding) return;
    setAdding(true);
    try {
      await addToCart(product.id, defaultVariant.id, 1);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center">
      <div className={`md:col-span-7 group relative aspect-square bg-cream overflow-hidden rounded-sm border shadow-xl ${reversed ? 'md:order-2' : ''}`} style={{ borderColor: 'rgba(43,38,32,.12)' }}>
        <Link href={`/product/${product.slug}`} className="block w-full h-full relative overflow-hidden">
          {primary && <Image src={getUploadUrl(primary.url)} alt={product.name} fill className="object-cover transition-all duration-700 group-hover:scale-105" sizes="(min-width:768px) 58vw, 100vw" />}
          {hover && (
            <Image src={getUploadUrl(hover.url)} alt={`${product.name} detail`} fill className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105" sizes="(min-width:768px) 58vw, 100vw" />
          )}
        </Link>
        <span className={`absolute top-4 ${reversed ? 'right-4' : 'left-4'} bg-white/90 backdrop-blur-md text-[10px] tracking-[.2em] uppercase px-3 py-1 font-medium`}>
          {chapter}
        </span>
      </div>

      <div className={`md:col-span-5 space-y-4 ${reversed ? 'md:order-1' : ''}`}>
        {product.eyebrow && <p className="text-[10px] tracking-[.25em] uppercase font-medium" style={{ color: 'var(--gold-deep)' }}>{product.material}</p>}
        <h3 className="serif text-3xl sm:text-4xl">
          <Link href={`/product/${product.slug}`} className="hover:opacity-70 transition-opacity">{product.name}</Link>
        </h3>
        {product.shortDescription && (
          <p className="serif text-lg italic opacity-70 leading-relaxed font-light">&ldquo;{product.shortDescription}&rdquo;</p>
        )}
        <div className="pt-2 flex items-baseline gap-3">
          <span className="text-2xl font-medium">{formatPrice(product.basePrice)}</span>
          <span className="text-xs opacity-50">• Inclusive of insured courier</span>
        </div>
        <div className="pt-4 flex items-center gap-3">
          <Button variant="gold-solid" className="h-12 px-6 justify-center" onClick={handleAdd} disabled={adding || !defaultVariant}>
            {adding ? 'Adding…' : '+ Add to Bag'}
          </Button>
          <Button href={`/product/${product.slug}`} className="h-12 px-5 justify-center">Explore Piece →</Button>
        </div>
      </div>
    </div>
  );
}
