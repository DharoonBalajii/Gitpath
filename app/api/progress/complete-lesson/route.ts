// POST /api/progress/complete-lesson
// Marks a lesson as COMPLETED for the user, awards lesson XP, bumps vibe score.
// Idempotent: calling twice keeps the highest XP earned, doesn't double-award.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { levelFromXp } from '@/lib/utils/xp';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  let body: { lessonId: string; quizXp?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const { lessonId, quizXp = 0 } = body;
  if (!lessonId) return NextResponse.json({ success: false, error: 'lessonId required' }, { status: 422 });

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { xpReward: true, conceptsCovered: true },
  });
  if (!lesson) return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 });

  // Idempotency check
  const existing = await db.userProgress.findUnique({ where: { userId_lessonId: { userId, lessonId } } });
  if (existing?.status === 'COMPLETED') {
    return NextResponse.json({ success: true, data: { alreadyCompleted: true } });
  }

  const totalXp = lesson.xpReward + quizXp;

  await db.userProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, status: 'COMPLETED', completedAt: new Date(), xpEarned: totalXp },
    update: { status: 'COMPLETED', completedAt: new Date(), xpEarned: totalXp },
  });

  // Award lesson XP (quiz XP was already awarded per-answer)
  const vibeGain = 50; // completing a lesson = big vibe boost
  const user = await db.user.update({
    where: { id: userId },
    data: {
      xp: { increment: lesson.xpReward },
      vibeScore: { increment: vibeGain },
      lastActiveAt: new Date(),
    },
    select: { xp: true, vibeScore: true },
  });

  const newLevel = levelFromXp(user.xp);
  await db.user.update({ where: { id: userId }, data: { level: newLevel } });

  // Mark concepts from this lesson as at least "introduced"
  for (const slug of lesson.conceptsCovered) {
    await db.conceptMastery.upsert({
      where: { userId_conceptSlug: { userId, conceptSlug: slug } },
      create: { userId, conceptSlug: slug, level: 1, lastSeenAt: new Date() },
      update: { lastSeenAt: new Date() },
    });
  }

  return NextResponse.json({ success: true, data: { xpEarned: totalXp, newLevel, vibeScore: user.vibeScore } });
}
