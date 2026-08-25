'use client';

import Link from 'next/link';
import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { clientAuth, readableAuthError, firebaseAuthReady } from '@/lib/firebaseClient';

export default function ResetForm({ adminBase }: { adminBase: string }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!firebaseAuthReady()) {
      console.error('[reset] NEXT_PUBLIC_FIREBASE_* variables are not set.');
      setError('This is temporarily unavailable. Please try again in a moment.');
      return;
    }

    setBusy(true);
    try {
      await sendPasswordResetEmail(clientAuth(), email.trim());
      setSent(true);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      // Never reveal whether an address has an account.
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        setSent(true);
      } else {
        setError(readableAuthError(err) || 'Could not send the email. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-soft/40">
          <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true" fill="none">
            <path d="M1 7.5 6 12.5 17 1.5" stroke="#90E0EF" strokeWidth="1.6" />
          </svg>
        </div>
        <h1 className="mt-5 font-display text-2xl text-mist">Check your email</h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-mist/65">
          If <span className="text-mist">{email.trim()}</span> has an account here, a link to set a
          new password is on its way. It expires after an hour.
        </p>
        <p className="mt-4 text-[0.88rem] leading-relaxed text-mist/45">
          Nothing arrived? Look in your spam folder, then try again.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={`${adminBase}/login`} className="btn bg-mist text-ink hover:bg-soft">
            Back to sign in
          </Link>
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setError('');
            }}
            className="btn btn-onink"
          >
            Send again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-mist">Reset your password</h1>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-mist/65">
        Enter the email address you sign in with and we will send you a link to set a new one.
      </p>

      <form onSubmit={send} className="mt-7 space-y-4">
        <div>
          <label htmlFor="reset-email" className="field-label text-mist/60">
            Email address
          </label>
          <input
            id="reset-email"
            type="email"
            autoComplete="username"
            required
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field"
          />
        </div>

        {error && (
          <p role="alert" className="font-util text-[0.82rem] leading-relaxed text-flame">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn bg-mist text-ink hover:bg-soft w-full">
          {busy ? 'Sending…' : 'Send the reset link'}
        </button>
      </form>

      <p className="mt-6 text-[0.82rem] leading-relaxed text-mist/40">
        If you normally sign in with Google, you do not have a password here — use the Google button
        on the sign-in page instead.
      </p>
    </div>
  );
}
