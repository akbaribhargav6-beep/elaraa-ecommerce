'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClientError } from '@/lib/api-client';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) return <p className="text-sm opacity-70">This reset link is missing its token.</p>;

  return done ? (
    <p className="text-sm opacity-70">Password updated, redirecting you to sign in…</p>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <input required type="password" minLength={8} placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-3 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button variant="gold-solid" className="w-full justify-center" disabled={loading}>{loading ? 'Updating…' : 'Update Password'}</Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <div className="pt-28" />
      <section className="px-6 pb-28 max-w-sm mx-auto text-center">
        <Eyebrow>Password Reset</Eyebrow>
        <h1 className="serif text-4xl mt-4 mb-8">New Password</h1>
        <Suspense fallback={<p className="text-sm opacity-60">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </>
  );
}
