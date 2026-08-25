'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
  browserLocalPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { clientAuth, googleProvider, readableAuthError, firebaseAuthReady } from '@/lib/firebaseClient';

type Mode = 'idle' | 'google' | 'password' | 'reset';

export default function LoginForm({ adminBase }: { adminBase: string }) {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<Mode>('idle');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const destination = () => {
    const next = params.get('next');
    return next && next.startsWith(adminBase) ? next : adminBase;
  };

  /** Hands the Firebase token to the server, which decides whether this person may enter. */
  const establishSession = async (idToken: string) => {
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      // Do not leave them signed in to Firebase if we refused them here.
      await signOut(clientAuth()).catch(() => undefined);
      throw new Error(data.error ?? 'Could not complete sign-in.');
    }
    router.replace(destination());
    router.refresh();
  };

  const withGoogle = async () => {
    setError('');
    setNotice('');
    setBusy('google');
    try {
      const auth = clientAuth();
      await setPersistence(auth, browserLocalPersistence);
      const credential = await signInWithPopup(auth, googleProvider());
      await establishSession(await credential.user.getIdToken());
    } catch (err) {
      const message = err instanceof Error && err.message.length < 200 ? err.message : readableAuthError(err);
      setError(readableAuthError(err) || message);
      setBusy('idle');
    }
  };

  const withPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy('password');
    try {
      const auth = clientAuth();
      await setPersistence(auth, browserLocalPersistence);
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await establishSession(await credential.user.getIdToken());
    } catch (err) {
      setError(err instanceof Error && !(err as { code?: string }).code ? err.message : readableAuthError(err));
      setBusy('idle');
    }
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email address first, then choose this again.');
      return;
    }
    setError('');
    setBusy('reset');
    try {
      await sendPasswordResetEmail(clientAuth(), email.trim());
      setNotice('If that address has an account, a reset link is on its way.');
    } catch (err) {
      setError(readableAuthError(err));
    } finally {
      setBusy('idle');
    }
  };

  if (!firebaseAuthReady()) {
    return (
      <p className="text-[0.9rem] leading-relaxed text-flame">
        Firebase sign-in is not configured. Add the <code>NEXT_PUBLIC_FIREBASE_*</code> variables to
        the project and redeploy.
      </p>
    );
  }

  const working = busy !== 'idle';

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={withGoogle}
        disabled={working}
        className="flex w-full items-center justify-center gap-3 rounded-full bg-mist px-5 py-3.5 font-util text-[0.8rem] font-medium tracking-[0.02em] text-ink transition-colors hover:bg-soft disabled:opacity-60"
      >
        <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.6 9.2c0-.6-.05-1.2-.16-1.7H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.6z" />
          <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3z" />
          <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z" />
        </svg>
        {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
      </button>

      <div className="flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-mist/20" />
        <span className="font-util text-[0.62rem] uppercase tracking-[0.18em] text-mist/40">or</span>
        <span className="h-px flex-1 bg-mist/20" />
      </div>

      <form onSubmit={withPassword} className="space-y-4">
        <div>
          <label htmlFor="email" className="field-label text-mist/60">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="password" className="field-label text-mist/60">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field"
          />
        </div>

        {error && (
          <p role="alert" className="font-util text-[0.82rem] leading-relaxed text-flame">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="font-util text-[0.82rem] leading-relaxed text-soft">
            {notice}
          </p>
        )}

        <button type="submit" disabled={working} className="btn btn-onink w-full">
          {busy === 'password' ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <button
        type="button"
        onClick={resetPassword}
        disabled={working}
        className="font-util text-[0.7rem] uppercase tracking-[0.11em] text-mist/45 transition-colors hover:text-mist"
      >
        {busy === 'reset' ? 'Sending…' : 'Forgotten your password?'}
      </button>
    </div>
  );
}
