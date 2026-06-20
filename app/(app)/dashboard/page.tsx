import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { ImportRepositoryForm } from '@/components/dashboard/ImportRepositoryForm';
import { RepoPicker } from '@/components/dashboard/RepoPicker';
import { RepositoryCard } from '@/components/dashboard/RepositoryCard';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { VibeBar } from '@/components/dashboard/VibeBar';
import { SkeletonCard } from '@/components/shared/SkeletonCard';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Import a repository or continue learning</p>
      </div>

      <RepoPicker />
      <ImportRepositoryForm />

      <Suspense fallback={<div className="grid sm:grid-cols-3 gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}>
        <StatsSection />
      </Suspense>

      <Suspense fallback={<div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>}>
        <RepositoriesSection />
      </Suspense>
    </div>
  );
}

async function StatsSection() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { xp: true, level: true, streak: true, vibeScore: true },
  });

  const [completedLessons, enrolledCourses] = await Promise.all([
    db.userProgress.count({ where: { userId: session.user.id, completedAt: { not: null } } }),
    db.enrollment.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <div className="space-y-4">
      <StatsCards
        xp={user?.xp ?? 0}
        level={user?.level ?? 1}
        streak={user?.streak ?? 0}
        completedLessons={completedLessons}
        enrolledCourses={enrolledCourses}
      />
      <VibeBar rawVibe={user?.vibeScore ?? 0} />
    </div>
  );
}

async function RepositoriesSection() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Privacy: only show repos imported by this user
  const repositories = await db.repository.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: {
      courses: {
        select: {
          id: true,
          title: true,
          generationStatus: true,
          isPublished: true,
          totalLessons: true,
          enrollments: {
            where: { userId: session.user.id },
            select: { progressPct: true },
          },
        },
        take: 1,
      },
    },
  });

  if (repositories.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-xl">
        <p className="text-muted-foreground">No repositories yet. Import one above to get started.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">My Repositories</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {repositories.map((repo) => (
          <RepositoryCard key={repo.id} repository={repo} />
        ))}
      </div>
    </div>
  );
}
