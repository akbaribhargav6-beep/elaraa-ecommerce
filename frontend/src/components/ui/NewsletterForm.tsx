'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      await api.post('/api/newsletter/subscribe', { email });
      setStatus('done');
      setEmail('');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return <p className="text-sm reveal opacity-100">You&apos;re on the list, welcome to the ELARAA Circle.</p>;
  }

  return (
    <form className="max-w-md mx-auto flex" onSubmit={handleSubmit}>
      <input
        type="email"
        required
        placeholder="Your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 bg-transparent border-b py-3 px-1 text-sm outline-none"
        style={{ borderColor: 'var(--charcoal)' }}
      />
      <button className="text-xs tracking-[.2em] uppercase ml-4 hover:opacity-60" disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending…' : 'Subscribe →'}
      </button>
      {status === 'error' && <p className="text-xs text-red-700 mt-2">Something went wrong, please try again.</p>}
    </form>
  );
}
