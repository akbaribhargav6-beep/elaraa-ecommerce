'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await forgotPassword(email).finally(() => setLoading(false));
    setDone(true);
  }

  return (
    <>
      <div className="pt-28" />
      <section className="px-6 pb-28 max-w-sm mx-auto text-center">
        <Eyebrow>Password Reset</Eyebrow>
        <h1 className="serif text-4xl mt-4 mb-8">Forgot Password</h1>
        {done ? (
          <p className="text-sm opacity-70">If that email is registered, a reset link is on its way.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <input required type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-3 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
            <Button variant="gold-solid" className="w-full justify-center" disabled={loading}>{loading ? 'Sending…' : 'Send Reset Link'}</Button>
          </form>
        )}
      </section>
    </>
  );
}
