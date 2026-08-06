import { createAppDb } from "@db/db";
import { env } from "#/env";

export * from '@db/db/schema'

export const db = createAppDb(env.TURSO_CONNECTION_URL, env.TURSO_TOKEN);
