import { createAuth, createAuthDb } from "@morgan-wrestling/auth";
import { env } from "@/env";

const authDb = createAuthDb(
  env.TURSO_BETTER_AUTH_CONNECTION_URL,
  env.TURSO_BETTER_AUTH_TOKEN,
);

export const auth = createAuth({
  db: authDb,
  appName: "Wrestler of the Day",
});
