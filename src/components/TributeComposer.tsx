'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitTribute, type FormState } from '@/lib/actions';
import TributeIcon, { TRIBUTE_KINDS, type TributeKind } from './TributeIcon';

function PublishButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary">
      {pending ? 'Publishing…' : 'Publish'}
    </button>
  );
}

export default function TributeComposer() {
  const [state, formAction] = useActionState(submitTribute, null as FormState);
  const [kind, setKind] = useState<TributeKind>('flower');

  return (
    <div id="tribute" className="scroll-mt-28 rounded-sm border border-ink/12 bg-mist/45 p-6 md:p-8">
      <h2 className="font-display text-2xl">Leave a tribute</h2>

      <form action={formAction} className="mt-6 space-y-5">
        <input type="hidden" name="kind" value={kind} />

        <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
          <input name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <fieldset>
          <legend className="sr-only">Choose a tribute</legend>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {TRIBUTE_KINDS.map((option) => {
              const active = kind === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setKind(option.id)}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-2 rounded-sm border px-2 py-4 transition-colors ${
                    active
                      ? 'border-deep bg-paper shadow-[0_2px_14px_-6px_rgba(3,4,94,0.4)]'
                      : 'border-ink/12 bg-paper/50 hover:border-ink/35'
                  }`}
                >
                  <TributeIcon kind={option.id} size={38} />
                  <span
                    className={`text-center font-util text-[0.66rem] uppercase leading-tight tracking-[0.09em] ${
                      active ? 'text-ink' : 'text-ink/55'
                    }`}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="tribute-name" className="sr-only">
            Your name
          </label>
          <input
            id="tribute-name"
            name="name"
            required
            maxLength={120}
            placeholder="Your name"
            className="field"
          />
        </div>

        <div>
          <label htmlFor="tribute-message" className="sr-only">
            Your tribute
          </label>
          <textarea
            id="tribute-message"
            name="message"
            required
            rows={5}
            maxLength={4000}
            placeholder="Write your tribute…"
            className="field resize-y"
          />
        </div>

        {state && (
          <p
            role="status"
            className={`font-util text-[0.85rem] ${state.ok ? 'text-deep' : 'text-[#b00020]'}`}
          >
            {state.message}
          </p>
        )}

        <div className="flex justify-end">
          <PublishButton />
        </div>
      </form>
    </div>
  );
}
