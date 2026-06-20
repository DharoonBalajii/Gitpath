// GET /api/lessons/[id] — get full lesson content

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

  const lesson = await db.lesson.findUnique({
    where: { id },
    include: {
      quizzes: { orderBy: { id: 'asc' } },
      module: {
        select: {
          title: true,
          conceptSlug: true,
          order: true,
          course: {
            select: {
              id: true,
              title: true,
              repositoryId: true,
              repository: { select: { fullName: true, graph: { select: { conceptTags: true } } } },
            },
          },
        },
      },
      progress: {
        where: { userId: session.user.id },
        select: { status: true, completedAt: true, xpEarned: true },
      },
    },
  });

  if (!lesson) {
    return NextResponse.json<APIResponse>({ success: false, error: 'Lesson not found' }, { status: 404 });
  }

  return NextResponse.json<APIResponse>({ success: true, data: lesson });
}
