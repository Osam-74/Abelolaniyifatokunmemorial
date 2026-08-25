export default function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-sm border border-dashed border-ink/20 bg-mist/30 px-6 py-14 text-center">
      <p className="font-display text-xl text-ink/80">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-[0.95rem] text-ink/55">{hint}</p>
    </div>
  );
}
