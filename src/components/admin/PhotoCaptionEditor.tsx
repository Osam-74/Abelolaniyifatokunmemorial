'use client';

import { useState, useTransition } from 'react';
import { savePhotoCaptions } from '@/app/admin/actions';

export type PhotoRow = {
  id: number;
  url: string;
  caption: string;
  album: string;
  taken_on: string;
};

/**
 * A grid of every photograph with its caption inline, so captions can be
 * added or corrected long after the photographs went up, without opening
 * each record one at a time.
 */
export default function PhotoCaptionEditor({ photos }: { photos: PhotoRow[] }) {
  const [rows, setRows] = useState(() =>
    photos.map((photo) => ({
      id: photo.id,
      url: photo.url,
      caption: photo.caption ?? '',
      album: photo.album ?? '',
      takenOn: photo.taken_on ?? '',
    }))
  );
  const [dirty, setDirty] = useState<Set<number>>(new Set());
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saving, startSaving] = useTransition();

  const update = (id: number, patch: Partial<(typeof rows)[number]>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    setDirty((current) => new Set(current).add(id));
    setResult(null);
  };

  const visible = onlyMissing ? rows.filter((row) => !row.caption.trim()) : rows;
  const missingCount = rows.filter((row) => !row.caption.trim()).length;

  const save = () => {
    const changed = rows.filter((row) => dirty.has(row.id));
    if (changed.length === 0) return;
    startSaving(async () => {
      const outcome = await savePhotoCaptions(
        changed.map(({ id, caption, album, takenOn }) => ({ id, caption, album, takenOn }))
      );
      setResult(outcome);
      if (outcome.ok) setDirty(new Set());
    });
  };

  if (rows.length === 0) {
    return <p className="text-[0.92rem] text-ink/55">No photographs yet.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2.5 font-util text-[0.8rem] text-ink/70">
          <input
            type="checkbox"
            checked={onlyMissing}
            onChange={(event) => setOnlyMissing(event.target.checked)}
            className="h-4 w-4 accent-[#0077B6]"
          />
          Only show photographs without a caption
          {missingCount > 0 && <span className="text-ink/45">({missingCount})</span>}
        </label>

        {dirty.size > 0 && (
          <span className="font-util text-[0.75rem] text-deep">
            {dirty.size} unsaved {dirty.size === 1 ? 'change' : 'changes'}
          </span>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-sm border border-ink/12 bg-mist/30 px-5 py-8 text-center text-[0.92rem] text-ink/55">
          Every photograph has a caption.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((row) => (
            <li
              key={row.id}
              className={`flex gap-4 rounded-sm border bg-white p-3 transition-colors ${
                dirty.has(row.id) ? 'border-deep/40' : 'border-ink/12'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={row.url} alt="" className="h-20 w-20 shrink-0 rounded-sm object-cover" />
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  value={row.caption}
                  onChange={(event) => update(row.id, { caption: event.target.value })}
                  placeholder="Caption for this photograph"
                  className="field"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={row.album}
                    onChange={(event) => update(row.id, { album: event.target.value })}
                    placeholder="Album"
                    className="field"
                  />
                  <input
                    value={row.takenOn}
                    onChange={(event) => update(row.id, { takenOn: event.target.value })}
                    placeholder="When taken"
                    className="field"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={saving || dirty.size === 0}
          className="btn btn-primary"
        >
          {saving ? 'Saving…' : dirty.size === 0 ? 'No changes to save' : `Save ${dirty.size}`}
        </button>
        {result && (
          <p className={`font-util text-sm ${result.ok ? 'text-deep' : 'text-[#b00020]'}`}>
            {result.message}
          </p>
        )}
      </div>
    </div>
  );
}
