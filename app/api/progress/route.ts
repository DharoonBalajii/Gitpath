// GET /api/progress — user dashboard data

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import type { APIResponse, UserDashboard } from '@/lib/types/index';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<APIResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const [user, enrollments, badges, conceptMastery, recentProgress] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true, xp: true, level: true, streak: true },
    }),
    db.enrollment.findMany({
      where: { userId },
      orderBy: { lastAccessAt: 'desc' },
      take: 10,
      include: {
        course: {
          select: {
            title: true,
            repository: { select: { fullName: true } },
            modules: {
              orderBy: { order: 'asc' },
              take: 1,
              include: {
                lessons: {
                  orderBy: { order: 'asc' },
                  take: 5,
                  select: { id: true, title: true },
                },
              },
            },
          },
        },
      },
    }),
    db.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
    }),
    db.conceptMastery.findMany({
      where: { userId },
      include: { concept: { select: { name: true, category: true } } },
    }),
    db.userProgress.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      take: 10,
      select: { completedAt: true, xpEarned: true, lesson: { select: { title: true } } },
    }),
  ]);

  if (!user) {
    return NextResponse.json<APIResponse>({ success: false, error: 'User not found' }, { status: 404 });
  }

  const stats = {
    totalLessonsCompleted: recentProgress.length,
    totalXP: user.xp,
    totalReposLearned: enrollments.filter((e) => e.completedAt !== null).length,
    avgQuizScore: 0, // computed separately if needed
    currentStreak: user.streak,
    longestStreak: user.streak,
  };

  const dashboard: UserDashboard = {
    user,
    enrollments: enrollments.map((e) => {
      // Find first incomplete lesson across modules
      const nextLesson = null; // simplified — full impl would scan modules
      return {
        courseId: e.courseId,
        courseTitle: e.course.title,
        repositoryFullName: e.course.repository.fullName,
        progressPct: e.progressPct,
        lastAccessAt: e.lastAccessAt,
        nextLesson,
      };
    }),
    recentActivity: recentProgress.map((p) => ({
      type: 'lesson_completed' as const,
      title: p.lesson?.title ?? 'Unknown lesson',
      xpEarned: p.xpEarned,
      timestamp: p.completedAt ?? new Date(),
    })),
    badges: badges.map((b) => ({
      slug: b.badge.slug,
      name: b.badge.name,
      icon: b.badge.icon,
      description: b.badge.description,
      awardedAt: b.awardedAt,
    })),
    skillGraph: conceptMastery.map((cm) => ({
      conceptSlug: cm.conceptSlug,
      conceptName: cm.concept.name,
      category: cm.concept.category,
      level: cm.level,
    })),
    stats,
  };

  return NextResponse.json<APIResponse>({ success: true, data: dashboard });
}
