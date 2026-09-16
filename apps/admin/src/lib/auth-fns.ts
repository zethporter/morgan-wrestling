import {
	AuthError,
	type BetterAuthUser,
	getAuth,
} from '@morgan-wrestling/auth/lib/auth';
import type { PermissionRequest } from '@morgan-wrestling/auth/permissions';
import { createServerFn, createServerOnlyFn } from '@tanstack/react-start';
import {
	getRequestHeaders,
	setResponseStatus,
} from '@tanstack/react-start/server';
import { z } from 'zod';

export const getSession = createServerFn({ method: 'GET' }).handler(
	async () => {
		const headers = getRequestHeaders();
		const session = await getAuth().api.getSession({ headers });

		return session;
	},
);

export const ensureSession = createServerFn({ method: 'GET' }).handler(
	async () => {
		const headers = getRequestHeaders();
		const session = await getAuth().api.getSession({ headers });

		if (!session) {
			throw new AuthError('User Not Authenticated', 401);
		}

		return session;
	},
);

/**
 * Server-only guard for use inside a server fn handler. Throws `AuthError` 401
 * when signed out and 403 when the caller's role lacks any of `permissions`.
 * Returns the session so handlers can reuse `session.user.id`.
 *
 * Wrapped in `createServerOnlyFn` so the body — and with it the
 * `@tanstack/react-start/server` and better-auth imports — is stripped from the
 * client bundle. A plain exported function can't be pruned, which drags
 * better-auth's libsql driver into the browser and breaks every route.
 */
export const requirePermission = createServerOnlyFn(
	async (permissions: PermissionRequest) => {
		const headers = getRequestHeaders();
		// One instance for both calls: it is request-scoped, so reusing it here is
		// safe and saves a second connection.
		const auth = getAuth();
		const session = await auth.api.getSession({ headers });

		if (!session) {
			throw new AuthError('User Not Authenticated', 401);
		}

		const { success } = await auth.api.userHasPermission({
			// Deliberately no `headers`: better-auth prefers the session user when
			// headers are present, but resolves the role from the user record when
			// given a bare `userId`. We already authenticated that id above.
			body: { userId: session.user.id, permissions },
		});

		if (!success) {
			throw new AuthError('Insufficient Permissions', 403);
		}

		return session;
	},
);

/**
 * Non-throwing counterpart to `requirePermission`, callable from the router.
 * Use it for navigation gating; the server fn behind the screen still has to
 * call `requirePermission` itself.
 */
export const checkPermission = createServerFn({ method: 'GET' })
	.validator((data: PermissionRequest) => data)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const auth = getAuth();
		const session = await auth.api.getSession({ headers });

		if (!session) {
			return false;
		}

		const { success } = await auth.api.userHasPermission({
			body: { userId: session.user.id, permissions: data },
		});

		return success;
	});

export const getSessionInfo = createServerFn({ method: 'GET' }).handler(
	async () => {
		const headers = getRequestHeaders();
		const auth = getAuth();
		const session = await auth.api.getSession({ headers });

		if (!session) {
			return null;
		}

		return {
			user: session.user,
			session: session.session,
		};
	},
);

const adminToggleSchema = z.object({ id: z.string() });
export const setAdminRole = createServerFn({ method: 'POST' })
	.validator(adminToggleSchema)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const auth = getAuth();

		const result = await auth.api.setRole({
			body: {
				userId: data.id,
				role: ['admin'],
			},
			headers,
		});
		return result;
	});
export const removeAdminRole = createServerFn({ method: 'POST' })
	.validator(adminToggleSchema)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const auth = getAuth();

		const result = await auth.api.setRole({
			body: {
				userId: data.id,
				role: ['guest'],
			},
			headers,
		});
		return result;
	});

interface UsersPageData {
	users: Array<BetterAuthUser>;
	totalPages: number;
	currentPage: number;
}
const usersPage = z.object({
	page: z.number().min(1).default(1),
	pageSize: z.number().min(1).max(50).default(10),
});
export const getUsersPage = createServerFn({ method: 'GET' })
	.validator(usersPage)
	.handler(async ({ data }): Promise<UsersPageData> => {
		const headers = getRequestHeaders();
		const auth = getAuth();

		const pageSize = 10;
		const currentPage = data.page;

		const users = await auth.api.listUsers({
			query: {
				limit: pageSize,
				offset: (currentPage - 1) * pageSize,
			},
			headers,
		});

		const totalUsers = users.total;
		const totalPages = Math.ceil(totalUsers / pageSize);
		return { ...users, currentPage, totalPages };
	});

/**
 * Turns a caught error into a response with the right status. `AuthError`
 * keeps its code; anything else is reported as an opaque 500.
 */
export const throwAsResponse = createServerOnlyFn((e: unknown): never => {
	console.error({ e });

	if (e instanceof AuthError) {
		setResponseStatus(e.statusCode);
		throw new Error(e.message);
	}

	setResponseStatus(500);
	throw new Error('Unhandled Internal Error');
});
