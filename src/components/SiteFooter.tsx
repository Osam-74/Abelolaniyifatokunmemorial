export default function SiteFooter({
  name,
  message,
  farewell,
}: {
  name: string;
  message: string;
  farewell: string;
}) {
  return (
    <footer className="border-t border-ink/10 bg-mist/40">
      <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-10">
        <p className="text-center font-display text-[clamp(1.5rem,3.5vw,2.4rem)] leading-[1.25] text-ink">
          {message}
          <span className="block text-deep">Forever missed.</span>
        </p>

        <div className="mt-12 flex flex-col items-center gap-3 border-t border-ink/12 pt-7 font-util text-[0.7rem] uppercase tracking-[0.12em] text-ink/45 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} The family of {name}
          </p>
          <p className="font-display text-sm normal-case italic tracking-normal text-deep">
            {farewell || 'Sùn re o'}
          </p>
        </div>
      </div>
    </footer>
  );
}
