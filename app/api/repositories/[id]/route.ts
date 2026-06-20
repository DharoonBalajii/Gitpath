// GET /api/repositories/[id] — get repository with full details + graph

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import type { APIResponse } from '@/lib/types/index';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<APIResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const repository = await db.repository.findUnique({
    where: { id },
    include: {
      graph: true,
      courses: {
        include: {
          modules: {
            orderBy: { order: 'asc' },
            include: {
              lessons: { orderBy: { order: 'asc' }, select: { id: true, title: true, difficulty: true, estimatedMinutes: true, xpReward: true } },
            },
          },
          enrollments: {
            where: { userId: session.user.id },
            select: { progressPct: true, completedAt: true, lastAccessAt: true },
          },
        },
      },
    },
  });

  if (!repository) {
    return NextResponse.json<APIResponse>({ success: false, error: 'Repository not found' }, { status: 404 });
  }

  return NextResponse.json<APIResponse>({ success: true, data: repository });
}
