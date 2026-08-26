'use client';

import { useEffect, useState, useTransition } from 'react';
import { savePhotoCaptions, deleteRow, setStatus } from '@/app/admin/actions';

export type PhotoRow = {
  id: number;
  url: string;
  caption: string;
  album: string;
  taken_on: string;
  status?: string;
  submitted_by?: string;
};

type Draft = {
  id: number;
  url: string;
  caption: string;
  album: string;
  takenOn: string;
  status: string;
  submittedBy: string;
};

/**
 * A dense grid of every photograph. Clicking one opens it for editing, so
 * captions can be added or corrected long after the pictures went up without
 * scrolling past a wall of storage URLs.
 */
export default function PhotoCaptionEditor({ photos }: { photos: PhotoRow[] }) {
  const [rows, setRows] = useState<Draft[]>(() =>
    photos.map((photo) => ({
      id: photo.id,
      url: photo.url,
      caption: photo.caption ?? '',
      album: photo.album ?? '',
      takenOn: photo.taken_on ?? '',
      status: photo.status ?? 'approved',
      submittedBy: photo.submitted_by ?? '',
    }))
  );
  const [openId, setOpenId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'missing' | 'pending'>('all');
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saving, startSaving] = useTransition();

  const open = rows.find((row) => row.id === openId) ?? null;

  useEffect(() => {
    if (openId === null) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpenId(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openId]);

  const patch = (id: number, changes: Partial<Draft>) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...changes } : row)));

  const visible = rows.filter((row) => {
    if (filter === 'missing') return !row.caption.trim();
    if (filter === 'pending') return row.status === 'pending';
    return true;
  });

  const missing = rows.filter((row) => !row.caption.trim()).length;
  const pending = rows.filter((row) => row.status === 'pending').length;

  const saveOne = (row: Draft) => {
    startSaving(async () => {
      const outcome = await savePhotoCaptions([
        { id: row.id, caption: row.caption, album: row.album, takenOn: row.takenOn },
      ]);
      setResult(outcome);
      if (outcome.ok) setOpenId(null);
    });
  };

  const remove = (row: Draft) => {
    if (!confirm('Remove this photograph? This cannot be undone.')) return;
    startSaving(async () => {
      await deleteRow('photos', row.id);
      setRows((current) => current.filter((entry) => entry.id !== row.id));
      setOpenId(null);
      setResult({ ok: true, message: 'Photograph removed.' });
    });
  };

  if (rows.length === 0) return <p className="text-[0.92rem] text-ink/55">No photographs yet.</p>;

  const filters = [
    { id: 'all' as const, label: `All ${rows.length}` },
    { id: 'missing' as const, label: `No caption ${missing}` },
    { id: 'pending' as const, label: `Awaiting approval ${pending}` },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {filters.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setFilter(option.id)}
            className={`rounded-full border px-3.5 py-1.5 font-util text-[0.68rem] uppercase tracking-[0.1em] transition-colors ${
              filter === option.id
                ? 'border-ink bg-ink text-mist'
                : 'border-ink/20 text-ink/60 hover:border-ink/45 hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
        {visible.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => setOpenId(row.id)}
              className="group block w-full text-left"
            >
              <span
                className={`relative block aspect-square overflow-hidden rounded-sm border bg-mist/40 transition-colors ${
                  row.status === 'pending' ? 'border-flame' : 'border-ink/12 group-hover:border-deep'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={row.url} alt="" className="h-full w-full object-cover" />
                {row.status === 'pending' && (
                  <span className="absolute inset-x-0 bottom-0 bg-flame/90 py-0.5 text-center font-util text-[0.55rem] uppercase tracking-[0.08em] text-ink">
                    Waiting
                  </span>
                )}
              </span>
              <span
                className={`mt-1 block truncate font-util text-[0.66rem] leading-tight ${
                  row.caption.trim() ? 'text-ink/60' : 'text-flame'
                }`}
              >
                {row.caption.trim() || 'No caption'}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="rounded-sm border border-ink/12 bg-mist/30 px-5 py-8 text-center text-[0.9rem] text-ink/55">
          Nothing here.
        </p>
      )}

      {result && (
        <p className={`font-util text-sm ${result.ok ? 'text-deep' : 'text-[#b00020]'}`}>
          {result.message}
        </p>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit photograph"
          className="fixed inset-0 z-[80] grid place-items-center bg-ink/80 p-4 backdrop-blur-sm"
          onClick={() => setOpenId(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-sm bg-paper p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-xl">Photograph</h3>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="font-util text-[0.68rem] uppercase tracking-[0.1em] text-ink/45 hover:text-ink"
              >
                Close
              </button>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={open.url}
              alt=""
              className="mt-5 max-h-[45vh] w-full rounded-sm bg-mist/40 object-contain"
            />

            {open.submittedBy && (
              <p className="mt-3 font-util text-[0.75rem] text-ink/50">Sent in by {open.submittedBy}</p>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="modal-caption" className="field-label">
                  Caption
                </label>
                <input
                  id="modal-caption"
                  value={open.caption}
                  onChange={(event) => patch(open.id, { caption: event.target.value })}
                  className="field"
                  autoFocus
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="modal-album" className="field-label">
                    Album
                  </label>
                  <input
                    id="modal-album"
                    value={open.album}
                    onChange={(event) => patch(open.id, { album: event.target.value })}
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor="modal-taken" className="field-label">
                    When taken
                  </label>
                  <input
                    id="modal-taken"
                    value={open.takenOn}
                    onChange={(event) => patch(open.id, { takenOn: event.target.value })}
                    className="field"
                  />
                </div>
              </div>
            </div>

            {open.status !== 'approved' && (
              <div className="mt-5 rounded-sm border border-flame/50 bg-flame/10 px-4 py-3">
                <p className="font-util text-[0.8rem] text-ink/75">
                  This photograph is waiting for you. It is not on the website yet.
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {(['approved', 'pending', 'rejected'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={saving || open.status === value}
                  onClick={() =>
                    startSaving(async () => {
                      await setStatus('photos', open.id, value);
                      patch(open.id, { status: value });
                      setResult({
                        ok: true,
                        message:
                          value === 'approved'
                            ? 'Published to the gallery.'
                            : value === 'rejected'
                              ? 'Rejected.'
                              : 'Held back.',
                      });
                    })
                  }
                  className={`rounded-full border px-3.5 py-1.5 font-util text-[0.66rem] uppercase tracking-[0.1em] transition-colors ${
                    open.status === value
                      ? 'border-deep bg-deep text-mist'
                      : 'border-ink/20 text-ink/60 hover:border-ink hover:text-ink'
                  }`}
                >
                  {value === 'approved' ? 'Published' : value === 'pending' ? 'Hold' : 'Reject'}
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => saveOne(open)}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => remove(open)}
                disabled={saving}
                className="ml-auto font-util text-[0.68rem] uppercase tracking-[0.1em] text-ink/40 transition-colors hover:text-[#b00020]"
              >
                Remove photograph
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
