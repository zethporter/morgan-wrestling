import { createAuth, createAuthDb } from '@morgan-wrestling/auth';

const authDb = createAuthDb(
	process.env.TURSO_BETTER_AUTH_CONNECTION_URL ?? '',
	process.env.TURSO_BETTER_AUTH_TOKEN ?? '',
);

export const auth = createAuth({
	db: authDb,
	appName: 'Morgan Wrestling',
});

export class AuthError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = 'AuthError';
		this.statusCode = statusCode;
	}
}
