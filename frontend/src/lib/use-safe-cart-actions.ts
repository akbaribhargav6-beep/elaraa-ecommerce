'use client';

import { useCart } from './cart-context';
import { useWishlist } from './wishlist-context';
import { useToast } from './toast-context';

// Several homepage sections (Best Sellers, Signature Earrings, Featured Deal,
// Necklace Chapter) each had their own "Add to Bag" / wishlist-heart button
// wired straight to addItem()/toggle() with no error handling — on any
// failure (network blip, rate limit, stale identity) the click just did
// nothing with zero feedback. This centralizes the fix so every entry point
// behaves the same way instead of drifting.
export function useSafeAddToCart() {
  const { addItem } = useCart();
  const { notify } = useToast();
  return async function safeAddToCart(productId: string, variantId: string, quantity = 1) {
    try {
      await addItem(productId, variantId, quantity);
    } catch {
      notify("Couldn't add this to your bag — please try again.");
    }
  };
}

export function useSafeWishlistToggle() {
  const { toggle } = useWishlist();
  const { notify } = useToast();
  return async function safeToggle(productId: string, variantId?: string) {
    try {
      await toggle(productId, variantId);
    } catch {
      notify('Something went wrong updating your wishlist.');
    }
  };
}
