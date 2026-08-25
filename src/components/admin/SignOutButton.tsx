'use client';

import { useTransition } from 'react';
import { signOut } from '@/app/admin/actions';

export default function SignOutButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => signOut())}
      className="font-util text-[0.68rem] uppercase tracking-[0.12em] text-ink/50 transition-colors hover:text-ink"
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
