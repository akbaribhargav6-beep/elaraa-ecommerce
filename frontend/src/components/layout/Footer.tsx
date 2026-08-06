import Link from 'next/link';
import Image from 'next/image';
import clsx from 'clsx';

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/elaraa.luxes/',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/elaraa.luxes',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/919213473062',
    path: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662a11.87 11.87 0 005.708 1.458h.005c6.554 0 11.89-5.335 11.893-11.893 0-3.176-1.237-6.162-3.486-8.411z',
  },
];

const PAYMENT_BADGES = ['Visa', 'Mastercard', 'RuPay', 'NetBanking', 'COD'];

const SHOP_LINKS = [
  { label: 'Statement Earrings', href: '/shop?category=earrings' },
  { label: 'Elegant Necklaces', href: '/shop?category=necklaces' },
  { label: 'Daily Wear Rings', href: '/shop?category=rings' },
  { label: 'New Arrivals', href: '/shop?newArrival=true' },
];

const TRUST_BADGES = ['Anti Tarnish Quality', 'Skin Friendly Alloy', 'Fast Insured Shipping'];

export function Footer({ noMt }: { noMt?: boolean }) {
  return (
    <footer className={clsx('px-6 md:px-16 py-16', !noMt && 'mt-10')} style={{ background: 'var(--black)', color: 'var(--ivory)' }}>
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10 text-sm">
        <div>
          <Image src="/images/logo/elaraa-footer.png" alt="ELARAA" height={188} width={260} style={{ height: 64, width: 'auto' }} className="mb-4" />
          <p className="opacity-60 text-xs leading-relaxed mb-6">
            Premium fashion jewellery designed for everyday wear.
            <br />
            Made with intention. Worn with ease.
          </p>

          <p className="text-[11px] tracking-[.2em] uppercase opacity-50 mb-3">Connect With Us</p>
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="social-icon w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/80 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs tracking-[.2em] uppercase opacity-50 mb-4">Shop Collections</p>
          <ul className="space-y-2 opacity-70 text-xs">
            {SHOP_LINKS.map((link) => (
              <li key={link.label}><Link href={link.href} className="hover:opacity-100">{link.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-[.2em] uppercase opacity-50 mb-4">Customer Support</p>
          <ul className="space-y-2 opacity-70 text-xs">
            <li><Link href="/policy#shipping" className="hover:opacity-100">Insured Shipping & Returns</Link></li>
            <li><Link href="/policy#authenticity" className="hover:opacity-100">Anti Tarnish Quality Standard</Link></li>
            <li><Link href="/policy#privacy" className="hover:opacity-100">Privacy Policy</Link></li>
            <li><Link href="/policy#terms" className="hover:opacity-100">Terms of Service</Link></li>
            <li><Link href="/contact" className="hover:opacity-100">Contact Concierge</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-[.2em] uppercase opacity-50 mb-4">Guaranteed & Secure</p>
          <p className="opacity-60 text-xs leading-relaxed mb-4">
            256 bit SSL encryption on every order. Cash on Delivery available across India.
          </p>
          <p className="text-[11px] tracking-[.15em] uppercase opacity-50 mb-2.5">Accepted Payment Methods</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-1 bg-white/10 rounded border border-white/10 text-[10px] font-semibold text-white tracking-wider flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D8B77E" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              BHIM / UPI
            </span>
            {PAYMENT_BADGES.map((badge) => (
              <span
                key={badge}
                className="px-2 py-1 bg-white/10 rounded border border-white/10 text-[10px] font-semibold tracking-wider"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="divider-gold my-10 max-w-7xl mx-auto" />
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] opacity-50">
        <p>© {new Date().getFullYear()} ELARAA LUXES. All rights reserved.</p>
        <div className="flex items-center gap-3">
          {TRUST_BADGES.map((badge, i) => (
            <span key={badge} className="flex items-center gap-3">
              {badge}
              {i < TRUST_BADGES.length - 1 && <span>•</span>}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
