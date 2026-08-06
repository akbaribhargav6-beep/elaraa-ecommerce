'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, ApiClientError } from '@/lib/api-client';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';

function VerifyEmailContent() {
  const token = useSearchParams().get('token');
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token.');
      return;
    }
    api
      .get<{ message: string }>(`/api/auth/verify-email/${token}`)
      .then(() => setStatus('done'))
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof ApiClientError ? err.message : 'Verification failed.');
      });
  }, [token]);

  if (status === 'loading') return <p className="text-sm opacity-60">Verifying…</p>;
  if (status === 'error') return <p className="text-sm opacity-70">{message}</p>;
  return <p className="text-sm opacity-70">Your email is verified, thank you.</p>;
}

export default function VerifyEmailPage() {
  return (
    <>
      <div className="pt-28" />
      <section className="px-6 pb-28 max-w-sm mx-auto text-center">
        <Eyebrow>Account</Eyebrow>
        <h1 className="serif text-4xl mt-4 mb-8">Email Verification</h1>
        <Suspense fallback={<p className="text-sm opacity-60">Loading…</p>}>
          <VerifyEmailContent />
        </Suspense>
        <div className="mt-10">
          <Button href="/account">Go to Account</Button>
        </div>
      </section>
    </>
  );
}
