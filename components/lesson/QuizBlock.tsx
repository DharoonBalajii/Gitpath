'use client';

import { useState } from 'react';
import { Check, X, Zap, RotateCcw, Trophy, ArrowRight, Eye, Code2, Bug, Building2, MessageSquare, ListChecks } from 'lucide-react';
import type { GeneratedQuiz } from '@/lib/types/index';

const TYPE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  MULTIPLE_CHOICE: { label: 'Multiple choice', icon: ListChecks },
  ARCHITECTURE: { label: 'Architecture', icon: Building2 },
  CODE_COMPLETION: { label: 'Code completion', icon: Code2 },
  DEBUGGING: { label: 'Find the bug', icon: Bug },
  FREE_RESPONSE: { label: 'Free response', icon: MessageSquare },
};

function isCorrectOption(opt: string, answer: string): boolean {
  const o = opt.trim();
  const a = answer.trim();
  if (o === a) return true;
  if (a.length <= 2 && /^[A-Za-z]/.test(a) && new RegExp(`^${a}[).\\s]`).test(o)) return true;
  return false;
}

async function submitAnswer(quizId: string | undefined, answer: string, isCorrect: boolean) {
  if (!quizId) return;
  try {
    await fetch('/api/progress/quiz-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId, answer, isCorrect }),
    });
  } catch {
    // non-fatal — progress just won't be saved
  }
}

interface QuizBlockProps {
  quizzes: GeneratedQuiz[];
  quizIds?: string[];        // DB quiz IDs for server-side recording
  onComplete?: (xp: number) => void;
}

export function QuizBlock({ quizzes, quizIds, onComplete }: QuizBlockProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [openAnswer, setOpenAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [done, setDone] = useState(false);

  if (quizzes.length === 0) return null;

  const quiz = quizzes[index]!;
  const quizId = quizIds?.[index];
  const hasOptions = (quiz.options?.length ?? 0) > 0;
  const meta = TYPE_META[quiz.type] ?? TYPE_META.MULTIPLE_CHOICE!;
  const selectedCorrect = revealed && selected != null && isCorrectOption(selected, quiz.correctAnswer);

  const check = async () => {
    if (revealed) return;
    if (hasOptions && selected == null) return;
    setRevealed(true);
    const correct = !hasOptions || (selected != null && isCorrectOption(selected, quiz.correctAnswer));
    const xp = quiz.xpReward ?? 10;
    if (correct) {
      setCorrectCount((c) => c + 1);
      setEarnedXp((x) => x + xp);
    }
    const answer = hasOptions ? (selected ?? '') : openAnswer;
    await submitAnswer(quizId, answer, correct);
  };

  const next = () => {
    if (index + 1 >= quizzes.length) { setDone(true); onComplete?.(earnedXp); return; }
    setIndex((i) => i + 1); setSelected(null); setOpenAnswer(''); setRevealed(false);
  };

  const restart = () => {
    setIndex(0); setSelected(null); setOpenAnswer(''); setRevealed(false);
    setCorrectCount(0); setEarnedXp(0); setDone(false);
  };

  if (done) {
    const perfect = correctCount === quizzes.length;
    return (
      <div className="rounded-2xl gradient-border glass-card p-8 text-center">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${perfect ? 'accent-gradient-bg' : 'bg-amber-500/15'}`}>
          <Trophy className={`h-8 w-8 ${perfect ? 'text-white' : 'text-amber-500'}`} />
        </div>
        <h3 className="text-xl font-bold">{perfect ? 'Perfect!' : 'Quiz complete'}</h3>
        <p className="mt-1 text-muted-foreground">
          You scored <span className="font-semibold text-foreground">{correctCount}/{quizzes.length}</span> and earned{' '}
          <span className="font-semibold text-amber-500">+{earnedXp} XP</span>.
        </p>
        <button onClick={restart} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl gradient-border glass-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <meta.icon className="h-3.5 w-3.5" /> {meta.label}
        </span>
        <span className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
          <span>Q{index + 1}/{quizzes.length}</span>
          <span className="flex items-center gap-1 text-amber-500"><Zap className="h-3.5 w-3.5" /> {quiz.xpReward ?? 10} XP</span>
        </span>
      </div>
      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full accent-gradient-bg transition-all duration-500" style={{ width: `${((index + (revealed ? 1 : 0)) / quizzes.length) * 100}%` }} />
      </div>

      <h3 className="mb-4 text-lg font-semibold">{quiz.question}</h3>

      {quiz.codeContext && (
        <pre className="mb-4 overflow-x-auto rounded-lg border border-border bg-[#0d1117] p-3 font-mono text-xs text-slate-200">{quiz.codeContext}</pre>
      )}

      {hasOptions ? (
        <div className="space-y-2.5">
          {quiz.options!.map((opt) => {
            const isThis = selected === opt;
            const isAnswer = isCorrectOption(opt, quiz.correctAnswer);
            let cls = 'border-border bg-background hover:border-brand-violet/40 hover:bg-accent';
            if (revealed) {
              if (isAnswer) cls = 'border-emerald-500/50 bg-emerald-500/10';
              else if (isThis) cls = 'border-red-500/50 bg-red-500/10';
              else cls = 'border-border bg-background opacity-60';
            } else if (isThis) cls = 'border-brand-violet bg-brand-violet/10';
            return (
              <button key={opt} disabled={revealed} onClick={() => setSelected(opt)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all ${cls}`}>
                <span>{opt}</span>
                {revealed && isAnswer && <Check className="h-4 w-4 flex-shrink-0 text-emerald-500" />}
                {revealed && isThis && !isAnswer && <X className="h-4 w-4 flex-shrink-0 text-red-500" />}
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <textarea
            value={openAnswer}
            onChange={(e) => setOpenAnswer(e.target.value)}
            placeholder="Type your answer or attempt the code…"
            className="min-h-[96px] w-full rounded-xl border border-border bg-background p-3 font-mono text-sm outline-none focus:border-brand-violet/50"
          />
          {revealed && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-500">Reference solution</p>
              <pre className="overflow-x-auto rounded-lg border border-emerald-500/30 bg-[#0d1117] p-3 font-mono text-xs text-slate-200">{quiz.correctAnswer}</pre>
            </div>
          )}
        </div>
      )}

      {revealed && (
        <div className={`mt-4 rounded-xl border p-3 text-sm ${hasOptions ? (selectedCorrect ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-amber-500/40 bg-amber-500/10') : 'border-border bg-muted/40'}`}>
          {hasOptions && <p className={`mb-1 font-semibold ${selectedCorrect ? 'text-emerald-500' : 'text-amber-500'}`}>{selectedCorrect ? 'Correct!' : 'Not quite —'}</p>}
          {quiz.explanation && <p className="text-muted-foreground">{quiz.explanation}</p>}
        </div>
      )}

      <div className="mt-5 flex justify-end">
        {!revealed ? (
          <button onClick={check} disabled={hasOptions && selected == null}
            className="inline-flex items-center gap-2 rounded-lg accent-gradient-bg px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-violet/25 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
            {hasOptions ? 'Check answer' : <><Eye className="h-4 w-4" /> Reveal solution</>}
          </button>
        ) : (
          <button onClick={next} className="inline-flex items-center gap-2 rounded-lg accent-gradient-bg px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-violet/25 transition-all hover:opacity-90">
            {index + 1 >= quizzes.length ? 'Finish' : 'Next'} <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
