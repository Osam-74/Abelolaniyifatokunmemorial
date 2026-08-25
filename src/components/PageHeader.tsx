import Reveal from './Reveal';

export default function PageHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <header className="border-b border-ink/10 bg-mist/45">
      <div className="mx-auto max-w-[1400px] px-5 pb-14 pt-32 md:px-10 md:pb-20 md:pt-40">
        <Reveal>
          <p className="eyebrow text-deep">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-[length:var(--text-display)]">{title}</h1>
          {intro && (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/70">{intro}</p>
          )}
        </Reveal>
      </div>
    </header>
  );
}
