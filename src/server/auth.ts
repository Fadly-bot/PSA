import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db/index';
import * as schema from '@/db/schema';

/**
 * Better Auth instance — wired to the Drizzle + PostgreSQL (postgres-js)
 * database. The `schema` option maps Better Auth's internal models
 * (`user`, `session`, `account`, `verification`) to the Drizzle table
 * objects defined in `src/db/schema.ts`.
 *
 * Column names use snake_case (the Drizzle adapter default), so Better Auth's
 * camelCase fields map automatically: `emailVerified` -> `email_verified`,
 * `userId` -> `user_id`, `accessToken` -> `access_token`, etc.
 *
 * The `user` model is mapped onto the existing `users` table; the `image`
 * field is remapped to the app's `avatar_url` column (the users table does
 * not have a column named `image`).
 */
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET ?? 'dev-insecure-secret-change-me',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  user: {
    tableName: 'users',
    fields: {
      image: 'avatar_url',
    },
  },
  advanced: {
    database: {
      generateId: 'uuid',
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days, in seconds
    updateAge: 60 * 60 * 24, // 1 day, in seconds
  },
});

export type Auth = typeof auth;
