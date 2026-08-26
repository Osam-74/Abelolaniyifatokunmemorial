'use client';

import { useActionState, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitPhotograph, type FormState } from '@/lib/actions';
import { prepareForUpload, formatBytes } from '@/lib/imageResize';

function SendButton({ ready }: { ready: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || !ready} className="btn btn-primary">
      {pending ? 'Sending…' : 'Send the photograph'}
    </button>
  );
}

export default function PhotoContributeForm() {
  const [state, formAction] = useActionState(submitPhotograph, null as FormState);
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lastFile, setLastFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError('');
    setLastFile(file);
    setPreview(URL.createObjectURL(file));
    try {
      const prepared = await prepareForUpload(file);
      const body = new FormData();
      body.append('file', prepared);
      const response = await fetch('/api/upload/public', { method: 'POST', body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? 'The upload failed.');
      setUrl(data.url);
      setLastFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The upload failed.');
    } finally {
      setBusy(false);
    }
  };

  if (state?.ok) {
    return (
      <div className="rounded-sm border border-deep/25 bg-mist/50 px-6 py-10 text-center">
        <p className="font-display text-2xl">Thank you</p>
        <p className="mx-auto mt-3 max-w-md text-[0.98rem] text-ink/70">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="url" value={url} />
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
        className="rounded-sm border border-dashed border-ink/25 bg-mist/25 px-6 py-8 text-center transition-colors hover:border-deep/50"
      >
        {preview ? (
          <div className="space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="mx-auto max-h-56 rounded-sm object-contain" />
            <p className="font-util text-[0.75rem] text-ink/55">
              {busy ? 'Uploading…' : url ? 'Ready to send' : 'Not uploaded yet'}
              {lastFile && ` · ${formatBytes(lastFile.size)}`}
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-util text-[0.7rem] uppercase tracking-[0.11em] text-deep"
            >
              Choose a different photograph
            </button>
          </div>
        ) : (
          <>
            <p className="font-display text-lg">Choose a photograph</p>
            <p className="mt-1.5 text-[0.9rem] text-ink/55">
              JPG, PNG or WebP. Large pictures are resized automatically.
            </p>
            <button type="button" onClick={() => inputRef.current?.click()} className="btn btn-ghost mt-5">
              Browse
            </button>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
            event.target.value = '';
          }}
        />
      </div>

      {error && (
        <div className="space-y-2">
          <p className="text-[0.85rem] text-[#b00020]">{error}</p>
          {lastFile && (
            <button type="button" onClick={() => upload(lastFile)} className="btn btn-ghost">
              Try again
            </button>
          )}
        </div>
      )}

      <div>
        <label htmlFor="photo-name" className="field-label">
          Your name
        </label>
        <input id="photo-name" name="name" required maxLength={120} className="field" />
      </div>

      <div>
        <label htmlFor="photo-caption" className="field-label">
          What is happening in it?
        </label>
        <textarea
          id="photo-caption"
          name="caption"
          rows={3}
          maxLength={400}
          placeholder="Where it was taken, who is in it, roughly when…"
          className="field resize-y"
        />
      </div>

      {state && !state.ok && (
        <p role="alert" className="text-[0.85rem] text-[#b00020]">
          {state.message}
        </p>
      )}

      <SendButton ready={Boolean(url) && !busy} />
    </form>
  );
}
