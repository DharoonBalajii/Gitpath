// POST /api/quiz/[id]/attempt — submit a quiz answer

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import type { APIResponse } from '@/lib/types/index';

export const dynamic = 'force-dynamic';

const attemptSchema = z.object({
  answer: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<APIResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id: quizId } = await params;
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<APIResponse>({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = attemptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<APIResponse>({ success: false, error: 'Answer is required' }, { status: 422 });
  }

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    select: { correctAnswer: true, explanation: true, xpReward: true, type: true },
  });

  if (!quiz) {
    return NextResponse.json<APIResponse>({ success: false, error: 'Quiz not found' }, { status: 404 });
  }

  const isCorrect = parsed.data.answer.trim().toLowerCase() === quiz.correctAnswer.trim().toLowerCase();
  const xpEarned = isCorrect ? quiz.xpReward : 0;

  await db.quizAttempt.create({
    data: {
      userId,
      quizId,
      answer: parsed.data.answer,
      isCorrect,
      xpEarned,
    },
  });

  if (isCorrect && xpEarned > 0) {
    await db.user.update({
      where: { id: userId },
      data: { xp: { increment: xpEarned } },
    });
  }

  return NextResponse.json<APIResponse>({
    success: true,
    data: { isCorrect, xpEarned, explanation: quiz.explanation },
  });
}
