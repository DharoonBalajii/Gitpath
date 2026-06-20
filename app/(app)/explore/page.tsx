import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { RepositoryCard } from '@/components/dashboard/RepositoryCard';
import { GitBranch } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Repositories' };

export default async function ExplorePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Privacy: only show repos this user imported
  const repositories = await db.repository.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      courses: {
        select: {
          id: true,
          title: true,
          generationStatus: true,
          isPublished: true,
          totalLessons: true,
          enrollments: { where: { userId: session.user.id }, select: { progressPct: true } },
        },
        take: 1,
      },
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="mb-1 text-2xl font-bold">Repositories</h1>
        <p className="text-sm text-muted-foreground">Your personal repository courses — only visible to you</p>
      </div>

      {repositories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <GitBranch className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="mb-4 text-muted-foreground">No repositories yet.</p>
          <Link href="/dashboard">
            <Button className="accent-gradient-bg border-0 text-white">Import your first repository</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {repositories.map((repo) => (
            <RepositoryCard key={repo.id} repository={repo} />
          ))}
        </div>
      )}
    </div>
  );
}
