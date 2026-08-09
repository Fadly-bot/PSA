import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/auth-utils';

export const runtime = 'nodejs';

/**
 * Returns the current session user's role for client-side UI decisions.
 * Server-side authorization is always the source of truth; this endpoint
 * only helps hide/show UI elements.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, role: null }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, role: user.role });
}
