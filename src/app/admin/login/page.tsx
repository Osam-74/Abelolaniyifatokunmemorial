import { Suspense } from 'react';
import LoginForm from '@/components/admin/LoginForm';
import { getAdminBase } from '@/lib/adminPath';

export const metadata = { title: 'Sign in', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const base = await getAdminBase();

  return (
    <div className="grid min-h-screen place-items-center bg-ink px-5 py-16">
      <div className="w-full max-w-sm">
        <p className="eyebrow text-soft/70">Abel Olaniyi Fatokun</p>
        <h1 className="mt-3 font-display text-3xl text-mist">Family sign-in</h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-mist/60">
          This area is private. It is where the memorial's content, tributes and guestbook are managed.
        </p>
        <div className="mt-9 rounded-sm border border-mist/15 bg-mist/[0.04] p-7">
          <Suspense fallback={<p className="font-util text-sm text-mist/50">Loading…</p>}>
            <LoginForm adminBase={base} />
          </Suspense>
        </div>
        <a
          href="/"
          className="mt-6 inline-block font-util text-[0.68rem] uppercase tracking-[0.12em] text-mist/45 transition-colors hover:text-mist"
        >
          ← Back to the memorial
        </a>
      </div>
    </div>
  );
}
