'use client';

import { useEffect, useRef, useState } from 'react';
import { submitPhotograph } from '@/lib/actions';
import { prepareForUpload } from '@/lib/imageResize';

type Stage = 'idle' | 'uploading' | 'ready' | 'sending' | 'done' | 'failed';

/**
 * Opens the device photo picker straight away. Only once a picture is chosen
 * does anything else appear, so contributing is one tap from the sidebar.
 */
export default function ContributePhotoButton() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [preview, setPreview] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');

  const openDialog = stage !== 'idle';

  useEffect(() => {
    if (!openDialog) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && reset();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [openDialog]);

  const reset = () => {
    setStage('idle');
    setPreview('');
    setUrl('');
    setFile(null);
    setCaption('');
    setError('');
  };

  const upload = async (chosen: File) => {
    setFile(chosen);
    setError('');
    setStage('uploading');
    setPreview(URL.createObjectURL(chosen));
    try {
      const prepared = await prepareForUpload(chosen);
      const body = new FormData();
      body.append('file', prepared);
      const response = await fetch('/api/upload/public', { method: 'POST', body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? 'The upload failed.');
      setUrl(data.url);
      setStage('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The upload failed.');
      setStage('failed');
    }
  };

  const send = async () => {
    if (!url || !name.trim()) {
      setError('Please add your name.');
      return;
    }
    setStage('sending');
    setError('');
    const form = new FormData();
    form.append('url', url);
    form.append('name', name.trim());
    form.append('caption', caption.trim());
    const outcome = await submitPhotograph(null, form);
    if (outcome?.ok) {
      setStage('done');
    } else {
      setError(outcome?.message ?? 'That could not be sent.');
      setStage('ready');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="btn btn-primary mt-2 w-full"
      >
        Add a photograph
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const chosen = event.target.files?.[0];
          if (chosen) upload(chosen);
          event.target.value = '';
        }}
      />

      {openDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add a photograph"
          className="fixed inset-0 z-[80] grid place-items-center bg-ink/85 p-4 backdrop-blur-sm"
          onClick={reset}
        >
          <div
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-sm bg-paper p-6"
            onClick={(event) => event.stopPropagation()}
          >
            {stage === 'done' ? (
              <div className="text-center">
                <p className="font-display text-2xl">Thank you</p>
                <p className="mx-auto mt-3 max-w-xs text-[0.95rem] leading-relaxed text-ink/70">
                  Your photograph has been sent to the family. It will join the gallery once they
                  have seen it.
                </p>
                <button type="button" onClick={reset} className="btn btn-primary mt-7">
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-display text-xl">Add a photograph</h2>
                  <button
                    type="button"
                    onClick={reset}
                    className="font-util text-[0.68rem] uppercase tracking-[0.1em] text-ink/45 hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>

                {preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt=""
                    className="mt-5 max-h-56 w-full rounded-sm bg-mist/40 object-contain"
                  />
                )}

                <p className="mt-3 font-util text-[0.72rem] text-ink/50">
                  {stage === 'uploading' && 'Uploading…'}
                  {stage === 'ready' && 'Ready to send'}
                  {stage === 'sending' && 'Sending…'}
                  {stage === 'failed' && 'Upload failed'}
                </p>

                {stage === 'failed' && (
                  <div className="mt-2 space-y-2">
                    <p className="text-[0.85rem] text-[#b00020]">{error}</p>
                    {file && (
                      <button type="button" onClick={() => upload(file)} className="btn btn-ghost">
                        Try again
                      </button>
                    )}
                  </div>
                )}

                {(stage === 'ready' || stage === 'sending') && (
                  <div className="mt-5 space-y-4">
                    <div>
                      <label htmlFor="contrib-name" className="field-label">
                        Your name
                      </label>
                      <input
                        id="contrib-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        maxLength={120}
                        className="field"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label htmlFor="contrib-caption" className="field-label">
                        What is happening in it?
                      </label>
                      <textarea
                        id="contrib-caption"
                        value={caption}
                        onChange={(event) => setCaption(event.target.value)}
                        rows={3}
                        maxLength={400}
                        placeholder="Where, who is in it, roughly when…"
                        className="field resize-y"
                      />
                    </div>

                    {error && <p className="text-[0.85rem] text-[#b00020]">{error}</p>}

                    <button
                      type="button"
                      onClick={send}
                      disabled={stage === 'sending'}
                      className="btn btn-primary w-full"
                    >
                      {stage === 'sending' ? 'Sending…' : 'Send to the family'}
                    </button>
                    <p className="text-center font-util text-[0.7rem] leading-relaxed text-ink/45">
                      The family sees every photograph before it appears.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
