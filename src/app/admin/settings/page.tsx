import AdminForm from '@/components/admin/AdminForm';
import Disclosure from '@/components/admin/Disclosure';
import { saveSettings } from '../actions';
import { SETTING_GROUPS } from '@/lib/collections';
import { getSetting } from '@/lib/content';
import { mailProvider, notifyRecipients } from '@/lib/mail';
import { TestEmailButton } from '@/components/admin/ToolButtons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Website settings', robots: { index: false } };

export default async function SettingsPage() {
  const groups = await Promise.all(
    SETTING_GROUPS.map(async (group) => ({
      ...group,
      values: await getSetting<Record<string, unknown>>(group.key),
    }))
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Website settings</h1>
        <p className="mt-2 max-w-2xl text-ink/60">
          His name and dates, the wording on the homepage, the music, and how the memorial appears
          when the link is shared.
        </p>
      </div>

      <div className="space-y-3">
        {groups.map((group, index) => (
          <div key={group.key} id={group.key}>
            <Disclosure
              defaultOpen={index === 0}
              summary={
                <span className="block">
                  <span className="font-display text-lg">{group.label}</span>
                  <span className="mt-0.5 block text-[0.85rem] text-ink/50">{group.description}</span>
                </span>
              }
            >
              <AdminForm
                action={saveSettings}
                fields={group.fields}
                values={group.values}
                hidden={{ __key: group.key }}
              />
            </Disclosure>
          </div>
        ))}

        <div id="email">
          <Disclosure
            summary={
              <span className="block">
                <span className="font-display text-lg">Email notices</span>
                <span className="mt-0.5 block text-[0.85rem] text-ink/50">Be told when someone leaves a tribute, memory or photograph.</span>
              </span>
            }
          >
            <div className="space-y-4 text-[0.92rem] leading-relaxed text-ink/70">
              <p>
                {mailProvider() === 'none'
                  ? 'Email is not connected yet. Tributes still arrive and wait in the admin area; connecting email only adds the notification.'
                  : `Email is connected (${mailProvider()}).`}
              </p>
              <p>
                Notices go to: <strong>{notifyRecipients().join(', ') || 'nobody yet'}</strong>. To change who is told, change
                ADMIN_EMAILS in Vercel. The sender account and password are also set in Vercel, never here, so they stay private.
              </p>
              <TestEmailButton />
            </div>
          </Disclosure>
        </div>
      </div>
    </div>
  );
}
