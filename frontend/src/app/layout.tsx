import type { Metadata } from 'next';
import { Cormorant_Garamond, Jost, Caveat } from 'next/font/google';
import '@/styles/globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { WishlistProvider } from '@/lib/wishlist-context';
import { QuickViewProvider } from '@/lib/quick-view-context';
import { GsapLenisProvider } from '@/lib/gsap-lenis-provider';
import { StorefrontChrome } from '@/components/layout/StorefrontChrome';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-jost',
  display: 'swap',
});

// Handwriting accent font used only for the testimonial gallery's quote
// snippets and signature-style flourishes.
const caveat = Caveat({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-caveat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ELARAA | Premium Fashion Jewellery',
  description: 'ELARAA: premium fashion jewellery, minimally designed for everyday wear and lasting shine.',
  icons: { icon: '/images/logo/favicon-32.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable} ${caveat.variable}`}>
      <body>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <QuickViewProvider>
                <GsapLenisProvider>
                  <StorefrontChrome />
                  {children}
                </GsapLenisProvider>
              </QuickViewProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
