import { auth, signOut } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { Button } from '@/components/ui/button';
import { Flame } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface TopBarProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export async function TopBar({ user: _user }: TopBarProps) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { xp: true, level: true, streak: true },
  });

  const xp = dbUser?.xp ?? 0;
  const level = dbUser?.level ?? 1;
  const streak = dbUser?.streak ?? 0;
  const xpForCurrentLevel = (level - 1) * 500;
  const xpProgress = ((xp - xpForCurrentLevel) / 500) * 100;

  return (
    <header className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
      {/* XP Progress */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-g2c-600 flex items-center justify-center text-xs font-bold text-white">
            {level}
          </div>
          <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-g2c-500 rounded-full xp-fill"
              style={{ width: `${Math.min(100, xpProgress)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{xp} XP</span>
        </div>

        {streak > 0 && (
          <div className="flex items-center gap-1 text-xp text-sm font-medium">
            <Flame className="w-4 h-4" />
            <span>{streak}d</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <form action={async () => {
          'use server';
          await signOut({ redirectTo: '/' });
        }}>
          <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
