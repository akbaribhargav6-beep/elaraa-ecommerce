'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClientError } from '@/lib/api-client';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      router.push(user.role === 'ADMIN' ? '/admin' : '/account');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="pt-28" />
      <section className="px-6 pb-28 max-w-sm mx-auto">
        <div className="text-center mb-10">
          <Eyebrow>Welcome Back</Eyebrow>
          <h1 className="serif text-4xl mt-4">Sign In</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-3 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
          <input required type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-3 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <Button variant="gold-solid" className="w-full justify-center" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</Button>
        </form>
        <div className="text-center mt-6 space-y-2">
          <Link href="/forgot-password" className="block text-xs opacity-60 hover:opacity-100">Forgot your password?</Link>
          <p className="text-xs opacity-60">
            New to ELARAA? <Link href="/register" className="underline">Create an account</Link>
          </p>
        </div>
      </section>
    </>
  );
}
