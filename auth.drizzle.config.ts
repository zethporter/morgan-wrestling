import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: ['.env.local', '.env'] })

export default defineConfig({
  schema: './src/auth/schema.ts',
  out: './authMigrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_BETTER_AUTH_CONNECTION_URL!,
    authToken: process.env.TURSO_BETTER_AUTH_TOKEN!,
  },
})
