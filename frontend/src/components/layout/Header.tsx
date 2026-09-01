'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/cart-context';
import { HeaderSearch } from './HeaderSearch';

const DESKTOP_NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/shop?newArrival=true', label: 'New Arrivals' },
  { href: '/shop?bestSeller=true', label: 'Best Seller' },
  { href: '/about', label: 'Our Story' },
  { href: '/contact', label: 'Contact' },
];

const MOBILE_NAV_LINKS = [
  { href: '/shop', label: 'Shop All' },
  { href: '/shop?newArrival=true', label: 'New Arrivals' },
  { href: '/shop?bestSeller=true', label: 'Best Seller' },
  { href: '/about', label: 'Our Story' },
  { href: '/contact', label: 'Contact' },
  { href: '/policy', label: 'Customer Care' },
];

// Desktop: nav links left, logo dead-centered via absolute positioning
// (independent of the width of either side), search/bag icons right.
// Mobile: hamburger left opens a slide-out drawer with the same nav links,
// logo stays centered, search/bag icons stay right.
//
// The desktop layout switches on the custom `header-desktop` breakpoint
// (1600px, see tailwind.config.ts) instead of the stock `md` (768px).
// With 7 nav links at this tracking/gap, the links block runs almost
// 690px wide — comfortably clear of the centered logo on a wide desktop
// window, but colliding with it well before 768px and still uncomfortably
// close even at typical laptop widths (measured the real collision point
// rather than guessing). Every width at or below 1600px now gets the
// already-correct mobile hamburger layout instead of a cramped in-between
// state.
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cart, openDrawer } = useCart();
  const itemCount = cart?.itemCount ?? 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <nav
        className={`nav-fixed px-4 sm:px-6 md:px-12 py-3.5 md:py-5 flex items-center justify-between relative ${scrolled ? 'nav-scrolled' : ''}`}
      >
        {/* Left: mobile hamburger + desktop nav links */}
        <div className="flex items-center gap-6 md:gap-8">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="header-desktop:hidden flex items-center justify-center w-10 h-10 -ml-2 hover:opacity-60"
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="hidden header-desktop:flex items-center gap-8 text-xs tracking-[.2em] uppercase font-sans">
            {DESKTOP_NAV_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="hover:opacity-60">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Center: logo, dead-centered regardless of side content width */}
        <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
          <Image
            src="/images/logo/elaraa-full.png"
            alt="ELARAA"
            height={188}
    width={260}
    className="h-11 sm:h-12 md:h-14 w-auto object-contain"
    priority
          />
        </Link>

        {/* Right: search + bag icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <HeaderSearch />
          <button
            onClick={openDrawer}
            aria-label={`Shopping bag${itemCount > 0 ? `, ${itemCount} items` : ''}`}
            className="relative p-2 min-w-[40px] min-h-[40px] flex items-center justify-center hover:opacity-60"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
            {itemCount > 0 && (
              <span
                className="absolute top-0.5 right-0.5 flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-semibold leading-none text-white"
                style={{ background: 'var(--gold-deep)' }}
              >
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile nav drawer */}
      <div
        onClick={() => setMobileMenuOpen(false)}
        className={`fixed inset-0 bg-[#17140F]/50 backdrop-blur-sm z-[98] transition-opacity duration-300 header-desktop:hidden ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        className={`fixed top-0 left-0 h-full w-[85%] max-w-[320px] z-[99] flex flex-col justify-between shadow-2xl transition-transform duration-500 ease-out header-desktop:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--ivory)', borderRight: '1px solid rgba(201,166,107,.3)' }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between pb-5 border-b" style={{ borderColor: 'rgba(43,38,32,.15)' }}>
            <Image
              src="/images/logo/elaraa-full.png"
              alt="ELARAA"
              height={188}
    width={260}
    className="h-11 sm:h-12 md:h-14 w-auto object-contain"
    priority
            />
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg hover:bg-black/5"
            >
              ✕
            </button>
          </div>
          <div className="py-6 flex flex-col gap-5 text-xs tracking-[.25em] uppercase font-medium">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="pb-2.5 border-b hover:text-[var(--gold-deep)]"
              style={{ borderColor: 'rgba(43,38,32,.1)' }}
            >
              Home
            </Link>
            {MOBILE_NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="pb-2.5 border-b hover:text-[var(--gold-deep)]"
                style={{ borderColor: 'rgba(43,38,32,.1)' }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="p-5 text-center" style={{ background: 'var(--cream)', borderTop: '1px solid rgba(43,38,32,.15)' }}>
          <p className="eyebrow mb-1" style={{ fontSize: '0.65rem' }}>Anti Tarnish Premium Fashion Jewellery</p>
          <p className="text-[11px] font-serif italic opacity-70">Free Insured Shipping Across India</p>
        </div>
      </aside>
    </>
  );
}
