'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { FormState } from '@/lib/actions';

export type Field = {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'url';
  required?: boolean;
  placeholder?: string;
  rows?: number;
  half?: boolean;
};

function SubmitButton({ label, busyLabel, tone }: { label: string; busyLabel: string; tone: 'ink' | 'onink' }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`btn ${tone === 'ink' ? 'btn-primary' : 'btn-onink'}`}>
      {pending ? busyLabel : label}
    </button>
  );
}

export default function SubmissionForm({
  action,
  fields,
  submitLabel,
  busyLabel = 'Sending…',
  note,
  tone = 'ink',
}: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  fields: Field[];
  submitLabel: string;
  busyLabel?: string;
  note?: string;
  tone?: 'ink' | 'onink';
}) {
  const [state, formAction] = useActionState(action, null);

  const onDark = tone === 'onink';

  if (state?.ok) {
    return (
      <div
        role="status"
        className={`rounded-sm border px-6 py-10 text-center ${
          onDark ? 'border-mist/25 bg-mist/5 text-mist' : 'border-deep/25 bg-mist/50 text-ink'
        }`}
      >
        <p className="font-display text-2xl leading-snug">Thank you</p>
        <p className={`mx-auto mt-3 max-w-md text-[0.98rem] ${onDark ? 'text-mist/75' : 'text-ink/70'}`}>
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* Honeypot — hidden from people, filled in by bots. */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name} className={field.half ? 'sm:col-span-1' : 'sm:col-span-2'}>
            <label htmlFor={field.name} className={`field-label ${onDark ? 'text-mist/60' : ''}`}>
              {field.label}
              {field.required && <span className="ml-1 text-deep">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                id={field.name}
                name={field.name}
                required={field.required}
                rows={field.rows ?? 6}
                placeholder={field.placeholder}
                className="field resize-y"
              />
            ) : (
              <input
                id={field.name}
                name={field.name}
                type={field.type === 'url' ? 'url' : 'text'}
                required={field.required}
                placeholder={field.placeholder}
                className="field"
              />
            )}
          </div>
        ))}
      </div>

      {state && !state.ok && (
        <p role="alert" className={`text-sm ${onDark ? 'text-flame' : 'text-deep'}`}>
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <SubmitButton label={submitLabel} busyLabel={busyLabel} tone={tone} />
        {note && (
          <p className={`max-w-sm font-util text-[0.72rem] leading-relaxed ${onDark ? 'text-mist/50' : 'text-ink/50'}`}>
            {note}
          </p>
        )}
      </div>
    </form>
  );
}
