import { headers } from 'next/headers';
import { db } from '@/db/index';
import { auditLogs } from '@/db/schema';

/**
 * Audit log helper.
 *
 * Records an immutable entry into `audit_logs`. Never stores sensitive
 * data (passwords, tokens, secrets). Used by server actions and route
 * handlers for traceability and compliance.
 *
 * Note: `audit_logs` is append-only; there are no update/delete endpoints.
 */
export async function createAuditLog(input: {
  userId?: string | null;
  action: string;
  module: string;
  description?: string | null;
}) {
  let ipAddress: string | null = null;
  let userAgent: string | null = null;

  try {
    const headersList = await headers();
    ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      headersList.get('x-real-ip') ??
      null;
    userAgent = headersList.get('user-agent');
  } catch {
    // headers() is unavailable outside request scope (e.g. build time).
  }

  try {
    await db.insert(auditLogs).values({
      userId: input.userId ?? null,
      action: input.action,
      module: input.module,
      description: input.description ?? null,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    // Audit logging must never break the primary operation.
    console.error('[audit] failed to write audit log', error);
  }
}
