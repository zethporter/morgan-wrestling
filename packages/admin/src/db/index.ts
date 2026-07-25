import { createAppDb } from "@morgan-wrestling/db/app";
import { env } from "#/env";

export const db = createAppDb(env.TURSO_CONNECTION_URL, env.TURSO_TOKEN);
