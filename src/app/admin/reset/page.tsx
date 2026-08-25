import Image from 'next/image';
import ResetForm from '@/components/admin/ResetForm';
import { getAdminBase } from '@/lib/adminPath';
import { getProfile } from '@/lib/content';

export const metadata = { title: 'Reset your password', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ResetPage() {
  const [base, profile] = await Promise.all([getAdminBase(), getProfile()]);

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-ink px-5 py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 75% 10%, #0077B6 0%, transparent 55%), radial-gradient(ellipse at 20% 90%, #00B4D8 0%, transparent 55%)',
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-t-full rounded-b-sm bg-ink-70">
            <Image
              src={profile.portraitUrl || '/images/portrait.jpg'}
              alt=""
              fill
              sizes="64px"
              className="object-cover object-top"
            />
          </div>
          <div>
            <p className="font-display text-xl leading-tight text-mist">{profile.fullName}</p>
            <p className="eyebrow mt-1 text-mist/40">Memorial</p>
          </div>
        </div>

        <div className="mt-9 rounded-sm border border-mist/15 bg-mist/[0.04] p-7">
          <ResetForm adminBase={base} />
        </div>

        <a
          href={`${base}/login`}
          className="mt-6 inline-block font-util text-[0.68rem] uppercase tracking-[0.12em] text-mist/40 transition-colors hover:text-mist"
        >
          ← Back to sign in
        </a>
      </div>
    </div>
  );
}
