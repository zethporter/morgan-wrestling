import { createAppDb } from '@morgan-wrestling/db';
import { env } from '#/env';

export * from '@morgan-wrestling/db/schema';

export const db = createAppDb(env.TURSO_CONNECTION_URL, env.TURSO_TOKEN);
