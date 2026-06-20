import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { Trophy, Zap, Crown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { levelFromXp, xpProgressInLevel } from '@/lib/utils/xp';

export const metadata = { title: 'Leaderboard' };

const RANK_STYLE: Record<number, { bg: string; text: string; icon?: React.ComponentType<{ className?: string }> }> = {
  1: { bg: 'from-amber-500/20 to-yellow-400/10 border-amber-500/40', text: 'text-amber-500', icon: Crown },
  2: { bg: 'from-slate-400/15 to-slate-300/5 border-slate-400/30', text: 'text-slate-400' },
  3: { bg: 'from-orange-700/15 to-orange-600/5 border-orange-700/30', text: 'text-orange-600' },
};

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const top = await db.user.findMany({
    orderBy: { xp: 'desc' },
    take: 10,
    select: { id: true, name: true, email: true, image: true, xp: true, level: true, isFakeUser: true },
  });

  const myRank = top.findIndex((u) => u.id === session.user!.id) + 1;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="mb-1 text-2xl font-bold">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Top learners by XP — complete lessons and quizzes to climb</p>
      </div>

      {myRank > 0 && (
        <div className="rounded-2xl border border-brand-violet/30 bg-brand-violet/5 px-5 py-3 text-sm">
          You are ranked <span className="font-bold text-brand-violet">#{myRank}</span> — keep learning to move up!
        </div>
      )}

      <div className="space-y-2">
        {top.map((user, idx) => {
          const rank = idx + 1;
          const style = RANK_STYLE[rank];
          const isMe = user.id === session.user!.id;
          const level = levelFromXp(user.xp);
          const { pct } = xpProgressInLevel(user.xp, level);

          return (
            <div
              key={user.id}
              className={`flex items-center gap-4 rounded-2xl border bg-gradient-to-r p-4 transition-all ${
                style ? `${style.bg}` : 'border-border bg-card hover:bg-accent/20'
              } ${isMe ? 'ring-2 ring-brand-violet/40' : ''}`}
            >
              {/* Rank */}
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${style ? style.text : 'text-muted-foreground'}`}>
                {style?.icon ? <style.icon className="h-5 w-5" /> : `#${rank}`}
              </div>

              {/* Avatar */}
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback className="bg-g2c-800 text-sm">{(user.name?.[0] ?? '?').toUpperCase()}</AvatarFallback>
              </Avatar>

              {/* Name + XP bar */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold">{user.isFakeUser ? user.name : (user.name ?? user.email?.split('@')[0] ?? 'Anonymous')}</p>
                  {isMe && <span className="rounded-full bg-brand-violet px-2 py-0.5 text-[10px] font-bold text-white">YOU</span>}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full accent-gradient-bg rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="flex-shrink-0 text-xs text-muted-foreground">Lv.{level}</span>
                </div>
              </div>

              {/* XP */}
              <div className="flex flex-shrink-0 items-center gap-1 font-bold text-amber-500">
                <Zap className="h-4 w-4" />
                {user.xp.toLocaleString()}
              </div>
            </div>
          );
        })}

        {top.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
            <Trophy className="mx-auto mb-3 h-8 w-8" />
            No learners yet — be the first to earn XP!
          </div>
        )}
      </div>
    </div>
  );
}
