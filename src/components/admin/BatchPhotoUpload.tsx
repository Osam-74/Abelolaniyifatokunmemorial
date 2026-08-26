'use client';

import { useRef, useState, useTransition } from 'react';
import { savePhotoBatch } from '@/app/admin/actions';
import { prepareForUpload, formatBytes } from '@/lib/imageResize';

type Item = {
  key: string;
  name: string;
  preview: string;
  originalSize: number;
  finalSize: number;
  caption: string;
  takenOn: string;
  url: string;
  state: 'preparing' | 'uploading' | 'ready' | 'failed';
  error?: string;
};

export default function BatchPhotoUpload({ albums }: { albums: string[] }) {
  const [items, setItems] = useState<Item[]>([]);
  const [album, setAlbum] = useState(albums[0] ?? 'A Life Remembered');
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saving, startSaving] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const update = (key: string, patch: Partial<Item>) =>
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  /** Kept so a failed upload can be tried again without re-picking the file. */
  const [files, setFiles] = useState<Record<string, File>>({});

  const uploadOne = async (key: string, file: File) => {
    try {
      const prepared = await prepareForUpload(file);
      update(key, { state: 'uploading', finalSize: prepared.size, error: undefined });

      const body = new FormData();
      body.append('file', prepared);
      const response = await fetch('/api/upload', { method: 'POST', body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? 'The upload failed.');

      update(key, { state: 'ready', url: data.url });
    } catch (error) {
      update(key, {
        state: 'failed',
        error: error instanceof Error ? error.message : 'The upload failed.',
      });
    }
  };

  const retry = (key: string) => {
    const file = files[key];
    if (!file) return;
    update(key, { state: 'preparing', error: undefined });
    void uploadOne(key, file);
  };

  const retryAll = () => {
    for (const item of items) {
      if (item.state === 'failed') retry(item.key);
    }
  };

  const addFiles = async (files: FileList) => {
    setResult(null);
    const incoming = Array.from(files).slice(0, 40);

    const staged: Item[] = incoming.map((file, index) => ({
      key: `${Date.now()}-${index}-${file.name}`,
      name: file.name,
      preview: URL.createObjectURL(file),
      originalSize: file.size,
      finalSize: file.size,
      caption: '',
      takenOn: '',
      url: '',
      state: 'preparing',
    }));

    setItems((current) => [...current, ...staged]);
    setFiles((current) => {
      const next = { ...current };
      staged.forEach((item, i) => {
        next[item.key] = incoming[i];
      });
      return next;
    });

    // One at a time, so someone on a slow connection sees steady progress
    // rather than everything stalling at once.
    for (let i = 0; i < incoming.length; i += 1) {
      await uploadOne(staged[i].key, incoming[i]);
    }
  };

  const ready = items.filter((item) => item.state === 'ready');
  const working = items.some((item) => item.state === 'preparing' || item.state === 'uploading');

  const save = () => {
    startSaving(async () => {
      const outcome = await savePhotoBatch(
        ready.map((item) => ({
          url: item.url,
          caption: item.caption.trim(),
          album: album.trim() || 'A Life Remembered',
          takenOn: item.takenOn.trim(),
        }))
      );
      setResult(outcome);
      if (outcome.ok) setItems([]);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="batch-album" className="field-label">
          Album for this batch
        </label>
        <input
          id="batch-album"
          list="album-suggestions"
          value={album}
          onChange={(event) => setAlbum(event.target.value)}
          placeholder="Childhood, Family, Career…"
          className="field max-w-sm"
        />
        <datalist id="album-suggestions">
          {albums.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <p className="mt-1.5 font-util text-[0.72rem] text-ink/45">
          Every photograph in this batch goes into this album. You can move any of them later.
        </p>
      </div>

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
        }}
        className="rounded-sm border border-dashed border-ink/25 bg-mist/25 px-6 py-10 text-center transition-colors hover:border-deep/50"
      >
        <p className="font-display text-lg">Drop photographs here</p>
        <p className="mt-1.5 text-[0.9rem] text-ink/55">
          Choose as many as you like. Anything over 2&nbsp;MB is resized automatically before it uploads.
        </p>
        <button type="button" onClick={() => inputRef.current?.click()} className="btn btn-ghost mt-5">
          Choose photographs
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) addFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      {items.length > 0 && (
        <>
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.key}
                className="animate-[rise_.4s_cubic-bezier(.16,1,.3,1)_both] rounded-sm border border-ink/12 bg-white p-4"
              >
                <div className="flex gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.preview}
                    alt=""
                    className={`h-24 w-24 shrink-0 rounded-sm object-cover transition-opacity duration-500 ${
                      item.state === 'ready' ? 'opacity-100' : 'opacity-50'
                    }`}
                  />

                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="truncate font-util text-[0.78rem] text-ink/70">{item.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-util text-[0.6rem] uppercase tracking-[0.1em] ${
                          item.state === 'ready'
                            ? 'bg-deep/12 text-deep'
                            : item.state === 'failed'
                              ? 'bg-[#b00020]/10 text-[#b00020]'
                              : 'bg-flame/25 text-[#8a4b00]'
                        }`}
                      >
                        {item.state === 'preparing'
                          ? 'Resizing'
                          : item.state === 'uploading'
                            ? 'Uploading'
                            : item.state === 'ready'
                              ? 'Ready'
                              : 'Failed'}
                      </span>
                      <span className="font-util text-[0.68rem] text-ink/40">
                        {item.finalSize < item.originalSize
                          ? `${formatBytes(item.originalSize)} → ${formatBytes(item.finalSize)}`
                          : formatBytes(item.originalSize)}
                      </span>
                    </div>

                    {item.state === 'failed' ? (
                      <div className="space-y-2">
                        <p className="text-[0.82rem] leading-relaxed text-[#b00020]">{item.error}</p>
                        <button
                          type="button"
                          onClick={() => retry(item.key)}
                          className="rounded-full border border-ink/25 px-3.5 py-1.5 font-util text-[0.68rem] uppercase tracking-[0.1em] transition-colors hover:bg-ink hover:text-mist"
                        >
                          Try again
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-[1fr_10rem]">
                        <input
                          value={item.caption}
                          onChange={(event) => update(item.key, { caption: event.target.value })}
                          placeholder="Caption for this photograph"
                          className="field"
                        />
                        <input
                          value={item.takenOn}
                          onChange={(event) => update(item.key, { takenOn: event.target.value })}
                          placeholder="When taken"
                          className="field"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setItems((c) => c.filter((entry) => entry.key !== item.key))}
                    className="shrink-0 self-start font-util text-[0.66rem] uppercase tracking-[0.1em] text-ink/35 transition-colors hover:text-[#b00020]"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={save}
              disabled={saving || working || ready.length === 0}
              className="btn btn-primary"
            >
              {saving
                ? 'Adding…'
                : working
                  ? 'Waiting for uploads…'
                  : `Add ${ready.length} ${ready.length === 1 ? 'photograph' : 'photographs'}`}
            </button>
            {items.some((item) => item.state === 'failed') && (
              <button type="button" onClick={retryAll} className="btn btn-ghost">
                Retry {items.filter((item) => item.state === 'failed').length} failed
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setItems([]);
                setFiles({});
              }}
              className="font-util text-[0.7rem] uppercase tracking-[0.11em] text-ink/45 hover:text-ink"
            >
              Clear
            </button>
          </div>
        </>
      )}

      {result && (
        <p role="status" className={`font-util text-sm ${result.ok ? 'text-deep' : 'text-[#b00020]'}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
