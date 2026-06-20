// POST /api/progress/quiz-answer
// Records a quiz attempt, awards XP if correct, bumps vibe score,
// and marks the relevant concept as mastered on 2+ correct attempts.

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

  let body: { quizId: string; answer: string; isCorrect: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const { quizId, answer, isCorrect } = body;
  if (!quizId || answer == null) {
    return NextResponse.json({ success: false, error: 'quizId and answer required' }, { status: 422 });
  }

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: { lesson: { select: { conceptsCovered: true } } },
  });
  if (!quiz) return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 });

  const xpEarned = isCorrect ? (quiz.xpReward ?? 5) : 0;

  // Record attempt
  await db.quizAttempt.create({
    data: { userId, quizId, answer, isCorrect, xpEarned },
  });

  // Award XP + bump vibe score (answering at all = engagement)
  const vibeGain = isCorrect ? 15 : 5;
  const user = await db.user.update({
    where: { id: userId },
    data: {
      xp: { increment: xpEarned },
      vibeScore: { increment: vibeGain },
      lastActiveAt: new Date(),
    },
    select: { xp: true, vibeScore: true },
  });

  // Recalculate level from total XP
  const newLevel = levelFromXp(user.xp);
  await db.user.update({ where: { id: userId }, data: { level: newLevel } });

  // Upsert concept mastery for each concept this quiz's lesson covers
  if (isCorrect) {
    for (const slug of quiz.lesson.conceptsCovered) {
      const existing = await db.conceptMastery.findUnique({ where: { userId_conceptSlug: { userId, conceptSlug: slug } } });
      const currentLevel = existing?.level ?? 0;
      // 0=unknown → 1=introduced on first see, 2=practiced, 3=mastered
      const nextLevel = Math.min(3, currentLevel + 1);
      await db.conceptMastery.upsert({
        where: { userId_conceptSlug: { userId, conceptSlug: slug } },
        create: { userId, conceptSlug: slug, level: nextLevel, lastSeenAt: new Date() },
        update: { level: nextLevel, lastSeenAt: new Date() },
      });
    }
  }

  return NextResponse.json({ success: true, data: { xpEarned, newLevel, vibeScore: user.vibeScore } });
}
