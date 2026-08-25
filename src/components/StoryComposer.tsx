'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import RichTextEditor from './RichTextEditor';
import { submitStory, type FormState } from '@/lib/actions';

function PublishButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary">
      {pending ? 'Publishing…' : 'Publish'}
    </button>
  );
}

export default function StoryComposer() {
  const [state, formAction] = useActionState(submitStory, null as FormState);

  return (
    <div id="write" className="scroll-mt-28 rounded-sm border border-ink/12 bg-mist/45 p-6 md:p-8">
      <h2 className="font-display text-2xl">Share a story</h2>
      <p className="mt-2 text-[0.95rem] text-ink/60">
        A conversation you had, something he taught you, a day you have never forgotten.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
          <input name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <input name="title" required maxLength={200} placeholder="Title" className="field" />
          <input name="author_name" required maxLength={120} placeholder="Your name" className="field" />
        </div>
        <input
          name="relationship"
          maxLength={120}
          placeholder="How you knew him (optional)"
          className="field"
        />

        <RichTextEditor name="body" />

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
