'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveChapter, type BioState } from '@/app/admin/biography-actions';
import RichTextEditor from '@/components/RichTextEditor';
import { ImageField } from './AdminForm';

export type ChapterRow = {
  id: number; heading: string; subheading: string; period_label: string; body: string; pull_quote: string;
  quote_attribution: string; image_url: string; image_alt: string; image_caption: string; focal_x: number;
  focal_y: number; layout: string; show_in_rail: boolean; status: string;
};

const LAYOUTS: Array<[string, string]> = [
  ['auto', 'Automatic (alternates left and right)'],
  ['image-left', 'Photograph on the left'],
  ['image-right', 'Photograph on the right'],
  ['full-width', 'Wide photograph above the text'],
  ['text-only', 'Text only (hide the photograph)'],
];

function Submit({ intent, label, primary }: { intent: 'draft' | 'publish'; label: string; primary?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="__intent"
      value={intent}
      disabled={pending}
      className={`rounded-full px-5 py-2.5 font-util text-[0.7rem] uppercase tracking-[0.12em] transition-colors disabled:opacity-50 ${
        primary ? 'bg-ink text-mist hover:bg-deep' : 'border border-ink/30 text-ink hover:bg-ink hover:text-mist'
      }`}
    >
      {pending ? 'Saving…' : label}
    </button>
  );
}

/** Add or edit one chapter. "Save as draft" keeps it hidden; "Publish" puts it on the About page. */
export default function ChapterForm({ chapter, onDoneReset }: { chapter?: ChapterRow; onDoneReset?: boolean }) {
  const [state, action] = useActionState<BioState, FormData>(saveChapter, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [fx, setFx] = useState(chapter?.focal_x ?? 50);
  const [fy, setFy] = useState(chapter?.focal_y ?? 50);
  const [img, setImg] = useState(chapter?.image_url ?? '');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (state?.ok && onDoneReset) {
      formRef.current?.reset();
      setDirty(false);
    }
    if (state?.ok) setDirty(false);
  }, [state, onDoneReset]);

  // Warn before leaving with unsaved changes (closing the tab, refreshing).
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return (
    <form ref={formRef} action={action} onChange={() => setDirty(true)} className="space-y-5">
      {chapter && <input type="hidden" name="__id" value={chapter.id} />}

      <div>
        <label htmlFor={`h-${chapter?.id ?? 'new'}`} className="field-label">Chapter title <span className="text-deep">*</span></label>
        <input id={`h-${chapter?.id ?? 'new'}`} name="heading" required maxLength={200} defaultValue={chapter?.heading ?? ''} className="field" placeholder="For example: Growing up in Ilora" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor={`p-${chapter?.id ?? 'new'}`}>Period or dates (optional)</label>
          <input id={`p-${chapter?.id ?? 'new'}`} name="period_label" maxLength={80} defaultValue={chapter?.period_label ?? ''} className="field" placeholder="For example: 1950 to 1970" />
        </div>
        <div>
          <label className="field-label" htmlFor={`s-${chapter?.id ?? 'new'}`}>One-line introduction (optional)</label>
          <input id={`s-${chapter?.id ?? 'new'}`} name="subheading" maxLength={300} defaultValue={chapter?.subheading ?? ''} className="field" />
        </div>
      </div>

      <div>
        <span className="field-label">The story <span className="text-deep">*</span></span>
        <RichTextEditor name="body" initialValue={chapter?.body ?? ''} placeholder="Write this chapter of his life" />
        <p className="mt-1.5 font-util text-[0.72rem] text-ink/45">Press Enter twice for a new paragraph. Only the family&rsquo;s own words go here.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor={`q-${chapter?.id ?? 'new'}`}>Pull quote (optional)</label>
          <textarea id={`q-${chapter?.id ?? 'new'}`} name="pull_quote" rows={3} maxLength={600} defaultValue={chapter?.pull_quote ?? ''} className="field resize-y" />
        </div>
        <div>
          <label className="field-label" htmlFor={`qa-${chapter?.id ?? 'new'}`}>Who said it (optional)</label>
          <input id={`qa-${chapter?.id ?? 'new'}`} name="quote_attribution" maxLength={160} defaultValue={chapter?.quote_attribution ?? ''} className="field" placeholder="For example: his daughter" />
        </div>
      </div>

      <div className="space-y-4 rounded-sm border border-ink/10 bg-mist/25 p-4">
        <div onChange={(e) => { const t = e.target as HTMLInputElement; if (t.name === 'image_url') setImg(t.value); }}>
          <ImageField field={{ name: 'image_url', label: 'Photograph (optional)', type: 'image', help: 'Pick the best photograph for this chapter.' }} defaultValue={chapter?.image_url ?? ''} />
        </div>

        {img && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor={`a-${chapter?.id ?? 'new'}`}>Describe the photograph (for people who cannot see it)</label>
              <input id={`a-${chapter?.id ?? 'new'}`} name="image_alt" maxLength={300} defaultValue={chapter?.image_alt ?? ''} className="field" />
              <label className="field-label mt-4" htmlFor={`c-${chapter?.id ?? 'new'}`}>Caption (optional)</label>
              <input id={`c-${chapter?.id ?? 'new'}`} name="image_caption" maxLength={400} defaultValue={chapter?.image_caption ?? ''} className="field" />
            </div>
            <div>
              <span className="field-label">Which part of the photo must stay in view?</span>
              <div className="relative overflow-hidden rounded-sm border border-ink/12 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="aspect-[4/5] max-h-52 w-full object-cover" style={{ objectPosition: `${fx}% ${fy}%` }} />
              </div>
              <label className="mt-3 block font-util text-[0.72rem] text-ink/55">Left to right
                <input type="range" name="focal_x" min={0} max={100} value={fx} onChange={(e) => setFx(Number(e.target.value))} className="mt-1 w-full" />
              </label>
              <label className="mt-2 block font-util text-[0.72rem] text-ink/55">Top to bottom
                <input type="range" name="focal_y" min={0} max={100} value={fy} onChange={(e) => setFy(Number(e.target.value))} className="mt-1 w-full" />
              </label>
            </div>
          </div>
        )}
        {!img && (<><input type="hidden" name="focal_x" value={50} /><input type="hidden" name="focal_y" value={50} /></>)}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor={`l-${chapter?.id ?? 'new'}`}>Layout</label>
          <select id={`l-${chapter?.id ?? 'new'}`} name="layout" defaultValue={chapter?.layout ?? 'auto'} className="field">
            {LAYOUTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-3 self-end pb-2.5 text-[0.95rem]">
          <input type="checkbox" name="show_in_rail" defaultChecked={chapter ? chapter.show_in_rail : true} className="h-4 w-4 accent-[var(--color-deep)]" />
          Show in the chapter list beside the story
        </label>
      </div>

      {state && (
        <p role={state.ok ? 'status' : 'alert'} className={`text-sm ${state.ok ? 'text-deep' : 'text-[#b00020]'}`}>{state.message}</p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 pt-5">
        <Submit intent="publish" label={chapter?.status === 'published' ? 'Save and keep published' : 'Publish'} primary />
        <Submit intent="draft" label={chapter?.status === 'published' ? 'Save as draft (hide)' : 'Save as draft'} />
        {dirty && <span className="font-util text-[0.72rem] text-[#8a4b00]">Unsaved changes</span>}
      </div>
    </form>
  );
}
