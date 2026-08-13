import { createAuth, createAuthDb } from '@morgan-wrestling/auth';

const authDb = createAuthDb(
	process.env.TURSO_BETTER_AUTH_CONNECTION_URL ?? '',
	process.env.TURSO_BETTER_AUTH_TOKEN ?? '',
);

export const auth = createAuth({
	db: authDb,
	appName: 'Morgan Wrestling',
});
