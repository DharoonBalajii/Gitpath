// Health check for uptime monitoring (e.g. Better Stack Uptime).
// Returns 200 when the app + database are reachable, 503 otherwise.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', db: 'up', time: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: 'degraded', db: 'down', time: new Date().toISOString() }, { status: 503 });
  }
}
