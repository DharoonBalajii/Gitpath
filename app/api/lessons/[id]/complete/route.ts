// POST /api/lessons/[id]/complete — mark lesson complete, award XP, update streak

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import type { APIResponse } from '@/lib/types/index';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<APIResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id: lessonId } = await params;
  const userId = session.user.id;

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { xpReward: true, conceptsCovered: true, moduleId: true, module: { select: { courseId: true } } },
  });

  if (!lesson) {
    return NextResponse.json<APIResponse>({ success: false, error: 'Lesson not found' }, { status: 404 });
  }

  // Upsert progress — idempotent
  const existing = await db.userProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });

  if (existing?.status === 'COMPLETED') {
    return NextResponse.json<APIResponse>({ success: true, data: { xpEarned: 0, alreadyCompleted: true } });
  }

  const xpEarned = lesson.xpReward;

  await db.$transaction([
    // Mark lesson complete
    db.userProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        moduleId: lesson.moduleId,
        status: 'COMPLETED',
        completedAt: new Date(),
        xpEarned,
      },
      update: {
        status: 'COMPLETED',
        completedAt: new Date(),
        xpEarned,
      },
    }),
    // Award XP and update streak
    db.user.update({
      where: { id: userId },
      data: {
        xp: { increment: xpEarned },
        lastActiveAt: new Date(),
        // Level up every 500 XP
        level: {
          set: undefined, // computed below after transaction
        },
      },
    }),
  ]);

  // Compute new level (outside transaction for simplicity)
  const updatedUser = await db.user.findUnique({ where: { id: userId }, select: { xp: true } });
  if (updatedUser) {
    const newLevel = Math.floor(updatedUser.xp / 500) + 1;
    await db.user.update({ where: { id: userId }, data: { level: newLevel } });
  }

  // Update concept mastery
  for (const slug of lesson.conceptsCovered) {
    await db.conceptMastery.upsert({
      where: { userId_conceptSlug: { userId, conceptSlug: slug } },
      create: { userId, conceptSlug: slug, level: 1, lastSeenAt: new Date() },
      update: { level: { increment: 1 }, lastSeenAt: new Date() },
    });
  }

  // Recompute course progress
  const courseId = lesson.module.courseId;
  const [totalLessons, completedLessons] = await Promise.all([
    db.lesson.count({
      where: { module: { courseId } },
    }),
    db.userProgress.count({
      where: { userId, status: 'COMPLETED', lesson: { module: { courseId } } },
    }),
  ]);

  const progressPct = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  await db.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, progressPct, lastAccessAt: new Date() },
    update: {
      progressPct,
      lastAccessAt: new Date(),
      completedAt: progressPct === 100 ? new Date() : null,
    },
  });

  return NextResponse.json<APIResponse>({ success: true, data: { xpEarned, progressPct } });
}
