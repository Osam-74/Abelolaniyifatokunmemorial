import { Pool, type QueryResultRow } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __memorialPool: Pool | undefined;
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

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
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
