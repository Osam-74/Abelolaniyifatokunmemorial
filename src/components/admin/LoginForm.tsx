'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signIn } from '@/app/admin/actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn bg-mist text-ink hover:bg-soft w-full">
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  );
}

export default function LoginForm() {
  const [state, action] = useActionState(signIn, null);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="username" className="field-label text-mist/60">
          Username
        </label>
        <input id="username" name="username" autoComplete="username" required className="field" />
      </div>
      <div>
        <label htmlFor="password" className="field-label text-mist/60">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field"
        />
      </div>
      {state && !state.ok && (
        <p role="alert" className="font-util text-[0.82rem] leading-relaxed text-flame">
          {state.message}
        </p>
      )}
      <Submit />
    </form>
  );
}
