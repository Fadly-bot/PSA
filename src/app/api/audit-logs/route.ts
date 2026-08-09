import { NextResponse } from 'next/server';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db/index';
import { auditLogs, users } from '@/db/schema';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';

export const runtime = 'nodejs';

/**
 * Audit Logs API — admin only, immutable.
 * No POST/PATCH/DELETE endpoints exist on purpose (see docs/api/Audit Logs API.md).
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(user.role, 'audit:read')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';
    const moduleFilter = searchParams.get('module');
    const action = searchParams.get('action');
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') ?? '20')));
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (q) {
      conditions.push(
        sql`(${users.name} ILIKE ${`%${q}%`} OR ${users.email} ILIKE ${`%${q}%`} OR ${auditLogs.description} ILIKE ${`%${q}%`})`,
      );
    }
    if (moduleFilter) conditions.push(eq(auditLogs.module, moduleFilter));
    if (action) conditions.push(eq(auditLogs.action, action));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          module: auditLogs.module,
          description: auditLogs.description,
          ipAddress: auditLogs.ipAddress,
          userAgent: auditLogs.userAgent,
          createdAt: auditLogs.createdAt,
          user: { id: users.id, name: users.name, email: users.email },
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(where)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(where),
    ]);

    return NextResponse.json({
      items,
      page,
      limit,
      total: Number(count),
      totalPages: Math.max(1, Math.ceil(Number(count) / limit)),
    });
  } catch (error) {
    console.error('GET /api/audit-logs error', error);
    return NextResponse.json({ error: 'Gagal memuat audit log.' }, { status: 500 });
  }
}
