import type { Metadata } from 'next';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Policies | ELARAA',
  description: 'Shipping, returns, privacy, and terms for ELARAA premium fashion jewellery.',
};

const JUMP_LINKS = [
  { href: '#shipping', label: 'Shipping & Returns' },
  { href: '#authenticity', label: 'Authenticity & Quality' },
  { href: '#privacy', label: 'Privacy' },
  { href: '#terms', label: 'Terms of Service' },
  { href: '#care', label: 'Jewellery Care' },
];

export default function PolicyPage() {
  return (
    <>
      <div className="pt-28" />
      <section className="px-4 sm:px-6 md:px-16 pb-20 sm:pb-28 max-w-4xl mx-auto">
        <RevealOnScroll className="text-center mb-8 sm:mb-14">
          <Eyebrow>Policies</Eyebrow>
          <h1 className="serif text-3xl sm:text-4xl md:text-6xl mt-3 sm:mt-4">Good to Know</h1>
        </RevealOnScroll>

        <RevealOnScroll className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mb-10 sm:mb-14">
          {JUMP_LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 sm:px-5 py-2.5 border text-xs tracking-[.15em] uppercase min-h-[44px] flex items-center font-medium transition-colors hover:opacity-70"
              style={i === 0 ? { borderColor: 'var(--gold-deep)', color: 'var(--gold-deep)' } : { borderColor: 'rgba(43,38,32,.2)' }}
            >
              {link.label}
            </a>
          ))}
        </RevealOnScroll>

        <div className="space-y-8 sm:space-y-10 text-sm opacity-80 leading-relaxed">
          <RevealOnScroll id="shipping" className="p-5 sm:p-8 border scroll-mt-28" style={{ borderColor: 'rgba(43,38,32,.12)' }}>
            <h2 className="serif text-2xl sm:text-3xl mb-4 sm:mb-6" style={{ opacity: 1, color: 'var(--gold-deep)' }}>Shipping &amp; Returns</h2>
            <div className="space-y-3">
              <p><strong className="opacity-100">Shipping:</strong> Orders are dispatched within 24 hours and arrive within 3 to 5 business days across India. Shipping is free on orders over ₹2,000; a flat ₹99 applies below that.</p>
              <p><strong className="opacity-100">Returns:</strong> Unworn pieces in original packaging can be returned or exchanged within 14 days of delivery. To start a return, contact us with your order number.</p>
              <p><strong className="opacity-100">Warranty:</strong> Every ELARAA piece is covered by a 1 year craftsmanship warranty against tarnish and defects.</p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll id="authenticity" className="p-5 sm:p-8 border scroll-mt-28" style={{ borderColor: 'rgba(43,38,32,.12)' }}>
            <h2 className="serif text-2xl sm:text-3xl mb-4 sm:mb-6" style={{ opacity: 1, color: 'var(--gold-deep)' }}>Authenticity &amp; Quality Standard</h2>
            <div className="space-y-3">
              <p>
                Every ELARAA piece is fashion jewellery crafted from a premium alloy base with a long lasting, anti
                tarnish, skin friendly finish, not gold or silver. We&apos;re upfront about this so you know exactly
                what you&apos;re buying.
              </p>
              <p>Every order ships with an authenticity card confirming the finish and care standard of your piece.</p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll id="privacy" className="p-5 sm:p-8 border scroll-mt-28" style={{ borderColor: 'rgba(43,38,32,.12)' }}>
            <h2 className="serif text-2xl sm:text-3xl mb-4 sm:mb-6" style={{ opacity: 1, color: 'var(--gold-deep)' }}>Privacy Policy</h2>
            <div className="space-y-3">
              <p>We collect only what&apos;s needed to process your order and improve your experience: your name, email, phone, and shipping address. We never sell your data to third parties.</p>
              <p>Payment details are handled securely and are never stored on our servers in raw form. You can request access to, correction of, or deletion of your data at any time by contacting us.</p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll id="terms" className="p-5 sm:p-8 border scroll-mt-28" style={{ borderColor: 'rgba(43,38,32,.12)' }}>
            <h2 className="serif text-2xl sm:text-3xl mb-4 sm:mb-6" style={{ opacity: 1, color: 'var(--gold-deep)' }}>Terms of Service</h2>
            <div className="space-y-3">
              <p>By placing an order with ELARAA, you agree to our pricing, availability, and shipping terms as listed at time of purchase. Prices are listed in Indian Rupees (₹) and are subject to change without notice. All product images are representative; natural variation in handmade pieces is expected.</p>
              <p>All jewellery is sold subject to availability. We reserve the right to cancel any order suspected of fraud or error, with a full refund issued.</p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll id="care" className="p-5 sm:p-8 border scroll-mt-28" style={{ borderColor: 'rgba(43,38,32,.12)' }}>
            <h2 className="serif text-2xl sm:text-3xl mb-4 sm:mb-6" style={{ opacity: 1, color: 'var(--gold-deep)' }}>Jewellery Care</h2>
            <ul className="space-y-2 list-none">
              <li>• Store pieces separately to avoid scratching</li>
              <li>• Remove before swimming, showering or exercise</li>
              <li>• Clean gently with a soft, lint free cloth</li>
            </ul>
          </RevealOnScroll>
        </div>
      </section>
      <Footer />
    </>
  );
}
