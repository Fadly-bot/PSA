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
  /**
   * Origins allowed past Better Auth's CSRF origin-check. The baseURL origin
   * is trusted automatically; add local dev and Vercel preview domains so
   * they are not rejected (previously the origin check returned 403 and the
   * browser surfaced this as "Failed to fetch").
   */
  trustedOrigins: [
    'http://localhost:3000',
    'https://tbmsemesta-alam.vercel.app',
    'https://*.vercel.app',
  ],
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
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Registration flow (AUTH.md / FLOW.md): a new user that registers
          // through the public form becomes a library Member automatically.
          // We only auto-create a member for self-registered users (no role
          // assigned yet). Staff/admin-created users are handled explicitly
          // by the members/users APIs.
          try {
            const rolesModule = await import('@/db/schema');
            const { members, roles, users } = rolesModule;
            const { eq } = await import('drizzle-orm');
            const { db } = await import('@/db/index');
            const { generateMemberCode } = await import('@/lib/utils');

            // Idempotent: skip when the user already has a member profile
            // (e.g. staff/admin created this user explicitly).
            const [existingMember] = await db
              .select({ id: members.id })
              .from(members)
              .where(eq(members.userId, user.id))
              .limit(1);
            if (!existingMember) {
              const [memberRole] = await db
                .select({ id: roles.id })
                .from(roles)
                .where(eq(roles.name, 'member'))
                .limit(1);

              const roleId = memberRole?.id ?? null;
              // Assign default member role when the role exists.
              if (roleId) {
                await db
                  .update(users)
                  .set({ roleId })
                  .where(eq(users.id, user.id));
              }

              // Create the member profile (1:1 with the user).
              await db.insert(members).values({
                userId: user.id,
                memberCode: generateMemberCode(),
                joinDate: new Date().toISOString().slice(0, 10),
                status: true,
              });
            }
          } catch (error) {
            console.error('[better-auth] failed to create member profile', error);
          }
        },
      },
    },
  },
});

export type Auth = typeof auth;
