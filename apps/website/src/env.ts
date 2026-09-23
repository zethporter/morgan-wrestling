import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
	/**
	 * Two server variables, both read-only Turso credentials. This app has no
	 * auth, no session secret, and nothing to sign — if a third server key ever
	 * shows up here, check it against the non-goals in README.md first.
	 */
	server: {
		TURSO_CONNECTION_URL: z.string(),
		TURSO_TOKEN: z.string(),
	},

	/**
	 * The prefix that client-side variables must have. This is enforced both at
	 * a type-level and at runtime.
	 */
	clientPrefix: 'VITE_',

	client: {
		VITE_APP_TITLE: z.string().min(1).default('Morgan Wrestling'),
	},

	/**
	 * What object holds the environment variables at runtime. This is usually
	 * `process.env` or `import.meta.env`.
	 */
	runtimeEnv: {
		...import.meta.env,
		TURSO_CONNECTION_URL: process.env.TURSO_CONNECTION_URL,
		TURSO_TOKEN: process.env.TURSO_TOKEN,
	},

	/**
	 * By default, this library will feed the environment variables directly to
	 * the Zod validator.
	 *
	 * This means that if you have an empty string for a value that is supposed
	 * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
	 * it as a type mismatch violation. Additionally, if you have an empty string
	 * for a value that is supposed to be a string with a default value (e.g.
	 * `DOMAIN=` in an ".env" file), the default value will never be applied.
	 *
	 * In order to solve these issues, we recommend that all new projects
	 * explicitly specify this option as true.
	 */
	emptyStringAsUndefined: true,
});
