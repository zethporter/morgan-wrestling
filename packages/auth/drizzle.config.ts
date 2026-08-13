import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./authMigrations",
  schema: "./src/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_BETTER_AUTH_CONNECTION_URL!,
    authToken: process.env.TURSO_BETTER_AUTH_TOKEN!,
  },
});
