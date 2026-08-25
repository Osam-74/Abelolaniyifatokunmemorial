'use client';

import { useState, useTransition } from 'react';
import { runSetup } from '@/app/admin/actions';

export default function SetupPanel({
  connected,
  tablesReady = false,
}: {
  connected: boolean;
  tablesReady?: boolean;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!connected) {
    return (
      <div className="rounded-sm border border-[#b00020]/30 bg-[#fff5f5] px-6 py-5">
        <h2 className="font-display text-xl">The database is not connected</h2>
        <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-ink/70">
          Add a Postgres database to the project and set <code className="font-util text-[0.85em]">DATABASE_URL</code>{' '}
          in your environment variables, then redeploy. Neon, Supabase and Vercel Postgres all work.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-sm border px-6 py-5 ${
        tablesReady ? 'border-ink/12 bg-paper' : 'border-deep/30 bg-bright/10'
      }`}
    >
      <h2 className="font-display text-xl">
        {tablesReady ? 'Database structure' : 'Finish setting up the database'}
      </h2>
      <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-ink/70">
        {tablesReady
          ? 'Run this after any update to the website. It adds anything new and never touches content you have already entered.'
          : 'The database is connected but the tables have not been created yet. This is a one-time step.'}
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setResult(await runSetup()))}
        className={`mt-5 btn ${tablesReady ? 'btn-ghost' : 'btn-primary'}`}
      >
        {pending ? 'Updating…' : tablesReady ? 'Update the database' : 'Create the tables'}
      </button>
      {result && (
        <p className={`mt-4 font-util text-sm ${result.ok ? 'text-deep' : 'text-[#b00020]'}`}>
          {result.message}
          {result.ok && ' Reload this page.'}
        </p>
      )}
    </div>
  );
}
