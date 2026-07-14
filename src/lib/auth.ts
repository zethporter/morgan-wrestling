import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { adminClient } from 'better-auth/client/plugins'
import { admin, oneTap, organization, twoFactor } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { ac, manager, user, guest } from './permissions'
import { db } from '@/auth' // your drizzle instance
import * as schema from '@/auth/schema'
import { env } from '@/env'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      ...schema,
    },
  }),
  appName: 'Wrestler of the Day',
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      // accessType: "offline",
      // propt: "select_account consent"
    },
  },
  plugins: [
    twoFactor(),
    oneTap(),
    tanstackStartCookies(),
    organization(),
    admin({
      adminUserIds: [],
      plugins: [
        adminClient({
          ac,
          roles: {
            manager,
            user,
            guest
          },
        }),
      ],
    }),
  ],
})
