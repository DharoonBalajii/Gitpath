'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ChevronLeft, ChevronRight, CheckCircle2, Trophy, Clock, Lightbulb,
  Code2, Layers, Target, BookOpen, Cpu, MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuizCard } from '@/components/quiz/QuizCard';
import { FlowDiagram } from '@/components/course/FlowDiagram';
import { TutorPanel } from '@/components/tutor/TutorPanel';
import type { CodeSnippet, ArchitecturalDecision } from '@/lib/types/index';

interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedMinutes: number;
  explanation: string;
  codeSnippets: CodeSnippet[];
  flowDiagram: string | null;
  realWorldAnalogy: string;
  summary: string;
  practiceTask: string;
  keyTakeaways: string[];
  architecturalDecisions: ArchitecturalDecision[];
  bestPractices: string[];
  commonMistakes: string[];
  xpReward: number;
  quizzes: Array<{
    id: string;
    type: string;
    question: string;
    options: string[] | null;
    correctAnswer: string;
    explanation: string;
    codeContext: string | null;
    difficulty: string;
    xpReward: number;
  }>;
}

interface LessonViewerProps {
  lesson: Lesson;
  courseId: string;
  prevLesson: { id: string; title: string } | null;
  nextLesson: { id: string; title: string } | null;
  isCompleted: boolean;
  totalLessons: number;
  completedCount: number;
  quizAttemptMap: Record<string, { isCorrect: boolean; answer: string }>;
  repositoryId: string;
}

export function LessonViewer({
  lesson,
  courseId,
  prevLesson,
  nextLesson,
  isCompleted: initialCompleted,
  totalLessons,
  completedCount,
  quizAttemptMap,
  repositoryId,
}: LessonViewerProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [xpEarned, setXpEarned] = useState(0);
  const [showXP, setShowXP] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleComplete = () => {
    startTransition(async () => {
      const res = await fetch(`/api/lessons/${lesson.id}/complete`, { method: 'POST' });
      const data = await res.json() as { success: boolean; data?: { xpEarned: number; alreadyCompleted?: boolean } };
      if (data.success && !data.data?.alreadyCompleted) {
        setCompleted(true);
        setXpEarned(data.data?.xpEarned ?? 0);
        setShowXP(true);
        setTimeout(() => setShowXP(false), 3000);
      }
    });
  };

  const codeSnippets = Array.isArray(lesson.codeSnippets)
    ? (lesson.codeSnippets as CodeSnippet[])
    : [];

  const architecturalDecisions = Array.isArray(lesson.architecturalDecisions)
    ? (lesson.architecturalDecisions as ArchitecturalDecision[])
    : [];

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
              <Link href={`/learn/${courseId}`} className="hover:text-foreground transition-colors flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Course
              </Link>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
                <p className="text-muted-foreground text-sm">{lesson.description}</p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <Badge variant="outline" className="text-xp border-xp/30 bg-xp/5">
                  <Trophy className="w-3 h-3 mr-1" />{lesson.xpReward} XP
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />{lesson.estimatedMinutes}m
                </Badge>
              </div>
            </div>

            {/* Course progress */}
            <div className="mt-4 flex items-center gap-3">
              <Progress value={(completedCount / totalLessons) * 100} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {completedCount}/{totalLessons} done
              </span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="lesson">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="lesson"><BookOpen className="w-3.5 h-3.5 mr-1.5" />Lesson</TabsTrigger>
              {codeSnippets.length > 0 && (
                <TabsTrigger value="code"><Code2 className="w-3.5 h-3.5 mr-1.5" />Code</TabsTrigger>
              )}
              {lesson.quizzes.length > 0 && (
                <TabsTrigger value="quiz"><Target className="w-3.5 h-3.5 mr-1.5" />Quiz</TabsTrigger>
              )}
              {architecturalDecisions.length > 0 && (
                <TabsTrigger value="architecture"><Layers className="w-3.5 h-3.5 mr-1.5" />Architecture</TabsTrigger>
              )}
            </TabsList>

            {/* Lesson tab */}
            <TabsContent value="lesson" className="space-y-6 mt-4">
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.explanation}</ReactMarkdown>
              </div>

              {/* Real-world analogy */}
              <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-5">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-2">
                  <Lightbulb className="w-4 h-4" /> Real-world analogy
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{lesson.realWorldAnalogy}</p>
              </div>

              {/* Flow diagram */}
              {lesson.flowDiagram && <FlowDiagram definition={lesson.flowDiagram} />}

              {/* Key takeaways */}
              {lesson.keyTakeaways.length > 0 && (
                <div className="border border-g2c-700/50 bg-g2c-900/30 rounded-xl p-5">
                  <h3 className="font-semibold text-sm mb-3 text-g2c-300">Key takeaways</h3>
                  <ul className="space-y-2">
                    {lesson.keyTakeaways.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-g2c-400 flex-shrink-0 mt-0.5" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Practice task */}
              <div className="border border-purple-500/20 bg-purple-500/5 rounded-xl p-5">
                <div className="flex items-center gap-2 text-purple-400 text-sm font-medium mb-2">
                  <Cpu className="w-4 h-4" /> Practice task
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{lesson.practiceTask}</p>
              </div>

              {/* Summary */}
              <div className="border border-border rounded-xl p-5 bg-card">
                <h3 className="font-semibold text-sm mb-2">Summary</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{lesson.summary}</p>
              </div>
            </TabsContent>

            {/* Code tab */}
            {codeSnippets.length > 0 && (
              <TabsContent value="code" className="space-y-4 mt-4">
                {codeSnippets.map((snippet, i) => (
                  <div key={i} className="border border-border rounded-xl overflow-hidden">
                    <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between">
                      <span className="font-mono text-xs text-muted-foreground">{snippet.filename}</span>
                      <Badge variant="outline" className="text-xs">{snippet.language}</Badge>
                    </div>
                    <pre className="p-4 overflow-x-auto text-sm">
                      <code className="font-mono text-foreground">{snippet.code}</code>
                    </pre>
                    {snippet.explanation && (
                      <div className="px-4 pb-4 pt-2 text-sm text-muted-foreground border-t border-border bg-card/50">
                        {snippet.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>
            )}

            {/* Quiz tab */}
            {lesson.quizzes.length > 0 && (
              <TabsContent value="quiz" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  {lesson.quizzes.length} quiz question{lesson.quizzes.length > 1 ? 's' : ''} for this lesson.
                  Complete them to earn extra XP.
                </p>
                {lesson.quizzes.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    previousAttempt={quizAttemptMap[quiz.id]}
                  />
                ))}
              </TabsContent>
            )}

            {/* Architecture tab */}
            {architecturalDecisions.length > 0 && (
              <TabsContent value="architecture" className="space-y-4 mt-4">
                {architecturalDecisions.map((decision, i) => (
                  <div key={i} className="border border-border rounded-xl p-5 bg-card space-y-3">
                    <h3 className="font-semibold">{decision.decision}</h3>
                    <p className="text-sm text-muted-foreground">{decision.rationale}</p>
                    {decision.alternatives.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Alternatives</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {decision.alternatives.map((alt) => (
                            <li key={alt} className="flex items-start gap-2">
                              <span className="text-border">—</span> {alt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {decision.tradeoffs.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Trade-offs</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {decision.tradeoffs.map((t) => (
                            <li key={t} className="flex items-start gap-2">
                              <span className="text-border">—</span> {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>
            )}
          </Tabs>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {prevLesson ? (
              <Link href={`/learn/${courseId}/lesson/${prevLesson.id}`}>
                <Button variant="outline" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  <span className="max-w-32 truncate">{prevLesson.title}</span>
                </Button>
              </Link>
            ) : <div />}

            {!completed ? (
              <Button
                onClick={handleComplete}
                disabled={isPending}
                className="bg-g2c-600 hover:bg-g2c-700 text-white"
              >
                {isPending ? 'Saving...' : 'Mark complete'}
                <CheckCircle2 className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" /> Completed
              </div>
            )}

            {nextLesson ? (
              <Link href={`/learn/${courseId}/lesson/${nextLesson.id}`}>
                <Button variant="outline" size="sm">
                  <span className="max-w-32 truncate">{nextLesson.title}</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : <div />}
          </div>
        </div>
      </div>

      {/* AI Tutor panel */}
      <div className={`border-l border-border bg-card transition-all duration-300 flex-shrink-0 ${tutorOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
        {tutorOpen && <TutorPanel repositoryId={repositoryId} onClose={() => setTutorOpen(false)} />}
      </div>

      {/* Tutor toggle */}
      <button
        onClick={() => setTutorOpen(!tutorOpen)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-g2c-600 hover:bg-g2c-700 flex items-center justify-center shadow-lg transition-colors"
      >
        <MessageSquare className="w-5 h-5 text-white" />
      </button>

      {/* XP toast */}
      {showXP && (
        <div className="fixed top-20 right-6 bg-xp text-black px-4 py-2 rounded-full font-bold text-sm animate-slide-up shadow-lg">
          +{xpEarned} XP! 🎉
        </div>
      )}
    </div>
  );
}
