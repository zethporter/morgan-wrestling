import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { adminClient } from "better-auth/client/plugins";
import { admin, oneTap, organization, twoFactor } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { ac, manager, user, guest } from "./permissions";
import type { createAuthDb } from "./db";

export type AuthPlugin = Parameters<typeof betterAuth>[0]["plugins"][number];

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
    appName = "Wrestler of the Day",
    adminUserIds = [],
    plugins: customPlugins = [],
    emailAndPassword = { enabled: true },
  } = config;

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
    }),
    appName,
    emailAndPassword,
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    plugins: [
      twoFactor(),
      oneTap(),
      tanstackStartCookies(),
      organization(),
      admin({
        adminUserIds,
        plugins: [
          adminClient({
            ac,
            roles: {
              manager,
              user,
              guest,
            },
          }),
        ],
      }),
      ...customPlugins,
    ],
  });
}
