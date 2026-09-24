'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { clientAuth } from '@/lib/firebaseClient';

export default function SignOutButton({ loginHref }: { loginHref: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const leave = async () => {
    setBusy(true);
    await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => undefined);
    await signOut(clientAuth()).catch(() => undefined);
    router.replace(loginHref);
    router.refresh();
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={leave}
      title={busy ? 'Signing out…' : 'Sign out'}
      aria-label={busy ? 'Signing out…' : 'Sign out'}
      className="grid h-8 w-8 place-items-center rounded-md disabled:opacity-50"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
      </svg>
    </button>
  );
}
