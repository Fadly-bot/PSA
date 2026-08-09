import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';
import { DEFAULT_SETTINGS, getSettings, upsertSettings } from '@/server/settings';

export const runtime = 'nodejs';

const updateSettingsSchema = z.object({
  settings: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()]),
  ),
});

const ALLOWED_KEYS = Object.keys(DEFAULT_SETTINGS);

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(user.role, 'setting:manage')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const settings = await getSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('GET /api/settings error', error);
    return NextResponse.json({ error: 'Gagal memuat pengaturan.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(user.role, 'setting:manage')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data pengaturan tidak valid.' }, { status: 400 });
    }

    const entries = Object.entries(parsed.data.settings)
      .filter(([key]) => ALLOWED_KEYS.includes(key))
      .map(([key, value]) => ({ key, value }));

    if (entries.length === 0) {
      return NextResponse.json({ error: 'Tidak ada pengaturan yang valid.' }, { status: 400 });
    }

    await upsertSettings(entries, user.id);

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE_SETTING',
      module: 'SETTINGS',
      description: `Perbarui ${entries.length} pengaturan`,
    });

    const settings = await getSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('PATCH /api/settings error', error);
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan.' }, { status: 500 });
  }
}
