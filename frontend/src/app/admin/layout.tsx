'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login?next=/admin');
    } else if (user.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ivory)' }}>
        <p className="text-sm opacity-60">Checking permissions…</p>
      </div>
    );
  }

  return (
    <div className="flex" style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <AdminSidebar />
      <main className="flex-1 p-8 md:p-10">{children}</main>
    </div>
  );
}
