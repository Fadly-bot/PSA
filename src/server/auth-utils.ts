import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { auth } from './auth';
import { db } from '@/db/index';
import { users, roles } from '@/db/schema';
import { hasPermission, type Permission, type RoleName } from './permissions';

export { hasPermission, type Permission, type RoleName };

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: RoleName | null;
};

/**
 * Resolve the current Better Auth session from the request headers
 * (server-side only — reads cookies, validates against the DB).
 * Mirrors `next-auth`'s `getServerSession` for consumers.
 */
export async function getSession() {
  const headersList = await headers();
  return auth.api.getSession({ headers: headersList }).catch(() => null);
}

/**
 * Enrich the Better Auth user with the app role loaded from the `users` row.
 * Returns `null` when there is no valid session or no matching user row.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  const user = session?.user;
  if (!user) {
    return null;
  }

  const [row] = await db
    .select({ role: roles.name })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, user.id))
    .limit(1);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image ?? null,
    role: (row?.role as RoleName | undefined) ?? null,
  };
}

/** Assert that a user is authenticated, throwing otherwise. */
export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED: authentication required');
  }
  return user;
}

/** Assert that the current user holds `permission`. */
export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await requireAuth();
  if (!hasPermission(user.role, permission)) {
    throw new Error(`FORBIDDEN: missing permission "${permission}"`);
  }
  return user;
}

/** Assert that the current user has the given `role`. */
export async function requireRole(role: RoleName): Promise<CurrentUser> {
  const user = await requireAuth();
  if (user.role !== role) {
    throw new Error(`FORBIDDEN: role "${role}" required`);
  }
  return user;
}
