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
      className="font-util text-[0.68rem] uppercase tracking-[0.12em] text-ink/50 transition-colors hover:text-ink"
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
