import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { db } from '@/db/index';
import { users, roles } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Client-side protected routes. Any path under one of these prefixes
 * requires a valid Better Auth session.
 */
const PROTECTED_PATHS = ['/dashboard', '/admin', '/settings', '/profile'];

/**
 * Paths that require staff/admin role (not accessible by member).
 */
const STAFF_ONLY_PATHS = [
  '/dashboard/books',
  '/dashboard/inventories',
  '/dashboard/book-sources',
  '/dashboard/categories',
  '/dashboard/authors',
  '/dashboard/publishers',
  '/dashboard/shelves',
  '/dashboard/members',
  '/dashboard/borrowings',
  '/dashboard/returns',
  '/dashboard/fines',
  '/dashboard/reports',
];

/**
 * Paths that require admin role only.
 */
const ADMIN_ONLY_PATHS = ['/dashboard/settings', '/dashboard/audit-logs', '/dashboard/users', '/dashboard/roles'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((prefix) =>
    pathname.startsWith(prefix),
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  const session = await auth.api
    .getSession({ headers: request.headers })
    .catch(() => null);

  if (!session?.user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  const isAdminOnly = ADMIN_ONLY_PATHS.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isStaffOnly = STAFF_ONLY_PATHS.some((prefix) =>
    pathname.startsWith(prefix),
  );
  if (isAdminOnly || isStaffOnly) {
    const [userRow] = await db
      .select({ roleName: roles.name })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, session.user.id))
      .limit(1);

    const roleName = userRow?.roleName;
    const isAdmin = roleName === 'admin';
    const isStaff = isAdmin || roleName === 'staff';

    if (isAdminOnly && !isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    if (isStaffOnly && !isStaff) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/settings/:path*',
    '/profile/:path*',
  ],
};
