'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getUploadUrl } from '@/lib/api-client';
import { api } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { useToast } from '@/lib/toast-context';

interface WishlistItemView {
  id: string;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  price: number;
  variantLabel: string | null;
  inStock: boolean;
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItemView[] | null>(null);
  const { notify } = useToast();

  function load() {
    api
      .get<{ items: WishlistItemView[] }>('/api/wishlist')
      .then((data) => setItems(data.items))
      .catch(() => setItems([]));
  }

  useEffect(load, []);

  async function handleRemove(id: string) {
    try {
      await api.delete(`/api/wishlist/${id}`);
      load();
    } catch {
      notify("Couldn't remove that item — please try again.");
    }
  }

  return (
    <div>
      <h1 className="serif text-3xl mb-8">Your Wishlist</h1>
      {items?.length === 0 && <p className="text-sm opacity-60">Nothing saved yet. Browse the collection and tap the heart on anything you love.</p>}
      <div className="grid sm:grid-cols-2 gap-6">
        {items?.map((item) => (
          <div key={item.id} className="flex gap-4 border p-4" style={{ borderColor: 'rgba(43,38,32,.12)' }}>
            {item.imageUrl && (
              <Image src={getUploadUrl(item.imageUrl)} alt={item.productName} width={80} height={80} className="object-cover flex-shrink-0" />
            )}
            <div className="flex-1">
              <Link href={`/product/${item.productSlug}`} className="serif text-lg hover:opacity-70">{item.productName}</Link>
              <p className="text-sm mt-1">{formatPrice(item.price)}</p>
              {!item.inStock && <p className="text-xs opacity-50 mt-1">Out of stock</p>}
              <button onClick={() => handleRemove(item.id)} className="text-[10px] tracking-[.15em] uppercase opacity-50 hover:opacity-100 mt-2">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
