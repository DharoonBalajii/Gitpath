import Link from 'next/link';
import { Code2, ArrowLeft } from 'lucide-react';
import { LessonTemplate } from '@/components/lesson/LessonTemplate';
import { ThemeToggle } from '@/components/ThemeToggle';
import { demoLesson } from '@/lib/demo/demo-lesson';

export const metadata = { title: 'Example lesson' };

export default function DemoLessonPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg accent-gradient-bg">
              <Code2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">Gitpath</span>
            <span className="ml-2 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">example lesson</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
          </div>
        </div>
      </nav>

      <LessonTemplate lesson={demoLesson} />
    </div>
  );
}
