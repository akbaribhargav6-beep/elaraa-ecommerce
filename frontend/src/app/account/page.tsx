'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';

export default function ProfilePage() {
  const { user } = useAuth();
  const [sent, setSent] = useState(false);

  if (!user) return null;

  async function resendVerification() {
    await api.post('/api/auth/resend-verification', { email: user!.email });
    setSent(true);
  }

  return (
    <div>
      <h1 className="serif text-3xl mb-8">Your Profile</h1>
      <div className="space-y-4 text-sm max-w-md">
        <div className="flex justify-between border-b pb-3" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
          <span className="opacity-60">Name</span>
          <span>{user.firstName} {user.lastName ?? ''}</span>
        </div>
        <div className="flex justify-between border-b pb-3" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
          <span className="opacity-60">Email</span>
          <span>{user.email}</span>
        </div>
        <div className="flex justify-between border-b pb-3" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
          <span className="opacity-60">Phone</span>
          <span>{user.phone ?? 'Not provided'}</span>
        </div>
        <div className="flex justify-between border-b pb-3" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
          <span className="opacity-60">Email Verified</span>
          <span>{user.isEmailVerified ? 'Yes' : 'No'}</span>
        </div>
      </div>

      {!user.isEmailVerified && (
        <div className="mt-8">
          {sent ? (
            <p className="text-xs opacity-60">Verification email sent, check your inbox.</p>
          ) : (
            <Button variant="gold" onClick={resendVerification}>Resend Verification Email</Button>
          )}
        </div>
      )}
    </div>
  );
}
