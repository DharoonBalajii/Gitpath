'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpen, Code2, Network, Lightbulb, HelpCircle, Wrench, Clock, Zap, Signal,
  Check, AlertTriangle, Sparkles, ArrowRight, FileCode2, CheckCircle2,
} from 'lucide-react';
import type { GeneratedLesson } from '@/lib/types/index';
import { CodeWalkthrough } from './CodeWalkthrough';
import { QuizBlock } from './QuizBlock';
import { ConceptMapDesigns } from './ConceptMapDesigns';
import { LearnMore } from './LearnMore';

type Lesson = GeneratedLesson & {
  moduleTitle?: string;
  courseTitle?: string;
  lessonId?: string;
  quizIds?: string[];
  nextLessonId?: string;
  courseId?: string;
};

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'code', label: 'Code walkthrough', icon: Code2 },
  { id: 'map', label: 'Concept map', icon: Network },
  { id: 'deepdive', label: 'Deep dive', icon: Lightbulb },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle },
  { id: 'practice', label: 'Practice', icon: Wrench },
] as const;

const DIFFICULTY: Record<string, string> = {
  BEGINNER: 'text-emerald-500 bg-emerald-500/10',
  INTERMEDIATE: 'text-amber-500 bg-amber-500/10',
  ADVANCED: 'text-rose-500 bg-rose-500/10',
};

const md = {
  p: (p: { children?: React.ReactNode }) => <p className="mb-3 leading-relaxed text-muted-foreground">{p.children}</p>,
  strong: (p: { children?: React.ReactNode }) => <strong className="font-semibold text-foreground">{p.children}</strong>,
  code: (p: { children?: React.ReactNode }) => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">{p.children}</code>,
  ul: (p: { children?: React.ReactNode }) => <ul className="mb-3 list-disc space-y-1 pl-5 text-muted-foreground">{p.children}</ul>,
  li: (p: { children?: React.ReactNode }) => <li className="leading-relaxed">{p.children}</li>,
};

function Markdown({ children }: { children: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>{children}</ReactMarkdown>;
}

export function LessonTemplate({ lesson }: { lesson: Lesson }) {
  const router = useRouter();
  const [active, setActive] = useState('overview');
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: [0.1, 0.5] },
    );
    SECTIONS.forEach((s) => { const el = refs.current[s.id]; if (el) observer.observe(el); });
    return () => { window.removeEventListener('scroll', onScroll); observer.disconnect(); };
  }, []);

  const scrollTo = (id: string) => refs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const setRef = (id: string) => (el: HTMLElement | null) => { refs.current[id] = el; };

  const handleQuizComplete = async (xp: number) => {
    setEarnedXp(xp);
    setCompleted(true);
    if (lesson.lessonId) {
      try {
        await fetch('/api/progress/complete-lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId: lesson.lessonId, quizXp: xp }),
        });
      } catch {
        // non-fatal
      }
    }
  };

  const goNext = () => {
    if (lesson.nextLessonId && lesson.courseId) {
      router.push(`/learn/${lesson.courseId}/lesson/${lesson.nextLessonId}`);
    } else if (lesson.courseId) {
      router.push(`/learn/${lesson.courseId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* reading progress */}
      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent">
        <div className="h-full accent-gradient-bg transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>

      <div className="mx-auto flex max-w-6xl gap-10 px-6 py-10">
        {/* sticky TOC */}
        <aside className="hidden w-52 flex-shrink-0 lg:block">
          <div className="sticky top-10 space-y-1">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">On this page</p>
            {SECTIONS.map((s) => {
              const isActive = active === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive ? 'bg-gradient-to-r from-brand-indigo/15 to-brand-violet/10 font-medium text-brand-indigo dark:text-white' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <s.icon className="h-4 w-4" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* content */}
        <main className="min-w-0 flex-1 space-y-12">
          {/* header */}
          <header>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              {lesson.courseTitle && <span>{lesson.courseTitle}</span>}
              {lesson.moduleTitle && <><span>·</span><span>{lesson.moduleTitle}</span></>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{lesson.title}</h1>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{lesson.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5 text-sm">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${DIFFICULTY[lesson.difficulty] ?? 'bg-muted text-muted-foreground'}`}>
                <Signal className="h-3.5 w-3.5" /> {lesson.difficulty.toLowerCase()}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {lesson.estimatedMinutes} min</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 font-medium text-amber-500"><Zap className="h-3.5 w-3.5" /> {lesson.xpReward} XP</span>
            </div>
          </header>

          {/* overview */}
          <section ref={setRef('overview')} id="overview" className="scroll-mt-20">
            <SectionTitle icon={BookOpen} title="Overview" />
            <div className="rounded-2xl border border-border bg-card p-6">
              <Markdown>{lesson.explanation}</Markdown>
              {lesson.conceptsCovered.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Concepts covered</p>
                  <div className="flex flex-wrap gap-2">
                    {lesson.conceptsCovered.map((c) => (
                      <LearnMore key={c} concept={c} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* code walkthrough */}
          <section ref={setRef('code')} id="code" className="scroll-mt-20">
            <SectionTitle icon={Code2} title="Code walkthrough" subtitle="Read the actual file — stacked or step-by-step" />
            <CodeWalkthrough snippets={lesson.codeSnippets} />
          </section>

          {/* concept map */}
          <section ref={setRef('map')} id="map" className="scroll-mt-20">
            <SectionTitle icon={Network} title="Concept map" subtitle="Switch between three views of how the ideas connect" />
            <ConceptMapDesigns center={lesson.title} concepts={lesson.conceptsCovered} />
          </section>

          {/* deep dive */}
          <section ref={setRef('deepdive')} id="deepdive" className="scroll-mt-20 space-y-5">
            <SectionTitle icon={Lightbulb} title="Deep dive" />

            {lesson.realWorldAnalogy && (
              <div className="rounded-2xl border border-brand-cyan/30 bg-brand-cyan/5 p-5">
                <p className="mb-1.5 flex items-center gap-2 font-semibold text-brand-cyan"><Sparkles className="h-4 w-4" /> Real-world analogy</p>
                <p className="text-muted-foreground">{lesson.realWorldAnalogy}</p>
              </div>
            )}

            {lesson.keyTakeaways.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="mb-3 font-semibold">Key takeaways</p>
                <ul className="space-y-2">
                  {lesson.keyTakeaways.map((t, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              {lesson.bestPractices.length > 0 && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                  <p className="mb-3 flex items-center gap-2 font-semibold text-emerald-500"><Check className="h-4 w-4" /> Best practices</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {lesson.bestPractices.map((b, i) => <li key={i}>• {b}</li>)}
                  </ul>
                </div>
              )}
              {lesson.commonMistakes.length > 0 && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
                  <p className="mb-3 flex items-center gap-2 font-semibold text-rose-500"><AlertTriangle className="h-4 w-4" /> Common mistakes</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {lesson.commonMistakes.map((m, i) => <li key={i}>• {m}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {lesson.architecturalDecisions.map((d, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5">
                <p className="mb-2 font-semibold">Why: {d.decision}</p>
                <p className="mb-3 text-sm text-muted-foreground">{d.rationale}</p>
                <div className="grid gap-3 text-xs sm:grid-cols-2">
                  <div><span className="font-medium text-foreground">Alternatives</span><ul className="mt-1 space-y-1 text-muted-foreground">{d.alternatives.map((a, j) => <li key={j}>• {a}</li>)}</ul></div>
                  <div><span className="font-medium text-foreground">Trade-offs</span><ul className="mt-1 space-y-1 text-muted-foreground">{d.tradeoffs.map((t, j) => <li key={j}>• {t}</li>)}</ul></div>
                </div>
              </div>
            ))}
          </section>

          {/* quiz */}
          <section ref={setRef('quiz')} id="quiz" className="scroll-mt-20">
            <SectionTitle icon={HelpCircle} title="Check your understanding" subtitle="Answer to earn XP" />
            <QuizBlock
              quizzes={lesson.quizzes}
              quizIds={lesson.quizIds}
              onComplete={handleQuizComplete}
            />
          </section>

          {/* practice */}
          <section ref={setRef('practice')} id="practice" className="scroll-mt-20 space-y-5">
            <SectionTitle icon={Wrench} title="Build it yourself" />
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-muted-foreground">{lesson.practiceTask}</p>
            </div>

            {lesson.relatedFiles.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">Related files</p>
                <div className="flex flex-wrap gap-2">
                  {lesson.relatedFiles.map((f) => (
                    <span key={f} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-muted-foreground">
                      <FileCode2 className="h-3.5 w-3.5" /> {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* completion */}
            <div className={`rounded-2xl border p-6 text-center transition-all ${completed ? 'border-emerald-500/40 bg-emerald-500/5' : 'gradient-border glass-card'}`}>
              {completed ? (
                <>
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
                  <p className="font-semibold">Lesson complete — +{earnedXp + lesson.xpReward} XP earned!</p>
                  <p className="mt-1 text-sm text-muted-foreground">Concepts added to your profile.</p>
                </>
              ) : (
                <p className="text-muted-foreground">Finish the quiz above to complete this lesson.</p>
              )}
              <button
                onClick={goNext}
                disabled={!lesson.nextLessonId && !lesson.courseId}
                className="mt-4 inline-flex items-center gap-2 rounded-lg accent-gradient-bg px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-violet/25 transition-all hover:opacity-90 disabled:opacity-40"
              >
                {lesson.nextLessonId ? 'Next lesson' : 'Back to course'} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="flex items-center gap-2.5 text-xl font-bold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg accent-gradient-bg text-white"><Icon className="h-4 w-4" /></span>
        {title}
      </h2>
      {subtitle && <p className="mt-1 pl-10 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
