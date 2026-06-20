import { Zap, Flame, BookOpen, GitBranch } from 'lucide-react';
import { xpProgressInLevel } from '@/lib/utils/xp';

interface StatsCardsProps {
  xp: number;
  level: number;
  streak: number;
  completedLessons: number;
  enrolledCourses: number;
}

export function StatsCards({ xp, level, streak, completedLessons, enrolledCourses }: StatsCardsProps) {
  const { current, needed, pct } = xpProgressInLevel(xp, level);

  const stats = [
    {
      icon: Zap, label: 'Total XP', value: xp.toLocaleString(),
      sub: `Level ${level} · ${current}/${needed} XP`,
      gradient: 'from-brand-indigo to-brand-violet',
      progress: pct,
    },
    {
      icon: Flame, label: 'Current streak', value: `${streak}d`,
      sub: streak > 0 ? 'Keep it up!' : 'Start learning today',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      icon: BookOpen, label: 'Lessons done', value: completedLessons.toString(),
      sub: 'Total completed',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      icon: GitBranch, label: 'Courses', value: enrolledCourses.toString(),
      sub: 'Enrolled',
      gradient: 'from-brand-fuchsia to-brand-cyan',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="glow-hover rounded-2xl gradient-border glass-card p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
              <stat.icon className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
          <div className="text-xs text-muted-foreground mb-2">{stat.sub}</div>
          {stat.progress != null && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${stat.gradient} transition-all duration-700`}
                style={{ width: `${stat.progress}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
