import { notFound } from 'next/navigation';
import AdminForm from '@/components/admin/AdminForm';
import Disclosure from '@/components/admin/Disclosure';
import BatchPhotoUpload from '@/components/admin/BatchPhotoUpload';
import PhotoCaptionEditor, { type PhotoRow } from '@/components/admin/PhotoCaptionEditor';
import { DeleteButton, FeatureToggle, StatusButtons } from '@/components/admin/RowActions';
import { saveRow } from '../actions';
import { findCollection } from '@/lib/collections';
import { safeQuery, formatDate } from '@/lib/content';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  return { title: findCollection(collection)?.label ?? 'Admin', robots: { index: false } };
}

type Row = Record<string, unknown> & { id: number };

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection: slug } = await params;
  const collection = findCollection(slug);
  if (!collection) notFound();

  const rows = await safeQuery<Row>(
    `SELECT * FROM ${collection.table} ORDER BY ${collection.orderBy}`
  );

  const statusLabel: Record<string, string> = {
    pending: 'Waiting for you',
    approved: 'Published',
    rejected: 'Rejected',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">{collection.label}</h1>
        <p className="mt-2 max-w-2xl text-ink/60">{collection.description}</p>
      </div>

      {collection.slug === 'photos' && (
        <Disclosure
          defaultOpen
          summary={<span className="font-display text-lg">Upload several photographs at once</span>}
        >
          <BatchPhotoUpload
            albums={Array.from(
              new Set(rows.map((row) => String(row.album ?? '')).filter(Boolean))
            )}
          />
        </Disclosure>
      )}

      {collection.slug === 'photos' && rows.length > 0 && (
        <Disclosure
          summary={<span className="font-display text-lg">Captions and albums</span>}
        >
          <PhotoCaptionEditor photos={rows as unknown as PhotoRow[]} />
        </Disclosure>
      )}

      <Disclosure
        summary={
          <span className="font-display text-lg">
            {collection.slug === 'photos' ? 'Add one photograph' : `Add a new ${collection.singular}`}
          </span>
        }
      >
        <AdminForm
          action={saveRow}
          fields={collection.fields.filter((f) => f.name !== 'slug')}
          hidden={{ __collection: collection.slug }}
          submitLabel={`Add ${collection.singular}`}
          onDoneReset
        />
      </Disclosure>

      {rows.length === 0 ? (
        <div className="rounded-sm border border-dashed border-ink/20 bg-paper px-6 py-12 text-center">
          <p className="font-display text-lg text-ink/75">
            No {collection.label.toLowerCase()} yet
          </p>
          <p className="mt-1.5 text-[0.9rem] text-ink/50">
            Use the panel above to add the first one.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const title = String(row[collection.titleField] ?? '').trim();
            const subtitle = (collection.subtitleFields ?? [])
              .map((field) => String(row[field] ?? '').trim())
              .filter(Boolean)
              .join(' · ');
            const status = String(row.status ?? '');

            return (
              <div key={row.id} className="rounded-sm border border-ink/12 bg-white">
                <Disclosure
                  tone="plain"
                  summary={
                    <span className="block">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-display text-lg leading-snug">
                          {title.length > 90 ? `${title.slice(0, 90)}…` : title || `Untitled ${collection.singular}`}
                        </span>
                        {status && (
                          <span
                            className={`rounded-full px-2.5 py-0.5 font-util text-[0.6rem] uppercase tracking-[0.1em] ${
                              status === 'approved'
                                ? 'bg-deep/12 text-deep'
                                : status === 'rejected'
                                  ? 'bg-ink/10 text-ink/50'
                                  : 'bg-flame/25 text-[#8a4b00]'
                            }`}
                          >
                            {statusLabel[status] ?? status}
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block font-util text-[0.72rem] text-ink/45">
                        {[subtitle, row.created_at ? formatDate(String(row.created_at)) : '']
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                  }
                >
                  <div className="space-y-6">
                    {(collection.moderated || 'featured' in row) && (
                      <div className="flex flex-wrap items-center gap-3 border-b border-ink/10 pb-5">
                        {collection.moderated && (
                          <StatusButtons slug={collection.slug} id={row.id} status={status} />
                        )}
                        {'featured' in row && (
                          <FeatureToggle
                            slug={collection.slug}
                            id={row.id}
                            value={row.featured === true}
                          />
                        )}
                        <span className="ml-auto">
                          <DeleteButton slug={collection.slug} id={row.id} label={collection.singular} />
                        </span>
                      </div>
                    )}

                    <AdminForm
                      action={saveRow}
                      fields={collection.fields}
                      values={row}
                      hidden={{ __collection: collection.slug, __id: String(row.id) }}
                    />

                    {!collection.moderated && !('featured' in row) && (
                      <div className="border-t border-ink/10 pt-4">
                        <DeleteButton slug={collection.slug} id={row.id} label={collection.singular} />
                      </div>
                    )}
                  </div>
                </Disclosure>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
