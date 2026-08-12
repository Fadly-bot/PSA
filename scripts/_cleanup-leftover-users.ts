/**
 * Cleanup leftover E2E test users from previous runs (email contains 'e2e'
 * or matches known test patterns) + any data owned by them.
 * Does NOT touch real production data, test books, or inventories.
 * Run: node --env-file-if-exists=.env.local --import tsx scripts/_cleanup-leftover-users.ts
 */
import { db } from '../src/db/index';
import {
  accounts, auditLogs, bookInventories, borrowingDetails, borrowings,
  fines, members, returns, sessions, settings, users,
} from '../src/db/schema';
import { or, ilike, inArray } from 'drizzle-orm';

const patterns = ['e2e.%', 'e2e-%', 'staff-e2e-%', 'member.e2e.%', 'member-e2e-%', 'membere2e.%'];

async function main() {
  const rows = await db.select({ id: users.id, email: users.email }).from(users)
    .where(or(...patterns.map((p) => ilike(users.email, p))));
  console.log('test users found:', rows.length);
  if (!rows.length) { console.log('nothing to clean'); process.exit(0); }

  for (const u of rows) console.log('  -', u.email);

  const userIds = rows.map((r) => r.id);
  const memberRows = await db.select({ id: members.id, userId: members.userId })
    .from(members).where(inArray(members.userId, userIds));
  const memberIds = memberRows.map((m) => m.id);

  // Borrowings owned by those members (borrowing.memberId → member.id).
  let borrowingIds: string[] = [];
  let inventoryIds: string[] = [];
  if (memberIds.length) {
    const br = await db.select({ id: borrowings.id }).from(borrowings)
      .where(inArray(borrowings.memberId, memberIds));
    borrowingIds = br.map((b) => b.id);
    if (borrowingIds.length) {
      const rets = await db.select({ id: returns.id }).from(returns)
        .where(inArray(returns.borrowingId, borrowingIds));
      if (rets.length) await db.delete(returns).where(inArray(returns.id, rets.map((r) => r.id)));
      const fns = await db.select({ id: fines.id }).from(fines)
        .where(inArray(fines.borrowingId, borrowingIds));
      if (fns.length) await db.delete(fines).where(inArray(fines.id, fns.map((f) => f.id)));
      const dets = await db.select({ inventoryId: borrowingDetails.bookInventoryId })
        .from(borrowingDetails).where(inArray(borrowingDetails.borrowingId, borrowingIds));
      inventoryIds = dets.map((d) => d.inventoryId);
      await db.delete(borrowingDetails).where(inArray(borrowingDetails.borrowingId, borrowingIds));
      await db.delete(borrowings).where(inArray(borrowings.id, borrowingIds));
      console.log('  cleaned borrowings:', borrowingIds.length);
    }
  }

  if (memberIds.length) await db.delete(members).where(inArray(members.id, memberIds));

  await db.update(settings).set({ createdBy: null, updatedBy: null })
    .where(or(inArray(settings.createdBy, userIds), inArray(settings.updatedBy, userIds)));
  await db.delete(auditLogs).where(inArray(auditLogs.userId, userIds));
  await db.delete(accounts).where(inArray(accounts.userId, userIds));
  await db.delete(sessions).where(inArray(sessions.userId, userIds));
  await db.delete(users).where(inArray(users.id, userIds));
  console.log('users removed:', userIds.length);

  // Restore any inventory copies that were left 'borrowed' by test borrowings.
  if (inventoryIds.length) {
    await db.update(bookInventories)
      .set({ status: 'available', updatedAt: new Date() })
      .where(inArray(bookInventories.id, inventoryIds));
    console.log('inventory restored to available:', inventoryIds.length);
  }

  console.log('done');
  process.exit(0);
}

main().catch((e) => { console.error('cleanup failed:', e?.message ?? e); process.exit(1); });
