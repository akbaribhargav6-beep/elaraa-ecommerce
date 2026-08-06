'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiClientError } from '@/lib/api-client';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '' });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <>
        <div className="pt-28" />
        <section className="px-6 pb-28 max-w-sm mx-auto text-center">
          <Eyebrow>Almost There</Eyebrow>
          <h1 className="serif text-3xl mt-4 mb-4">Check Your Email</h1>
          <p className="text-sm opacity-70 mb-8">
            We&apos;ve sent a verification link to {form.email}. You can log in right away, verifying just unlocks a
            couple of extras later.
          </p>
          <Button href="/login">Go to Sign In</Button>
        </section>
      </>
    );
  }

  return (
    <>
      <div className="pt-28" />
      <section className="px-6 pb-28 max-w-sm mx-auto">
        <div className="text-center mb-10">
          <Eyebrow>Join ELARAA</Eyebrow>
          <h1 className="serif text-4xl mt-4">Create Account</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="First name" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} className="border p-3 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
            <input placeholder="Last name" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} className="border p-3 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
          </div>
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => update('email', e.target.value)} className="w-full border p-3 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
          <input placeholder="Phone (optional)" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="w-full border p-3 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
          <input required type="password" minLength={8} placeholder="Password (min 8 characters)" value={form.password} onChange={(e) => update('password', e.target.value)} className="w-full border p-3 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <Button variant="gold-solid" className="w-full justify-center" disabled={loading}>{loading ? 'Creating…' : 'Create Account'}</Button>
        </form>
        <p className="text-center text-xs opacity-60 mt-6">
          Already have an account? <Link href="/login" className="underline">Sign in</Link>
        </p>
      </section>
    </>
  );
}
