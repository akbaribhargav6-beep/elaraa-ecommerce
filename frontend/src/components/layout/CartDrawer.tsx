'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/cart-context';
import { getUploadUrl } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { useToast } from '@/lib/toast-context';

export function CartDrawer() {
  const { cart, isDrawerOpen, closeDrawer, updateItem, removeItem } = useCart();
  const { notify } = useToast();
  const items = cart?.items ?? [];

  function safeUpdate(itemId: string, quantity: number) {
    updateItem(itemId, quantity).catch(() => notify("Couldn't update quantity — please try again."));
  }

  function safeRemove(itemId: string) {
    removeItem(itemId).catch(() => notify("Couldn't remove that item — please try again."));
  }

  return (
    <>
      <div id="cartOverlay" className={isDrawerOpen ? 'open' : ''} onClick={closeDrawer} />
      <aside id="cartDrawer" className={isDrawerOpen ? 'open' : ''}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
          <h2 className="serif text-xl">Your Bag</h2>
          <button onClick={closeDrawer} className="text-lg opacity-60 hover:opacity-100" aria-label="Close cart">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 && <p className="text-sm opacity-60 py-10 text-center">Your bag is empty.</p>}
          {items.map((item) => (
            <div className="cart-drawer-item" key={item.id}>
              {item.imageUrl && (
                <Image src={getUploadUrl(item.imageUrl)} alt={item.productName} width={76} height={76} className="object-cover" />
              )}
              <div className="flex-1">
                <h4 className="serif text-base">{item.productName}</h4>
                <p className="text-xs opacity-60 mt-1">{item.variantLabel}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="qty-box">
                    <button type="button" onClick={() => safeUpdate(item.id, item.quantity - 1)}>−</button>
                    <input type="number" value={item.quantity} readOnly />
                    <button type="button" onClick={() => safeUpdate(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <p className="text-xs">{formatPrice(item.lineTotal)}</p>
                </div>
                <button
                  onClick={() => safeRemove(item.id)}
                  className="text-[10px] tracking-[.15em] uppercase opacity-50 hover:opacity-100 mt-2"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-6 border-t" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
          <div className="flex justify-between text-sm mb-4">
            <span className="opacity-70">Subtotal</span>
            <span>{formatPrice(cart?.subtotal ?? 0)}</span>
          </div>
          <Link href="/checkout" onClick={closeDrawer} className="btn-luxury btn-gold-solid w-full justify-center mb-3">
            <span>Checkout →</span>
          </Link>
          <Link href="/cart" onClick={closeDrawer} className="block text-center text-xs tracking-[.15em] uppercase opacity-60 hover:opacity-100">
            View Full Bag
          </Link>
        </div>
      </aside>
    </>
  );
}
