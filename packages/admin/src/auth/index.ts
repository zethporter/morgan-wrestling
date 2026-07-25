import { drizzle } from 'drizzle-orm/libsql'
import { env } from '#/env'

export const db = drizzle({
  connection: {
    url: env.TURSO_BETTER_AUTH_CONNECTION_URL,
    authToken: env.TURSO_BETTER_AUTH_TOKEN,
  },
})
