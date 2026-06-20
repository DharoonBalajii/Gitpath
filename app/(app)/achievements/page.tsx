import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { Zap, Flame, BookOpen, Trophy, Lock } from 'lucide-react';

export const metadata = { title: 'Achievements' };

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [user, completedLessons, allBadges, earned] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id }, select: { xp: true, level: true, streak: true } }),
    db.userProgress.count({ where: { userId: session.user.id, status: 'COMPLETED' } }),
    db.badge.findMany({ orderBy: { xpThreshold: 'asc' } }),
    db.userBadge.findMany({ where: { userId: session.user.id }, select: { badgeId: true } }),
  ]);

  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;
  const streak = user?.streak ?? 0;
  const earnedIds = new Set(earned.map((e) => e.badgeId));

  const stats = [
    { icon: Zap, label: 'Total XP', value: xp.toLocaleString(), gradient: 'from-brand-indigo to-brand-violet' },
    { icon: Trophy, label: 'Level', value: String(level), gradient: 'from-amber-500 to-orange-500' },
    { icon: Flame, label: 'Day streak', value: `${streak}d`, gradient: 'from-rose-500 to-red-500' },
    { icon: BookOpen, label: 'Lessons done', value: String(completedLessons), gradient: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="mb-1 text-2xl font-bold">Achievements</h1>
        <p className="text-sm text-muted-foreground">Your progress, streaks, and earned badges</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glow-hover rounded-2xl gradient-border glass-card p-4">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${s.gradient} shadow-lg`}>
              <s.icon className="h-4 w-4 text-white" />
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Badges</h2>
        {allBadges.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">
            <Trophy className="mx-auto mb-3 h-8 w-8" />
            Badges unlock as you complete lessons and keep your streak going.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {allBadges.map((b) => {
              const unlocked = earnedIds.has(b.id);
              return (
                <div
                  key={b.id}
                  className={`rounded-2xl border border-border p-5 text-center transition-all ${unlocked ? 'glass-card glow-hover' : 'bg-muted/30 opacity-60'}`}
                >
                  <div className="mb-2 text-3xl">{unlocked ? b.icon : <Lock className="mx-auto h-7 w-7 text-muted-foreground" />}</div>
                  <p className="text-sm font-semibold">{b.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
