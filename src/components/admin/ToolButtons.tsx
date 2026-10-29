'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { sendTestEmail, rejectSpamPending, type ToolState } from '@/app/admin/tools-actions';

function Btn({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-ink/30 px-4 py-2 font-util text-[0.68rem] uppercase tracking-[0.11em] text-ink transition-colors hover:bg-ink hover:text-mist disabled:opacity-50"
    >
      {pending ? busy : label}
    </button>
  );
}

function Tool({ action, label, busy }: { action: (p: ToolState) => Promise<ToolState>; label: string; busy: string }) {
  const [state, run] = useActionState<ToolState>(action, null);
  return (
    <form action={run} className="space-y-2">
      <Btn label={label} busy={busy} />
      {state && (
        <p role={state.ok ? 'status' : 'alert'} className={`max-w-md text-[0.85rem] leading-relaxed ${state.ok ? 'text-deep' : 'text-[#b00020]'}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}

export const TestEmailButton = () => <Tool action={sendTestEmail} label="Send a test email" busy="Sending…" />;
export const RejectSpamButton = () => <Tool action={rejectSpamPending} label="Reject waiting spam" busy="Checking…" />;
