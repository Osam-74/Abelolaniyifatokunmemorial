import { Pool, type QueryResultRow } from 'pg';
import { SCHEMA_SQL } from './schemaSql';

declare global {
  // eslint-disable-next-line no-var
  var __memorialPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __memorialSchemaRun: Promise<void> | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Add a Postgres connection string to your environment variables.'
    );
  }
  const disableSsl = /sslmode=disable/.test(connectionString);
  // Strip sslmode so node-postgres stops warning about mode aliasing; TLS is
  // configured explicitly below instead.
  const cleaned = connectionString.replace(/([?&])sslmode=[^&]*(&|$)/, (_m, prefix, tail) =>
    tail === '&' ? prefix : ''
  );

  return new Pool({
    connectionString: cleaned,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ssl: disableSsl ? false : { rejectUnauthorized: false },
  });
}

export function getPool(): Pool {
  if (!global.__memorialPool) global.__memorialPool = createPool();
  return global.__memorialPool;
}

/**
 * Applies the schema. Everything in it is CREATE IF NOT EXISTS or ADD COLUMN
 * IF NOT EXISTS, so this is safe to run repeatedly and never touches content.
 */
export async function ensureSchema(): Promise<void> {
  if (!global.__memorialSchemaRun) {
    global.__memorialSchemaRun = getPool()
      .query(SCHEMA_SQL)
      .then(() => undefined)
      .catch((error) => {
        // Let the next request try again rather than caching a failure.
        global.__memorialSchemaRun = undefined;
        throw error;
      });
  }
  return global.__memorialSchemaRun;
}

function isMissingStructure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /column .* does not exist|relation .* does not exist|undefined column|undefined table/i.test(
    message
  );
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  try {
    const result = await getPool().query<T>(text, params);
    return result.rows;
  } catch (error) {
    if (!isMissingStructure(error)) throw error;

    // A deploy has added a table or column that this database does not have
    // yet. Apply the schema and try once more, so the site heals itself
    // instead of quietly returning nothing.
    console.warn('[db] Missing structure detected; applying schema and retrying.');
    await ensureSchema();
    const result = await getPool().query<T>(text, params);
    return result.rows;
  }
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** True when the site has a database configured. Lets pages render gracefully pre-setup. */
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
