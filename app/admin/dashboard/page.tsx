/**
 * app/admin/dashboard/page.tsx
 *
 * Admin statistics dashboard — /admin/dashboard
 *
 * Server component: verifies admin session on the server, then fetches stats
 * from /api/admin/stats and renders them.
 *
 * What's shown (safe, aggregate data only):
 *   - Total users / new users this week + month
 *   - Lesson completion totals and engagement rate
 *   - Quiz accuracy stats
 *   - XP and level aggregates
 *   - Recent user signups (name, email, level — no tokens or passwords)
 *   - Top users by XP
 *   - Daily completion and signup charts (7 / 30 day trends)
 *
 * What's NOT shown: GitHub tokens, passwords, session tokens, repo file content.
 */

import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin/auth';
import { db } from '@/lib/db';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';

// Force dynamic rendering — stats must be fresh on every request
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Verify admin cookie on the server side
  const session = await getAdminSession();
  if (!session) {
    // Not authenticated — redirect to admin login
    redirect('/admin/login');
  }

  // ── Fetch all stats server-side (runs in Node runtime, full Prisma access) ──
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

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
    lessonCompletionRows,
    signupRows,
  ] = await Promise.all([
    db.user.count({ where: { isFakeUser: false } }),
    db.user.count({ where: { isFakeUser: false, createdAt: { gte: sevenDaysAgo } } }),
    db.user.count({ where: { isFakeUser: false, createdAt: { gte: thirtyDaysAgo } } }),
    // completedAt != null means the lesson was completed (no separate status field)
    db.userProgress.count({ where: { completedAt: { not: null } } }),
    db.user.count({
      where: { isFakeUser: false, progress: { some: { completedAt: { not: null } } } },
    }),
    db.course.count(),
    db.course.count({ where: { generationStatus: 'COMPLETED' } }),
    db.quizAttempt.count(),
    db.quizAttempt.count({ where: { isCorrect: true } }),
    db.user.aggregate({
      where: { isFakeUser: false },
      _sum: { xp: true },
      _avg: { xp: true, level: true },
      _max: { xp: true, level: true },
    }),
    // Safe fields only — no GitHub tokens or auth secrets
    db.user.findMany({
      where: { isFakeUser: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, name: true, email: true, createdAt: true, level: true, xp: true },
    }),
    db.user.findMany({
      where: { isFakeUser: false },
      orderBy: { xp: 'desc' },
      take: 10,
      select: { id: true, name: true, email: true, level: true, xp: true },
    }),
    // Lessons completed in the last 7 days — group by completedAt date for chart
    db.userProgress.findMany({
      where: { completedAt: { gte: sevenDaysAgo, not: null } },
      select: { completedAt: true },
    }),
    db.user.findMany({
      where: { isFakeUser: false, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
  ]);

  // ── Aggregate chart data: date → count ─────────────────────────────────────
  const completionsByDate: Record<string, number> = {};
  for (const row of lessonCompletionRows) {
    if (!row.completedAt) continue;
    const d = row.completedAt.toISOString().slice(0, 10);
    completionsByDate[d] = (completionsByDate[d] ?? 0) + 1;
  }

  const signupsByDate: Record<string, number> = {};
  for (const row of signupRows) {
    const d = row.createdAt.toISOString().slice(0, 10);
    signupsByDate[d] = (signupsByDate[d] ?? 0) + 1;
  }

  // ── Build the stats object to pass down to the client component ───────────
  const stats = {
    totalUsers,
    newUsersThisWeek,
    newUsersThisMonth,
    totalLessonCompletions,
    usersWithCompletions,
    engagementRate: totalUsers > 0 ? Math.round((usersWithCompletions / totalUsers) * 100) : 0,
    totalCourses,
    completedCourses,
    totalQuizAttempts,
    correctQuizAttempts,
    quizAccuracy: totalQuizAttempts > 0
      ? Math.round((correctQuizAttempts / totalQuizAttempts) * 100)
      : 0,
    totalXpAwarded: xpAggregates._sum.xp ?? 0,
    avgXpPerUser: Math.round(xpAggregates._avg.xp ?? 0),
    avgLevel: parseFloat((xpAggregates._avg.level ?? 1).toFixed(1)),
    maxLevel: xpAggregates._max.level ?? 1,
    // Serialise dates to strings (server → client component boundary)
    recentUsers: recentUsers.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
    topUsersByXp,
    charts: { completionsByDate, signupsByDate },
    generatedAt: new Date().toISOString(),
  };

  // Hand off to the client component which handles interactivity (logout, refresh)
  return <AdminDashboardClient stats={stats} adminEmail={session.email} />;
}
