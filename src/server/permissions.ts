/**
 * Role-Based Access Control (RBAC) for TBM Semesta Alam.
 *
 * Roles:
 *  - admin  : full access (catalog, borrowings, users, reports, settings)
 *  - staff  : operational access (catalog, borrowings, audit log)
 *  - member : self-service access (browse catalog + borrow)
 *
 * Permissions are namespaced as `<resource>:<action>`.
 */

export type RoleName = 'admin' | 'staff' | 'member';

export const PERMISSIONS = {
  book: ['book:create', 'book:read', 'book:update', 'book:delete'],
  borrowing: ['borrowing:borrow', 'borrowing:return'],
  user: ['user:create', 'user:read', 'user:update', 'user:delete'],
  audit: ['audit:read'],
  setting: ['setting:manage'],
  author: ['author:create', 'author:read', 'author:update', 'author:delete'],
  publisher: ['publisher:create', 'publisher:read', 'publisher:update', 'publisher:delete'],
  category: ['category:create', 'category:read', 'category:update', 'category:delete'],
  shelf: ['shelf:create', 'shelf:read', 'shelf:update', 'shelf:delete'],
  source: ['source:create', 'source:read', 'source:update', 'source:delete'],
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS][number];

export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  admin: [
    'book:create',
    'book:read',
    'book:update',
    'book:delete',
    'borrowing:borrow',
    'borrowing:return',
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'audit:read',
    'setting:manage',
    'author:create',
    'author:read',
    'author:update',
    'author:delete',
    'publisher:create',
    'publisher:read',
    'publisher:update',
    'publisher:delete',
    'category:create',
    'category:read',
    'category:update',
    'category:delete',
    'shelf:create',
    'shelf:read',
    'shelf:update',
    'shelf:delete',
    'source:create',
    'source:read',
    'source:update',
    'source:delete',
  ],
  staff: [
    'book:create',
    'book:read',
    'book:update',
    'book:delete',
    'borrowing:borrow',
    'borrowing:return',
    'audit:read',
    'author:create',
    'author:read',
    'author:update',
    'author:delete',
    'publisher:create',
    'publisher:read',
    'publisher:update',
    'publisher:delete',
    'category:create',
    'category:read',
    'category:update',
    'category:delete',
    'shelf:create',
    'shelf:read',
    'shelf:update',
    'shelf:delete',
    'source:create',
    'source:read',
    'source:update',
    'source:delete',
  ],
  member: ['book:read', 'borrowing:borrow', 'author:read', 'category:read', 'publisher:read'],
};

/**
 * Returns `true` when `role` is granted `permission`. A missing/unknown
 * role never receives any permission.
 */
export function hasPermission(
  role: RoleName | null | undefined,
  permission: Permission,
): boolean {
  if (!role) {
    return false;
  }
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
