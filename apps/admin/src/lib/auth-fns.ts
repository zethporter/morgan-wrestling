import { AuthError, auth } from '@morgan-wrestling/auth/lib/auth';
import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

export const getSession = createServerFn({ method: 'GET' }).handler(
	async () => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });

		return session;
	},
);

export const ensureSession = createServerFn({ method: 'GET' }).handler(
	async () => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });

		if (!session) {
			throw new AuthError('User Not Authenticated', 401);
		}

		return session;
	},
);
