'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { FieldDef } from '@/lib/collections';
import type { ActionState } from '@/app/admin/actions';
import { prepareForUpload } from '@/lib/imageResize';
import RichTextEditor from '@/components/RichTextEditor';

function ImageField({ field, defaultValue }: { field: FieldDef; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lastFile, setLastFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError('');
    setLastFile(file);
    try {
      const prepared = await prepareForUpload(file);
      const body = new FormData();
      body.append('file', prepared);
      const response = await fetch('/api/upload', { method: 'POST', body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? 'The upload failed.');
      setValue(data.url);
      setLastFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The upload failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label htmlFor={field.name} className="field-label">
        {field.label}
        {field.required && <span className="ml-1 text-deep">*</span>}
      </label>

      <div className="flex flex-wrap items-start gap-4">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="h-20 w-20 shrink-0 rounded-sm border border-ink/12 object-cover"
          />
        )}
        <div className="min-w-[240px] flex-1 space-y-2">
          <input
            id={field.name}
            name={field.name}
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="/images/photo.jpg  or  https://…"
            className="field"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="rounded-full border border-ink/25 px-3.5 py-1.5 font-util text-[0.68rem] uppercase tracking-[0.1em] transition-colors hover:bg-ink hover:text-mist disabled:opacity-50"
            >
              {busy ? 'Uploading…' : 'Upload a file'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => setValue('')}
                className="font-util text-[0.68rem] uppercase tracking-[0.1em] text-ink/45 hover:text-ink"
              >
                Remove
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,audio/mpeg"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload(file);
              event.target.value = '';
            }}
          />
          {error && (
            <div className="space-y-1.5">
              <p className="text-[0.8rem] leading-relaxed text-[#b00020]">{error}</p>
              {lastFile && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => upload(lastFile)}
                  className="rounded-full border border-ink/25 px-3 py-1 font-util text-[0.66rem] uppercase tracking-[0.1em] transition-colors hover:bg-ink hover:text-mist disabled:opacity-50"
                >
                  {busy ? 'Retrying…' : 'Try again'}
                </button>
              )}
            </div>
          )}
          {field.help && <p className="font-util text-[0.72rem] text-ink/45">{field.help}</p>}
        </div>
      </div>
    </div>
  );
}

/** <input type="date"> only accepts YYYY-MM-DD. */
function toDateInputValue(value: unknown): string {
  if (!value) return '';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    // Use the local calendar date, not UTC, so a date never shifts a day back.
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) return text.slice(0, 10);
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return '';
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${parsed.getFullYear()}-${month}-${day}`;
}

function Field({ field, value }: { field: FieldDef; value: unknown }) {
  const stringValue =
    value === null || value === undefined
      ? ''
      : value instanceof Date
        ? toDateInputValue(value)
        : Array.isArray(value)
          ? value.join(', ')
          : String(value);

  if (field.type === 'image') return <ImageField field={field} defaultValue={stringValue} />;

  if (field.type === 'richtext') {
    return (
      <div>
        <label className="field-label">
          {field.label}
          {field.required && <span className="ml-1 text-deep">*</span>}
        </label>
        <RichTextEditor name={field.name} initialValue={stringValue} />
        {field.help && <p className="mt-1.5 font-util text-[0.72rem] text-ink/45">{field.help}</p>}
      </div>
    );
  }

  if (field.type === 'boolean') {
    return (
      <label className="flex cursor-pointer items-center gap-3 rounded-sm border border-ink/12 bg-white px-4 py-3">
        <input
          type="checkbox"
          name={field.name}
          defaultChecked={value === true || value === 'true'}
          className="h-4 w-4 accent-[#0077B6]"
        />
        <span className="font-util text-sm">{field.label}</span>
      </label>
    );
  }

  return (
    <div>
      <label htmlFor={field.name} className="field-label">
        {field.label}
        {field.required && <span className="ml-1 text-deep">*</span>}
      </label>

      {field.type === 'select' ? (
        <select id={field.name} name={field.name} defaultValue={stringValue} className="field">
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option[0].toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
      ) : field.type === 'textarea' || field.type === 'longtext' ? (
        <textarea
          id={field.name}
          name={field.name}
          defaultValue={stringValue}
          rows={field.type === 'longtext' ? 10 : 4}
          placeholder={field.placeholder}
          className="field resize-y font-body"
        />
      ) : (
        <input
          id={field.name}
          name={field.name}
          type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
          defaultValue={field.type === 'date' ? toDateInputValue(value) : stringValue}
          placeholder={field.placeholder}
          className="field"
        />
      )}

      {field.help && <p className="mt-1.5 font-util text-[0.72rem] text-ink/45">{field.help}</p>}
    </div>
  );
}

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary">
      {pending ? 'Saving…' : label}
    </button>
  );
}

export default function AdminForm({
  action,
  fields,
  values = {},
  hidden = {},
  submitLabel = 'Save changes',
  onDoneReset = false,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  fields: FieldDef[];
  values?: Record<string, unknown>;
  hidden?: Record<string, string>;
  submitLabel?: string;
  onDoneReset?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (onDoneReset && state?.ok) formRef.current?.reset();
  }, [onDoneReset, state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => (
          <div
            key={field.name}
            className={field.half && field.type !== 'image' ? 'sm:col-span-1' : 'sm:col-span-2'}
          >
            <Field field={field} value={values[field.name]} />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <SaveButton label={submitLabel} />
        {state && (
          <p
            role="status"
            className={`font-util text-sm ${state.ok ? 'text-deep' : 'text-[#b00020]'}`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
