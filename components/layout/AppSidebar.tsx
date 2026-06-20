'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { LayoutDashboard, User, GitBranch, Trophy, Code2, Medal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/explore', icon: GitBranch, label: 'Repositories' },
  { href: '/leaderboard', icon: Medal, label: 'Leaderboard' },
  { href: '/achievements', icon: Trophy, label: 'Achievements' },
  { href: '/profile', icon: User, label: 'Profile' },
];

interface AppSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r border-border bg-card flex flex-col flex-shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl brand-gradient flex items-center justify-center shadow-lg shadow-brand-indigo/30">
            <Code2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">Gitpath</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-gradient-to-r from-brand-indigo/15 to-brand-violet/10 text-brand-indigo dark:text-white border border-brand-violet/30 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-border space-y-1">
        <Link href="/profile" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
          <Avatar className="w-7 h-7">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="text-xs bg-gp-800">
              {user.name?.[0]?.toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name ?? 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </Link>
        <div className="flex items-center justify-center gap-3 px-3 py-1">
          <Link href="/privacy" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
          <span className="text-muted-foreground/40 text-[10px]">·</span>
          <Link href="/terms" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
        </div>
      </div>
    </aside>
  );
}
