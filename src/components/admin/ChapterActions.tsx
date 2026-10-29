'use client';

import { useState, useTransition } from 'react';
import {
  moveChapter, setChapterStatus, trashChapter, restoreChapter, duplicateChapter, purgeChapter, restoreRevision,
  type BioState,
} from '@/app/admin/biography-actions';

const btn = 'rounded-full border border-ink/25 px-3 py-1.5 font-util text-[0.66rem] uppercase tracking-[0.1em] transition-colors hover:bg-ink hover:text-mist disabled:opacity-40';

export function ChapterToolbar({
  id, status, first, last, previewHref,
}: { id: number; status: string; first: boolean; last: boolean; previewHref: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={btn} disabled={pending || first} onClick={() => start(() => moveChapter(id, 'up'))} aria-label="Move this chapter earlier">↑ Earlier</button>
      <button type="button" className={btn} disabled={pending || last} onClick={() => start(() => moveChapter(id, 'down'))} aria-label="Move this chapter later">↓ Later</button>
      <button type="button" className={btn} disabled={pending} onClick={() => start(() => setChapterStatus(id, status === 'published' ? 'draft' : 'published'))}>
        {status === 'published' ? 'Hide (make draft)' : 'Publish'}
      </button>
      <a className={btn} href={previewHref} target="_blank" rel="noopener noreferrer">Preview ↗</a>
      <button type="button" className={btn} disabled={pending} onClick={() => start(() => duplicateChapter(id))}>Duplicate</button>
      <button
        type="button"
        className={`${btn} hover:!bg-[#b00020] hover:!border-[#b00020]`}
        disabled={pending}
        onClick={() => { if (window.confirm('Move this chapter to the trash? You can bring it back from there.')) start(() => trashChapter(id)); }}
      >
        Move to trash
      </button>
    </div>
  );
}

export function TrashToolbar({ id }: { id: number }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<BioState>(null);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} disabled={pending} onClick={() => start(() => restoreChapter(id))}>Bring back (as a draft)</button>
        <button
          type="button"
          className={`${btn} hover:!bg-[#b00020] hover:!border-[#b00020]`}
          disabled={pending}
          onClick={() => {
            if (!window.confirm('Delete this chapter permanently? This cannot be undone.')) return;
            start(async () => setMsg(await purgeChapter(id)));
          }}
        >
          Delete permanently
        </button>
      </div>
      {msg && <p role="alert" className={`text-sm ${msg.ok ? 'text-deep' : 'text-[#b00020]'}`}>{msg.message}</p>}
    </div>
  );
}

export type Revision = { id: number; created_at: string; saved_by: string; heading: string };

export function RevisionList({ revisions }: { revisions: Revision[] }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<BioState>(null);
  if (revisions.length === 0) return <p className="text-sm text-ink/50">No earlier versions yet. One is saved each time you change this chapter.</p>;
  return (
    <div className="space-y-2">
      <ul className="divide-y divide-ink/10 rounded-sm border border-ink/10 bg-white">
        {revisions.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
            <span className="text-[0.88rem]">
              {new Date(r.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
              <span className="ml-2 text-ink/45">{r.saved_by ? `by ${r.saved_by}` : ''}</span>
            </span>
            <button
              type="button"
              className={btn}
              disabled={pending}
              onClick={() => {
                if (!window.confirm('Go back to this version? Your current text is kept in the history too.')) return;
                start(async () => setMsg(await restoreRevision(r.id)));
              }}
            >
              Go back to this version
            </button>
          </li>
        ))}
      </ul>
      {msg && <p role="alert" className={`text-sm ${msg.ok ? 'text-deep' : 'text-[#b00020]'}`}>{msg.message}</p>}
    </div>
  );
}
