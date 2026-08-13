'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard' }],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/admin/products', label: 'Products' },
      { href: '/admin/categories', label: 'Categories' },
      { href: '/admin/inventory', label: 'Inventory' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { href: '/admin/orders', label: 'Orders' },
      { href: '/admin/customers', label: 'Customers' },
      { href: '/admin/reviews', label: 'Reviews' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { href: '/admin/coupons', label: 'Coupons' },
      { href: '/admin/discounts', label: 'Discounts' },
      { href: '/admin/banners', label: 'Banners' },
      { href: '/admin/combo', label: 'Combo Management' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { href: '/admin/newsletter', label: 'Newsletter' },
      { href: '/admin/contact', label: 'Messages' },
    ],
  },
  {
    label: 'System',
    items: [{ href: '/admin/settings', label: 'Settings' }],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col h-screen sticky top-0 overflow-y-auto"
      style={{ background: 'var(--black)', color: 'var(--ivory)' }}
    >
      <div className="px-6 py-6 border-b" style={{ borderColor: 'rgba(248,245,240,.1)' }}>
        <Image src="/images/logo/elaraa-wordmark.png" alt="ELARAA" height={20} width={100} style={{ height: 20, width: 'auto', filter: 'invert(1)' }} />
        <p className="text-[10px] tracking-[.25em] uppercase opacity-50 mt-2">Admin</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-8">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] tracking-[.2em] uppercase opacity-40 px-2 mb-2">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-2 py-2 text-sm rounded"
                    style={{
                      background: active ? 'rgba(201,166,107,.15)' : 'transparent',
                      color: active ? 'var(--gold)' : 'var(--ivory)',
                      opacity: active ? 1 : 0.75,
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-6 py-5 border-t text-xs" style={{ borderColor: 'rgba(248,245,240,.1)' }}>
        <p className="opacity-70">{user?.firstName} {user?.lastName}</p>
        <p className="opacity-40 mb-3">{user?.email}</p>
        <Link href="/" className="block opacity-60 hover:opacity-100 mb-1">← Back to Store</Link>
        <button onClick={logout} className="opacity-60 hover:opacity-100">Sign Out</button>
      </div>
    </aside>
  );
}
