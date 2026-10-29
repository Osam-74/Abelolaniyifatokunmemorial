import 'server-only';
import { query, hasDatabase } from './db';

/**
 * Records who changed what. Best-effort by design: an audit-log failure must
 * never block or undo the edit it describes, so errors are logged and swallowed.
 * Details are short plain text; no passwords or tokens ever go in here.
 */
export async function audit(adminEmail: string, action: string, entity: string, entityId: string | number, detail = ''): Promise<void> {
  if (!hasDatabase()) return;
  try {
    await query(
      `INSERT INTO admin_audit_log (admin_email, action, entity, entity_id, detail) VALUES ($1, $2, $3, $4, $5)`,
      [adminEmail.slice(0, 200), action.slice(0, 60), entity.slice(0, 60), String(entityId).slice(0, 60), detail.slice(0, 400)]
    );
    if (Math.random() < 0.02) {
      void query(`DELETE FROM admin_audit_log WHERE created_at < now() - interval '1 year'`).catch(() => undefined);
    }
  } catch (error) {
    console.error('[audit] could not record entry:', error instanceof Error ? error.message : error);
  }
}
