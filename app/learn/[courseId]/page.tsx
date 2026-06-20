// Course overview page — lesson list, progress, enrollment

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Clock, Trophy, Star, ArrowRight, Code2, BookOpen } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      repository: { select: { fullName: true, language: true, githubUrl: true, stars: true } },
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              difficulty: true,
              estimatedMinutes: true,
              xpReward: true,
            },
          },
        },
      },
      enrollments: {
        where: { userId },
        select: { progressPct: true, completedAt: true },
      },
    },
  });

  if (!course) notFound();

  const enrollment = course.enrollments[0];
  const progressPct = enrollment?.progressPct ?? 0;

  // Get completed lesson IDs
  const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const completedIds = new Set(
    (
      await db.userProgress.findMany({
        where: { userId, lessonId: { in: lessonIds }, status: 'COMPLETED' },
        select: { lessonId: true },
      })
    ).map((p) => p.lessonId),
  );

  // Find next lesson
  let nextLessonId: string | null = null;
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      if (!completedIds.has(lesson.id)) {
        nextLessonId = lesson.id;
        break;
      }
    }
    if (nextLessonId) break;
  }

  const totalXP = course.totalXP;
  const totalLessons = course.totalLessons;
  const completedLessons = completedIds.size;

  const difficultyColor: Record<string, string> = {
    BEGINNER: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    INTERMEDIATE: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    ADVANCED: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    EXPERT: 'text-red-400 bg-red-400/10 border-red-400/20',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border border-border rounded-xl p-6 bg-card">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <Code2 className="w-4 h-4" />
              <a href={course.repository.githubUrl} target="_blank" className="hover:text-foreground transition-colors">
                {course.repository.fullName}
              </a>
              <span>·</span>
              <Star className="w-3.5 h-3.5" />
              <span>{course.repository.stars.toLocaleString()}</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">{course.description}</p>
          </div>
          <Badge variant="outline" className={difficultyColor[course.difficulty] ?? ''}>
            {course.difficulty.charAt(0) + course.difficulty.slice(1).toLowerCase()}
          </Badge>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{totalLessons} lessons</span>
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{course.estimatedHours}h estimated</span>
          <span className="flex items-center gap-1.5"><Trophy className="w-4 h-4 text-xp" />{totalXP} XP total</span>
        </div>

        {enrollment && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{completedLessons}/{totalLessons} lessons</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        )}

        <div className="flex items-center gap-3">
          {nextLessonId ? (
            <Link href={`/learn/${courseId}/lesson/${nextLessonId}`}>
              <Button className="bg-g2c-600 hover:bg-g2c-700 text-white">
                {enrollment ? 'Continue learning' : 'Start course'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <Button disabled className="bg-emerald-600 text-white">
              <CheckCircle2 className="mr-2 w-4 h-4" /> Course completed
            </Button>
          )}
        </div>
      </div>

      {/* Learning objectives */}
      {course.learningGoals.length > 0 && (
        <div className="border border-border rounded-xl p-6 bg-card/50">
          <h2 className="font-semibold mb-3">What you&apos;ll learn</h2>
          <ul className="grid sm:grid-cols-2 gap-2">
            {course.learningGoals.map((goal) => (
              <li key={goal} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                {goal}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modules & Lessons */}
      <div>
        <h2 className="font-semibold text-lg mb-4">Course curriculum</h2>
        <div className="space-y-4">
          {course.modules.map((module) => {
            const moduleCompleted = module.lessons.filter((l) => completedIds.has(l.id)).length;
            return (
              <div key={module.id} className="border border-border rounded-xl overflow-hidden">
                <div className="p-4 bg-card border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{module.title}</h3>
                    <p className="text-muted-foreground text-sm mt-0.5">{module.description}</p>
                  </div>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {moduleCompleted}/{module.lessons.length}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {module.lessons.map((lesson) => {
                    const done = completedIds.has(lesson.id);
                    const isNext = lesson.id === nextLessonId;
                    return (
                      <Link
                        key={lesson.id}
                        href={`/learn/${courseId}/lesson/${lesson.id}`}
                        className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors group"
                      >
                        {done ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <Circle className={`w-5 h-5 flex-shrink-0 ${isNext ? 'text-g2c-400' : 'text-border'}`} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm truncate ${isNext ? 'text-g2c-400' : done ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{lesson.estimatedMinutes}m</span>
                            <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-xp" />{lesson.xpReward} XP</span>
                            <Badge variant="outline" className="text-xs py-0 h-4">
                              {lesson.difficulty.charAt(0) + lesson.difficulty.slice(1).toLowerCase()}
                            </Badge>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
