import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth';
import {
	admin as adminPlugin,
	oneTap,
	organization,
	twoFactor,
} from 'better-auth/plugins';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import type { createAuthDb } from './db';
import { ac, roles } from './permissions';
import * as authSchema from './schema';

export type AuthPlugin = Parameters<typeof betterAuth>[0]['plugins'][number];

export interface AuthConfig {
	db: ReturnType<typeof createAuthDb>;
	appName?: string;
	adminUserIds?: string[];
	plugins?: AuthPlugin[];
	emailAndPassword?: {
		enabled?: boolean;
	};
}

export function createAuth(config: AuthConfig) {
	const {
		db,
		appName = 'Wrestler of the Day',
		adminUserIds = [],
		plugins: customPlugins = [],
	} = config;

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: 'sqlite',
			schema: authSchema,
		}),
		appName,
		baseURL: process.env.BETTER_AUTH_URL,
		emailAndPassword: {
			enabled: true,
			autoSignIn: true,
		},
		socialProviders: {
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID!,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			},
		},
		plugins: [
			twoFactor(),
			oneTap(),
			organization(),
			adminPlugin({
				adminUserIds,
				ac,
				roles,
				defaultRole: 'user',
				adminRoles: ['admin'],
			}),
			...customPlugins,
			// Must stay last: plugins with `hooks.after` running after the cookie
			// integration set cookies that never reach the framework cookie store.
			tanstackStartCookies(),
		],
	});
}
