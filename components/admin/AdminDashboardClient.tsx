/**
 * components/admin/AdminDashboardClient.tsx
 *
 * Client component for the admin dashboard UI.
 * Receives pre-fetched stats from the server component as props.
 *
 * Handles:
 *  - Logout button (calls DELETE /api/admin/auth, then navigates away)
 *  - Refresh button (calls router.refresh() to re-run the server component)
 *  - All stat card and table rendering
 *
 * No sensitive data ever touches this component — all fields come from
 * the safe subset returned by the server component.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, BookOpen, Trophy, Target, Zap, TrendingUp,
  LogOut, RefreshCw, Code2, CheckCircle2, BarChart3, Medal,
  Calendar, Star,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  level: number;
  xp: number;
  createdAt?: string; // ISO string
}

interface AdminStats {
  totalUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalLessonCompletions: number;
  usersWithCompletions: number;
  engagementRate: number;
  totalCourses: number;
  completedCourses: number;
  totalQuizAttempts: number;
  correctQuizAttempts: number;
  quizAccuracy: number;
  totalXpAwarded: number;
  avgXpPerUser: number;
  avgLevel: number;
  maxLevel: number;
  recentUsers: UserRow[];
  topUsersByXp: UserRow[];
  charts: {
    completionsByDate: Record<string, number>;
    signupsByDate: Record<string, number>;
  };
  generatedAt: string;
}

interface Props {
  stats: AdminStats;
  adminEmail: string;
}

// ─── Stat card sub-component ──────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'indigo',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: 'indigo' | 'emerald' | 'amber' | 'violet' | 'rose';
}) {
  // Map color names to Tailwind classes
  const colorMap = {
    indigo: 'bg-indigo-500/10 text-indigo-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    amber: 'bg-amber-500/10 text-amber-500',
    violet: 'bg-violet-500/10 text-violet-500',
    rose: 'bg-rose-500/10 text-rose-500',
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// ─── Main dashboard component ─────────────────────────────────────────────────
export function AdminDashboardClient({ stats, adminEmail }: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Logout: clear the admin cookie and redirect to login ──────────────────
  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  }

  // ── Refresh: re-run the server component to get latest stats ──────────────
  async function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    // Give the server a moment, then clear the spinner
    setTimeout(() => setRefreshing(false), 800);
  }

  // Format large numbers with commas (e.g. 1234 → "1,234")
  const fmt = (n: number) => n.toLocaleString();

  // Format ISO date string to "Jun 20, 2026"
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          {/* Logo + title */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <Code2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">Admin Dashboard</p>
              <p className="text-[11px] text-muted-foreground">{adminEmail}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:block">
              Updated {fmtDate(stats.generatedAt)}
            </span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              {loggingOut ? 'Logging out…' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {/* ── Section: Users ── */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Users
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Total users"
              value={fmt(stats.totalUsers)}
              sub="Real accounts (not seeded)"
              color="indigo"
            />
            <StatCard
              icon={TrendingUp}
              label="New this week"
              value={`+${fmt(stats.newUsersThisWeek)}`}
              sub={`+${fmt(stats.newUsersThisMonth)} this month`}
              color="emerald"
            />
            <StatCard
              icon={CheckCircle2}
              label="Active learners"
              value={fmt(stats.usersWithCompletions)}
              sub="Completed ≥1 lesson"
              color="violet"
            />
            <StatCard
              icon={Target}
              label="Engagement rate"
              value={`${stats.engagementRate}%`}
              sub="Users with lesson completions"
              color="amber"
            />
          </div>
        </section>

        {/* ── Section: Learning ── */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Learning
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={BookOpen}
              label="Lesson completions"
              value={fmt(stats.totalLessonCompletions)}
              sub="Across all users"
              color="indigo"
            />
            <StatCard
              icon={BarChart3}
              label="Quiz attempts"
              value={fmt(stats.totalQuizAttempts)}
              sub={`${fmt(stats.correctQuizAttempts)} correct`}
              color="emerald"
            />
            <StatCard
              icon={Target}
              label="Quiz accuracy"
              value={`${stats.quizAccuracy}%`}
              sub="Correct answers / total"
              color="violet"
            />
            <StatCard
              icon={Code2}
              label="Courses generated"
              value={`${fmt(stats.completedCourses)} / ${fmt(stats.totalCourses)}`}
              sub="Completed / started"
              color="amber"
            />
          </div>
        </section>

        {/* ── Section: XP & Levels ── */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Gamification
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Zap}
              label="Total XP awarded"
              value={fmt(stats.totalXpAwarded)}
              sub="Sum across all real users"
              color="amber"
            />
            <StatCard
              icon={Trophy}
              label="Average XP / user"
              value={fmt(stats.avgXpPerUser)}
              color="indigo"
            />
            <StatCard
              icon={Star}
              label="Average level"
              value={stats.avgLevel.toFixed(1)}
              sub={`Highest: Level ${stats.maxLevel}`}
              color="violet"
            />
            <StatCard
              icon={Medal}
              label="Max level reached"
              value={`Level ${stats.maxLevel}`}
              color="emerald"
            />
          </div>
        </section>

        {/* ── Section: Charts (simple text-based trend) ── */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Completions last 7 days */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              Lesson completions — last 7 days
            </h3>
            <DayBarChart data={stats.charts.completionsByDate} days={7} color="indigo" />
          </div>

          {/* Signups last 30 days */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Users className="h-4 w-4 text-emerald-500" />
              New signups — last 30 days
            </h3>
            <DayBarChart data={stats.charts.signupsByDate} days={30} color="emerald" />
          </div>
        </section>

        {/* ── Section: User Tables ── */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Recent signups */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h3 className="flex items-center gap-2 font-semibold">
                <Calendar className="h-4 w-4 text-indigo-500" />
                Recent signups
              </h3>
            </div>
            <div className="divide-y divide-border">
              {stats.recentUsers.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">No users yet</p>
              ) : (
                stats.recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-6 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{u.name ?? 'Unknown'}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 text-right">
                      <p className="text-xs font-medium">Lv. {u.level}</p>
                      {u.createdAt && (
                        <p className="text-xs text-muted-foreground">{fmtDate(u.createdAt)}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top users by XP */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h3 className="flex items-center gap-2 font-semibold">
                <Trophy className="h-4 w-4 text-amber-500" />
                Top learners by XP
              </h3>
            </div>
            <div className="divide-y divide-border">
              {stats.topUsersByXp.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">No users yet</p>
              ) : (
                stats.topUsersByXp.map((u, i) => (
                  <div key={u.id} className="flex items-center justify-between px-6 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank badge */}
                      <span className={`flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                        i === 0 ? 'bg-amber-400/20 text-amber-500' :
                        i === 1 ? 'bg-slate-400/20 text-slate-500' :
                        i === 2 ? 'bg-orange-400/20 text-orange-500' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{u.name ?? 'Unknown'}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 text-right">
                      <p className="text-xs font-semibold text-amber-500">{fmt(u.xp)} XP</p>
                      <p className="text-xs text-muted-foreground">Lv. {u.level}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Footer note */}
        <p className="pb-4 text-center text-xs text-muted-foreground">
          Admin panel · Gitpath · Data updated at {new Date(stats.generatedAt).toLocaleTimeString()}
        </p>
      </main>
    </div>
  );
}

// ─── Simple bar chart using CSS bars ─────────────────────────────────────────
/**
 * Renders a horizontal bar-chart-like grid for day-by-day data.
 * Uses pure CSS — no charting library needed for the admin panel.
 */
function DayBarChart({
  data,
  days,
  color,
}: {
  data: Record<string, number>;
  days: number;
  color: 'indigo' | 'emerald';
}) {
  // Build array of the last N days
  const buckets: { label: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    buckets.push({ label, value: data[key] ?? 0 });
  }

  const max = Math.max(...buckets.map((b) => b.value), 1);
  const barColor = color === 'indigo' ? 'bg-indigo-500' : 'bg-emerald-500';
  const total = buckets.reduce((s, b) => s + b.value, 0);

  if (total === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No data in this period yet
      </p>
    );
  }

  return (
    <div>
      {/* Total above the chart */}
      <p className="mb-3 text-2xl font-bold">{total.toLocaleString()}</p>

      {/* Bars — show every Nth label to avoid crowding */}
      <div className="flex items-end gap-px h-20 w-full">
        {buckets.map((b, i) => (
          <div
            key={i}
            className="group relative flex-1 flex flex-col items-center justify-end"
            title={`${b.label}: ${b.value}`}
          >
            <div
              className={`w-full rounded-sm ${barColor} opacity-80 transition-all`}
              style={{ height: `${Math.max(4, (b.value / max) * 100)}%` }}
            />
            {/* Tooltip on hover */}
            <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background whitespace-nowrap shadow">
              {b.label}: {b.value}
            </div>
          </div>
        ))}
      </div>

      {/* Show first, middle, last date labels */}
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{buckets[0]?.label}</span>
        <span>{buckets[Math.floor(buckets.length / 2)]?.label}</span>
        <span>{buckets[buckets.length - 1]?.label}</span>
      </div>
    </div>
  );
}
