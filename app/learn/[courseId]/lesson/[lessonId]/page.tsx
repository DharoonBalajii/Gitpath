// Real lesson page — maps a generated DB lesson into the interactive LessonTemplate.
// Passes lessonId, quizIds, nextLessonId so the template can record progress and navigate.

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { LessonTemplate } from '@/components/lesson/LessonTemplate';
import type { GeneratedLesson, CodeSnippet, ArchitecturalDecision, GeneratedQuiz } from '@/lib/types/index';

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      quizzes: { orderBy: { id: 'asc' } },
      module: {
        select: {
          title: true,
          order: true,
          courseId: true,
          course: { select: { title: true } },
          lessons: { select: { id: true, order: true }, orderBy: { order: 'asc' } },
        },
      },
    },
  });
  if (!lesson) notFound();

  // Find the next lesson in this module (or first of next module)
  let nextLessonId: string | undefined;
  const siblings = lesson.module?.lessons ?? [];
  const myIdx = siblings.findIndex((l) => l.id === lessonId);
  if (myIdx >= 0 && myIdx + 1 < siblings.length) {
    nextLessonId = siblings[myIdx + 1]?.id;
  } else {
    // Look in the next module
    const nextModule = await db.module.findFirst({
      where: { courseId, order: { gt: lesson.module?.order ?? 0 } },
      orderBy: { order: 'asc' },
      include: { lessons: { orderBy: { order: 'asc' }, take: 1, select: { id: true } } },
    });
    nextLessonId = nextModule?.lessons[0]?.id;
  }

  // Check if this lesson is already completed so we don't re-award XP on revisit
  const alreadyCompleted = await db.userProgress.findUnique({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    select: { status: true },
  });

  const mapped: GeneratedLesson & {
    moduleTitle?: string; courseTitle?: string;
    lessonId?: string; quizIds?: string[];
    nextLessonId?: string; courseId?: string;
  } = {
    order: lesson.order,
    title: lesson.title,
    description: lesson.description ?? '',
    difficulty: lesson.difficulty,
    estimatedMinutes: lesson.estimatedMinutes,
    explanation: lesson.explanation ?? '',
    codeSnippets: (lesson.codeSnippets as unknown as CodeSnippet[]) ?? [],
    flowDiagram: lesson.flowDiagram ?? null,
    realWorldAnalogy: lesson.realWorldAnalogy ?? '',
    summary: lesson.summary ?? '',
    practiceTask: lesson.practiceTask ?? '',
    keyTakeaways: lesson.keyTakeaways ?? [],
    architecturalDecisions: (lesson.architecturalDecisions as unknown as ArchitecturalDecision[]) ?? [],
    bestPractices: lesson.bestPractices ?? [],
    commonMistakes: lesson.commonMistakes ?? [],
    relatedFiles: lesson.relatedFiles ?? [],
    conceptsCovered: lesson.conceptsCovered ?? [],
    xpReward: lesson.xpReward,
    quizzes: lesson.quizzes.map((q): GeneratedQuiz => ({
      type: q.type,
      question: q.question,
      options: (q.options as string[] | null) ?? [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation ?? '',
      codeContext: q.codeContext ?? undefined,
      difficulty: q.difficulty,
      xpReward: q.xpReward,
    })),
    moduleTitle: lesson.module?.title,
    courseTitle: lesson.module?.course?.title,
    lessonId,
    quizIds: lesson.quizzes.map((q) => q.id),
    nextLessonId,
    courseId,
  };

  return <LessonTemplate lesson={mapped} />;
}
