import { createAppDb } from '@morgan-wrestling/db';
import { env } from '#/env';

export * from '@morgan-wrestling/db/schema';

/**
 * Builds a request-scoped app db. Call it inside a handler; never hoist the
 * result to module scope — a shared `@tursodatabase/serverless` connection
 * leaks its `AsyncLock` continuations across requests and hangs the Worker.
 * See `getAuth` in `@morgan-wrestling/auth/lib/auth` for the full mechanism.
 */
export function getDb() {
	return createAppDb(env.TURSO_CONNECTION_URL, env.TURSO_TOKEN);
}
