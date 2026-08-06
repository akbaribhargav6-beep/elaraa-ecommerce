'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Footer } from '@/components/layout/Footer';

const NAV = [
  { href: '/account', label: 'Profile' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/wishlist', label: 'Wishlist' },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <>
        <div className="pt-28" />
        <p className="text-center text-sm opacity-60 py-20">Loading your account…</p>
      </>
    );
  }

  return (
    <>
      <div className="pt-28" />
      <section className="px-6 md:px-16 pb-28 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-[200px_1fr] gap-12">
          <aside>
            <p className="text-xs opacity-50 mb-6">Hi, {user.firstName}</p>
            <nav className="space-y-3 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block"
                  style={{ opacity: pathname === item.href ? 1 : 0.6, color: pathname === item.href ? 'var(--gold-deep)' : 'inherit' }}
                >
                  {item.label}
                </Link>
              ))}
              <button onClick={() => logout().then(() => router.push('/'))} className="block opacity-60 hover:opacity-100 mt-6">
                Sign Out
              </button>
            </nav>
          </aside>
          <div>{children}</div>
        </div>
      </section>
      <Footer />
    </>
  );
}
