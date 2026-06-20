import Link from 'next/link';
import { GitBranch, Clock, CheckCircle2, Loader2, AlertCircle, BookOpen, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils/cn';

interface RepositoryCardProps {
  repository: {
    id: string;
    fullName: string;
    description: string | null;
    language: string | null;
    stars: number;
    courses: Array<{
      id: string;
      title: string;
      generationStatus: string;
      isPublished: boolean;
      totalLessons: number;
      enrollments: Array<{ progressPct: number }>;
    }>;
  };
}

const statusConfig = {
  PENDING: { icon: Clock, label: 'Queued', color: 'text-muted-foreground' },
  GENERATING: { icon: Loader2, label: 'Generating...', color: 'text-blue-400', animate: true },
  COMPLETED: { icon: CheckCircle2, label: 'Ready', color: 'text-emerald-400' },
  FAILED: { icon: AlertCircle, label: 'Failed', color: 'text-destructive' },
  PARTIAL: { icon: Clock, label: 'Partial', color: 'text-orange-400' },
};

export function RepositoryCard({ repository }: RepositoryCardProps) {
  const course = repository.courses[0];
  const genStatus = (course?.generationStatus ?? 'PENDING') as keyof typeof statusConfig;
  const StatusConfig = statusConfig[genStatus] ?? statusConfig.PENDING;
  const StatusIcon = StatusConfig.icon;
  const progressPct = course?.enrollments[0]?.progressPct ?? 0;
  const isReady = course?.isPublished && genStatus === 'COMPLETED';

  const card = (
    <div
      className={cn(
        'border border-border rounded-xl p-5 bg-card transition-all duration-200 group',
        isReady && 'hover:border-g2c-700 cursor-pointer',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <GitBranch className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="font-mono text-sm font-medium truncate">{repository.fullName}</span>
        </div>
        {repository.language && (
          <Badge variant="outline" className="text-xs flex-shrink-0">{repository.language}</Badge>
        )}
      </div>

      {repository.description && (
        <p className="text-muted-foreground text-xs mb-3 line-clamp-2 leading-relaxed">
          {repository.description}
        </p>
      )}

      {/* Status */}
      <div className={cn('flex items-center gap-1.5 text-xs mb-3', StatusConfig.color)}>
        <StatusIcon className={cn('w-3.5 h-3.5', (StatusConfig as { animate?: boolean }).animate && 'animate-spin')} />
        <span>{StatusConfig.label}</span>
      </div>

      {/* Course info */}
      {course && isReady && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {course.totalLessons} lessons
            </span>
            {progressPct > 0 && (
              <span className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-xp" />
                {Math.round(progressPct)}%
              </span>
            )}
          </div>
          {progressPct > 0 && <Progress value={progressPct} className="h-1" />}
        </div>
      )}
    </div>
  );

  if (isReady && course) {
    return <Link href={`/learn/${course.id}`}>{card}</Link>;
  }

  return card;
}
