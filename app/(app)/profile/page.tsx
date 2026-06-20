import { auth, signOut } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Github, LogOut, CheckCircle2, Brain, BookMarked } from 'lucide-react';
import { xpProgressInLevel } from '@/lib/utils/xp';
import { DeleteAccountSection } from '@/components/profile/DeleteAccountSection';

export const metadata = { title: 'Profile' };

const MASTERY_LABEL: Record<number, { label: string; color: string }> = {
  1: { label: 'Introduced', color: 'border-sky-500/40 bg-sky-500/10 text-sky-400' },
  2: { label: 'Practiced', color: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
  3: { label: 'Mastered', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true, email: true, image: true, githubUsername: true,
      xp: true, level: true, streak: true, createdAt: true,
      deletionRequestedAt: true,
      conceptMastery: {
        where: { level: { gte: 1 } },
        orderBy: { level: 'desc' },
        select: { conceptSlug: true, level: true, lastSeenAt: true },
      },
    },
  });
  if (!user) return null;

  // Completed lessons with course context
  const completedProgress = await db.userProgress.findMany({
    where: { userId: session.user.id, completedAt: { not: null } },
    orderBy: { completedAt: 'desc' },
    take: 20,
    include: {
      lesson: {
        select: {
          title: true,
          xpReward: true,
          module: { select: { title: true, course: { select: { title: true } } } },
        },
      },
    },
  });

  const { current, needed, pct } = xpProgressInLevel(user.xp, user.level);
  const mastered = user.conceptMastery.filter((c) => c.level === 3);
  const practiced = user.conceptMastery.filter((c) => c.level === 2);
  const introduced = user.conceptMastery.filter((c) => c.level === 1);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="mb-1 text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account, learning stats, and mastered concepts</p>
      </div>

      {/* Identity card */}
      <div className="rounded-2xl gradient-border glass-card p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="bg-muted text-lg">{user.name?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{user.name ?? 'User'}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            {user.githubUsername && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Github className="h-3.5 w-3.5" /> @{user.githubUsername}
              </p>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-2xl font-bold">{user.xp.toLocaleString()} XP</p>
            <p className="text-sm text-muted-foreground">Level {user.level}</p>
          </div>
        </div>

        {/* Level progress */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Level {user.level} → {user.level + 1}</span>
            <span>{current} / {needed} XP</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full accent-gradient-bg transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Streak', value: `${user.streak}d` },
            { label: 'Concepts', value: String(user.conceptMastery.length) },
            { label: 'Mastered', value: String(mastered.length) },
            { label: 'Member since', value: new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) },
          ].map((f) => (
            <div key={f.label} className="rounded-xl border border-border bg-background/40 p-3">
              <div className="text-lg font-bold">{f.value}</div>
              <div className="text-xs text-muted-foreground">{f.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Concepts I've Mastered */}
      {user.conceptMastery.length > 0 && (
        <div className="rounded-2xl gradient-border glass-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Brain className="h-5 w-5 text-brand-violet" /> Concepts I&apos;ve Mastered
          </h2>

          {mastered.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-500">Mastered</p>
              <div className="flex flex-wrap gap-2">
                {mastered.map((c) => (
                  <span key={c.conceptSlug} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> {c.conceptSlug.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {practiced.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-500">Practiced</p>
              <div className="flex flex-wrap gap-2">
                {practiced.map((c) => (
                  <span key={c.conceptSlug} className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                    {c.conceptSlug.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {introduced.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-sky-500">Introduced</p>
              <div className="flex flex-wrap gap-2">
                {introduced.map((c) => (
                  <span key={c.conceptSlug} className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400">
                    {c.conceptSlug.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completed Lessons */}
      {completedProgress.length > 0 && (
        <div className="rounded-2xl gradient-border glass-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <BookMarked className="h-5 w-5 text-brand-cyan" /> Completed Lessons
          </h2>
          <div className="space-y-2">
            {completedProgress.map((p) => {
              if (!p.lesson) return null;
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.lesson.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.lesson.module?.course?.title} · {p.lesson.module?.title}
                    </p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-500">
                    +{p.xpEarned} XP
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Account actions */}
      <div className="flex flex-wrap gap-3">
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}
        >
          <Button type="submit" variant="outline" className="border-border">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </form>
      </div>

      {/* Danger zone */}
      <DeleteAccountSection deletionRequestedAt={user.deletionRequestedAt} />
    </div>
  );
}
