import Flame from '@/components/Flame';
import Reveal from '@/components/Reveal';
import SubmissionForm from '@/components/SubmissionForm';
import CountUp from '@/components/CountUp';
import { lightCandle } from '@/lib/actions';
import { safeQuery, getSetting, formatDate } from '@/lib/content';

export const revalidate = 30;
export const metadata = { title: 'Light a Candle' };

type Candle = { id: number; name: string; message: string; created_at: string };

export default async function CandlesPage() {
  const [intro, candles, countRows] = await Promise.all([
    getSetting<{ heading: string; body: string }>('candlesIntro'),
    safeQuery<Candle>(
      `SELECT id, name, message, created_at FROM candles WHERE status = 'approved'
       ORDER BY created_at DESC LIMIT 240`
    ),
    safeQuery<{ n: number }>(`SELECT count(*)::int AS n FROM candles WHERE status = 'approved'`),
  ]);

  const total = countRows[0]?.n ?? 0;

  return (
    <div className="bg-ink text-mist">
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, #FFB454 0%, transparent 55%)' }}
        />
        <div className="relative mx-auto max-w-[1400px] px-5 pb-16 pt-32 text-center md:px-10 md:pt-40">
          <Reveal>
            <p className="eyebrow text-flame/70">Remembrance</p>
            <h1 className="mx-auto mt-5 max-w-3xl text-[length:var(--text-display)]">{intro.heading}</h1>
            <p className="mx-auto mt-6 max-w-xl leading-relaxed text-mist/70">{intro.body}</p>
            <p className="mt-10 font-display text-[clamp(2.5rem,7vw,5rem)] leading-none text-flame">
              <CountUp value={total} />
            </p>
            <p className="eyebrow mt-3 text-mist/50">
              {total === 1 ? 'candle lit' : 'candles lit'} in his memory
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-20 md:px-10">
        <Reveal>
          <div className="rounded-sm border border-mist/15 bg-mist/[0.04] p-7 md:p-10">
            <h2 className="font-display text-2xl">Light one now</h2>
            <p className="mt-2 text-[0.95rem] text-mist/60">
              Your candle stays lit on this wall for as long as the memorial stands.
            </p>
            <div className="mt-7">
              <SubmissionForm
                action={lightCandle}
                tone="onink"
                submitLabel="Light the candle"
                busyLabel="Lighting…"
                fields={[
                  { name: 'name', label: 'Your name', required: true },
                  { name: 'message', label: 'A short message (optional)', type: 'textarea', rows: 3 },
                ]}
              />
            </div>
          </div>
        </Reveal>
      </section>

      <section className="border-t border-mist/10 py-16 md:py-24">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <h2 className="text-center font-display text-2xl text-mist/85">The candle wall</h2>
          {candles.length === 0 ? (
            <p className="mt-8 text-center text-mist/50">No candles have been lit yet.</p>
          ) : (
            <ul className="mt-14 flex flex-wrap items-end justify-center gap-x-2 gap-y-10 sm:gap-x-5">
              {candles.map((candle) => (
                <li key={candle.id} className="group relative w-[74px] sm:w-[92px]">
                  <div className="flex justify-center">
                    <Flame seed={candle.id} size={44} />
                  </div>
                  <p className="mt-1 truncate px-1 text-center font-util text-[0.66rem] text-mist/60">
                    {candle.name}
                  </p>
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-sm border border-mist/20 bg-ink-70 p-3 text-left opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                    <p className="font-util text-[0.72rem] font-medium text-mist">{candle.name}</p>
                    <p className="font-util text-[0.62rem] uppercase tracking-[0.1em] text-mist/45">
                      {formatDate(candle.created_at)}
                    </p>
                    {candle.message && (
                      <p className="mt-2 text-[0.78rem] leading-relaxed text-mist/80">{candle.message}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
