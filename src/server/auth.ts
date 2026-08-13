import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db/index';
import * as schema from '@/db/schema';

/**
 * Whether `origin` (an absolute URL) is served from a private/LAN address:
 * localhost, 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16.
 * Used to trust phone access via the LAN IP (DHCP may change the exact IP,
 * so a range check is more robust than hardcoding one address).
 * Public origins are never trusted dynamically.
 */
function isPrivateNetworkOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    if (hostname === 'localhost' || hostname === '::1') return true;
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false;
    const octets = hostname.split('.').map(Number);
    if (octets.some((o) => o < 0 || o > 255)) return false;
    const [a, b] = octets;
    return (
      a === 127 ||
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  } catch {
    return false;
  }
}

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
   *
   * Dynamic: when the app is opened from a phone on the same Wi-Fi through a
   * LAN IP (e.g. http://192.168.1.5:3000), the request's own origin is added
   * when it is a private-network address. Without this, Better Auth rejects
   * login/register from the phone with HTTP 403 INVALID_ORIGIN because the
   * LAN origin is neither the baseURL nor listed in trustedOrigins.
   */
  trustedOrigins: (request) => {
    const staticOrigins = [
      'http://localhost:3000',
      'https://tbmsemesta-alam.vercel.app',
      'https://*.vercel.app',
    ];
    const origin =
      request?.headers.get('origin') ?? request?.headers.get('referer') ?? '';
    if (origin.trim()) {
      try {
        // Normalize referer-with-path (e.g. .../login) down to scheme://host:port.
        const normalized = new URL(origin.trim()).origin;
        if (isPrivateNetworkOrigin(normalized)) {
          return [...staticOrigins, normalized];
        }
      } catch {
        // Ignore malformed origins — never trust them dynamically.
      }
    }
    return staticOrigins;
  },
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
