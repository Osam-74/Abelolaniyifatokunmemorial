'use client';

import { useTransition } from 'react';
import { deleteRow, setStatus, toggleFeatured } from '@/app/admin/actions';

export function StatusButtons({
  slug,
  id,
  status,
}: {
  slug: string;
  id: number;
  status: string;
}) {
  const [pending, start] = useTransition();

  const options: { value: string; label: string }[] = [
    { value: 'approved', label: 'Approve' },
    { value: 'pending', label: 'Hold' },
    { value: 'rejected', label: 'Reject' },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = status === option.value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={pending || active}
            onClick={() => start(() => setStatus(slug, id, option.value))}
            className={`rounded-full border px-3 py-1.5 font-util text-[0.66rem] uppercase tracking-[0.1em] transition-colors disabled:cursor-default ${
              active
                ? option.value === 'approved'
                  ? 'border-deep bg-deep text-mist'
                  : option.value === 'rejected'
                    ? 'border-ink/40 bg-ink/70 text-mist'
                    : 'border-ink/30 bg-mist text-ink'
                : 'border-ink/20 text-ink/60 hover:border-ink hover:text-ink disabled:opacity-40'
            }`}
          >
            {active ? `${option.label}d`.replace('Holdd', 'On hold').replace('Approvedd', 'Approved') : option.label}
          </button>
        );
      })}
    </div>
  );
}

export function FeatureToggle({ slug, id, value }: { slug: string; id: number; value: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => toggleFeatured(slug, id, !value))}
      className={`rounded-full border px-3 py-1.5 font-util text-[0.66rem] uppercase tracking-[0.1em] transition-colors ${
        value ? 'border-bright bg-bright/15 text-deep' : 'border-ink/20 text-ink/55 hover:border-ink hover:text-ink'
      }`}
    >
      {value ? 'On homepage' : 'Add to homepage'}
    </button>
  );
}

export function DeleteButton({ slug, id, label }: { slug: string; id: number; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`Delete this ${label}? This cannot be undone.`)) {
          start(() => deleteRow(slug, id));
        }
      }}
      className="font-util text-[0.66rem] uppercase tracking-[0.1em] text-ink/40 transition-colors hover:text-[#b00020]"
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  );
}
