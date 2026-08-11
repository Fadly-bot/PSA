import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/index';
import { members, users } from '@/db/schema';
import { getCurrentUser } from '@/server/auth-utils';

export const runtime = 'nodejs';

/**
 * Self-service profile for the logged-in member.
 * Any authenticated user may fetch only their own member profile.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    }

    const [row] = await db
      .select({
        id: members.id,
        memberCode: members.memberCode,
        phone: members.phone,
        address: members.address,
        birthDate: members.birthDate,
        joinDate: members.joinDate,
        status: members.status,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(eq(members.userId, user.id))
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { error: 'Profil anggota belum tersedia. Hubungi petugas perpustakaan.' },
        { status: 404 },
      );
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error('GET /api/members/me error', error);
    return NextResponse.json({ error: 'Gagal memuat profil.' }, { status: 500 });
  }
}
