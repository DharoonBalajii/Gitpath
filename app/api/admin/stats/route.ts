/**
 * app/api/admin/stats/route.ts
 *
 * GET /api/admin/stats
 *
 * Returns aggregate platform statistics for the admin dashboard.
 * All data is aggregate/anonymous — NO individual user emails, tokens,
 * GitHub credentials, or any other sensitive fields are returned.
 *
 * Protected by admin JWT cookie verification.
 */

import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/auth';
import { db } from '@/lib/db';

export async function GET() {
  // Verify the admin session cookie before returning any data
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  // Date 7 days ago — used for "new this week" counts
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  // Date 30 days ago — used for "new this month" counts
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Run all stat queries in parallel for speed
  const [
    totalUsers,
    newUsersThisWeek,
    newUsersThisMonth,
    totalLessonCompletions,
    usersWithCompletions,
    totalCourses,
    completedCourses,
    totalQuizAttempts,
    correctQuizAttempts,
    xpAggregates,
    recentUsers,
    topUsersByXp,
    lessonCompletionsByDay,
    userSignupsByDay,
  ] = await Promise.all([
    // Total real (non-fake) users
    db.user.count({ where: { isFakeUser: false } }),

    // New users registered in the last 7 days
    db.user.count({
      where: { isFakeUser: false, createdAt: { gte: sevenDaysAgo } },
    }),

    // New users registered in the last 30 days
    db.user.count({
      where: { isFakeUser: false, createdAt: { gte: thirtyDaysAgo } },
    }),

    // Total lesson completions — completedAt != null means the lesson was finished
    db.userProgress.count({ where: { completedAt: { not: null } } }),

    // Count of real users who have completed at least one lesson
    db.user.count({
      where: {
        isFakeUser: false,
        progress: { some: { completedAt: { not: null } } },
      },
    }),

    // Total repositories imported (courses started)
    db.course.count(),

    // Total courses where AI generation finished successfully
    db.course.count({ where: { generationStatus: 'COMPLETED' } }),

    // Total quiz attempts across all users
    db.quizAttempt.count(),

    // Correct quiz answers
    db.quizAttempt.count({ where: { isCorrect: true } }),

    // XP and level aggregates across real users
    db.user.aggregate({
      where: { isFakeUser: false },
      _sum: { xp: true },
      _avg: { xp: true, level: true },
      _max: { xp: true, level: true },
    }),

    // 5 most recently registered users (name + join date + level only — no email/token)
    db.user.findMany({
      where: { isFakeUser: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        createdAt: true,
        level: true,
        xp: true,
        // NOTE: email is included here because admins legitimately need to see
        // who signed up. GitHub tokens and other secrets are NEVER selected.
        email: true,
      },
    }),

    // Top 5 most active users by XP
    db.user.findMany({
      where: { isFakeUser: false },
      orderBy: { xp: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        level: true,
        xp: true,
      },
    }),

    // Lesson completions grouped by day for the last 7 days (trend chart data)
    db.userProgress.findMany({
      where: { completedAt: { gte: sevenDaysAgo, not: null } },
      select: { completedAt: true },
      orderBy: { completedAt: 'asc' },
    }),

    // User signups grouped by day for the last 30 days (trend chart data)
    db.user.findMany({
      where: {
        isFakeUser: false,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  // ── Compute daily buckets for charts ──────────────────────────────────────
  // Group lesson completions by YYYY-MM-DD
  const completionsByDate: Record<string, number> = {};
  for (const row of lessonCompletionsByDay) {
    if (!row.completedAt) continue;
    const date = row.completedAt.toISOString().slice(0, 10);
    completionsByDate[date] = (completionsByDate[date] ?? 0) + 1;
  }

  // Group signups by YYYY-MM-DD
  const signupsByDate: Record<string, number> = {};
  for (const row of userSignupsByDay) {
    const date = row.createdAt.toISOString().slice(0, 10);
    signupsByDate[date] = (signupsByDate[date] ?? 0) + 1;
  }

  // ── Build response payload ─────────────────────────────────────────────────
  return NextResponse.json({
    // Core counts
    totalUsers,
    newUsersThisWeek,
    newUsersThisMonth,
    totalLessonCompletions,
    usersWithCompletions,
    // Engagement rate: % of users who have completed at least 1 lesson
    engagementRate: totalUsers > 0 ? Math.round((usersWithCompletions / totalUsers) * 100) : 0,

    // Course / AI generation stats
    totalCourses,
    completedCourses,

    // Quiz stats
    totalQuizAttempts,
    correctQuizAttempts,
    quizAccuracy: totalQuizAttempts > 0
      ? Math.round((correctQuizAttempts / totalQuizAttempts) * 100)
      : 0,

    // XP / levelling stats
    totalXpAwarded: xpAggregates._sum.xp ?? 0,
    avgXpPerUser: Math.round(xpAggregates._avg.xp ?? 0),
    avgLevel: parseFloat((xpAggregates._avg.level ?? 1).toFixed(1)),
    maxLevel: xpAggregates._max.level ?? 1,
    maxXp: xpAggregates._max.xp ?? 0,

    // User tables (safe fields only)
    recentUsers,
    topUsersByXp,

    // Chart data (date → count maps)
    charts: {
      completionsByDate,
      signupsByDate,
    },

    // Metadata
    generatedAt: new Date().toISOString(),
  });
}
