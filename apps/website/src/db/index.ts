import { createAppDb } from '@morgan-wrestling/db';
import { env } from '#/env';

export * from '@morgan-wrestling/db/schema';

type AppDb = ReturnType<typeof createAppDb>;

/**
 * The reading half of the drizzle surface, and nothing else. `insert`,
 * `update`, `delete`, `run` and `transaction` are absent from this type, so a
 * write in this app is a compile error rather than a runtime failure.
 *
 * `with` is deliberately not included: the object it returns carries its own
 * `insert`/`update`/`delete`, so re-exposing it would hand back the whole write
 * path through the back door. That costs us CTEs — if a query ever genuinely
 * needs one, add a narrowed wrapper that forwards only `with(...).select`,
 * rather than widening this type.
 */
export type ReadonlyDb = Pick<AppDb, 'select' | 'selectDistinct' | '$count'>;

/**
 * Builds a request-scoped, read-only app db. Call it inside a handler; never
 * hoist the result to module scope — a shared `@tursodatabase/serverless`
 * connection leaks its `AsyncLock` continuations across requests and hangs the
 * Worker. See `getAuth` in `@morgan-wrestling/auth/lib/auth` for the full
 * mechanism.
 *
 * The narrowed return type is the second of four read-only layers; the one
 * that actually holds is the read-only Turso token behind it.
 */
export function getDb(): ReadonlyDb {
	return createAppDb(env.TURSO_CONNECTION_URL, env.TURSO_TOKEN);
}
