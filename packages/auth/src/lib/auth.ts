import { createAuth, createAuthDb } from '@morgan-wrestling/auth';

/**
 * Builds an auth instance — and with it a fresh Turso connection — scoped to the
 * caller's request. Call it inside a handler; never hoist the result to module
 * scope.
 *
 * `@tursodatabase/serverless` serializes every `prepare()`/`run()` on a
 * per-`Connection` `AsyncLock`. A module-scope connection shares that lock
 * across requests, and the lock hands a `resolve` callback over request
 * boundaries: request B queues its continuation, then request A's `finally`
 * releases it. The Workers runtime refuses to run a continuation created in an
 * already-finished request ("a promise was resolved ... from a different request
 * context") and cancels it, so B waits on a promise that never settles until
 * the runtime kills the request as hung.
 *
 * The previous `drizzle-orm/libsql` driver issued each query as an independent
 * HTTP call with no shared lock, which is why the old singleton was safe.
 */
export function getAuth() {
	const authDb = createAuthDb(
		process.env.TURSO_BETTER_AUTH_CONNECTION_URL ?? '',
		process.env.TURSO_BETTER_AUTH_TOKEN ?? '',
	);

	return createAuth({
		db: authDb,
		appName: 'Morgan Wrestling',
	});
}

export class AuthError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = 'AuthError';
		this.statusCode = statusCode;
	}
}
