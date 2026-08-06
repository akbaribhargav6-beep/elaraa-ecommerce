'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { CartDrawer } from './CartDrawer';
import { QuickViewModal } from '@/components/product/QuickViewModal';

// The admin panel has its own sidebar layout and shouldn't show the
// storefront nav/cart drawer — this is the one place that decides which
// chrome applies, so /admin/layout.tsx doesn't need to fight the root
// layout's markup (a nested layout can only add to a parent, never remove).
export function StorefrontChrome() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      <Header />
      <CartDrawer />
      <QuickViewModal />
    </>
  );
}
