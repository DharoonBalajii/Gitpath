'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, XCircle, Trophy, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

interface Quiz {
  id: string;
  type: string;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string;
  codeContext: string | null;
  difficulty: string;
  xpReward: number;
}

interface QuizCardProps {
  quiz: Quiz;
  previousAttempt?: { isCorrect: boolean; answer: string };
}

export function QuizCard({ quiz, previousAttempt }: QuizCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState(previousAttempt?.answer ?? '');
  const [result, setResult] = useState<{ isCorrect: boolean; explanation: string; xpEarned: number } | null>(
    previousAttempt
      ? {
          isCorrect: previousAttempt.isCorrect,
          explanation: quiz.explanation,
          xpEarned: previousAttempt.isCorrect ? quiz.xpReward : 0,
        }
      : null,
  );
  const [isPending, startTransition] = useTransition();

  const isMultipleChoice = quiz.type === 'MULTIPLE_CHOICE' && quiz.options && quiz.options.length > 0;
  const isAnswered = result !== null;

  const handleSubmit = () => {
    if (!selectedAnswer.trim()) return;
    startTransition(async () => {
      const res = await fetch(`/api/quiz/${quiz.id}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: selectedAnswer }),
      });
      const data = await res.json() as { success: boolean; data?: { isCorrect: boolean; explanation: string; xpEarned: number } };
      if (data.success && data.data) {
        setResult(data.data);
      }
    });
  };

  const difficultyColor: Record<string, string> = {
    BEGINNER: 'text-emerald-400 border-emerald-400/30',
    INTERMEDIATE: 'text-blue-400 border-blue-400/30',
    ADVANCED: 'text-orange-400 border-orange-400/30',
    EXPERT: 'text-red-400 border-red-400/30',
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-card border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{quiz.type.replace('_', ' ')}</Badge>
          <Badge variant="outline" className={cn('text-xs', difficultyColor[quiz.difficulty] ?? '')}>
            {quiz.difficulty.charAt(0) + quiz.difficulty.slice(1).toLowerCase()}
          </Badge>
        </div>
        <Badge variant="outline" className="text-xp border-xp/30 text-xs">
          <Trophy className="w-2.5 h-2.5 mr-1" />{quiz.xpReward} XP
        </Badge>
      </div>

      <div className="p-4 space-y-4">
        {/* Code context */}
        {quiz.codeContext && (
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-card px-3 py-1.5 border-b border-border flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Context</span>
            </div>
            <pre className="p-3 text-xs font-mono overflow-x-auto bg-background">
              <code>{quiz.codeContext}</code>
            </pre>
          </div>
        )}

        {/* Question */}
        <p className="font-medium text-sm">{quiz.question}</p>

        {/* Multiple choice options */}
        {isMultipleChoice && quiz.options && (
          <div className="space-y-2">
            {quiz.options.map((option) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = isAnswered && option === quiz.correctAnswer;
              const isWrong = isAnswered && isSelected && !result?.isCorrect;

              return (
                <button
                  key={option}
                  onClick={() => !isAnswered && setSelectedAnswer(option)}
                  disabled={isAnswered || isPending}
                  className={cn(
                    'w-full text-left text-sm px-4 py-2.5 rounded-lg border transition-colors',
                    !isAnswered && isSelected
                      ? 'border-g2c-500 bg-g2c-900/30 text-foreground'
                      : !isAnswered
                      ? 'border-border bg-card hover:border-g2c-600 hover:bg-g2c-900/20 text-muted-foreground hover:text-foreground'
                      : isCorrect
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                      : isWrong
                      ? 'border-red-500 bg-red-500/10 text-red-300'
                      : 'border-border bg-card text-muted-foreground',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {isWrong && <XCircle className="w-4 h-4 text-red-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Free-text answer */}
        {!isMultipleChoice && (
          <textarea
            value={selectedAnswer}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            disabled={isAnswered || isPending}
            rows={3}
            placeholder="Type your answer..."
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-g2c-500 placeholder:text-muted-foreground disabled:opacity-60"
          />
        )}

        {/* Submit button */}
        {!isAnswered && (
          <Button
            onClick={handleSubmit}
            disabled={!selectedAnswer.trim() || isPending}
            size="sm"
            className="bg-g2c-600 hover:bg-g2c-700 text-white"
          >
            {isPending ? 'Checking...' : 'Submit answer'}
          </Button>
        )}

        {/* Result */}
        {result && (
          <div className={cn(
            'rounded-lg p-4 border text-sm',
            result.isCorrect
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-red-500/30 bg-red-500/5',
          )}>
            <div className="flex items-center gap-2 font-medium mb-2">
              {result.isCorrect ? (
                <><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400">Correct!</span></>
              ) : (
                <><XCircle className="w-4 h-4 text-red-400" /><span className="text-red-400">Incorrect</span></>
              )}
              {result.xpEarned > 0 && (
                <span className="text-xp text-xs ml-auto">+{result.xpEarned} XP</span>
              )}
            </div>
            {!result.isCorrect && (
              <p className="text-muted-foreground text-xs mb-2">
                Correct answer: <span className="text-foreground font-mono">{quiz.correctAnswer}</span>
              </p>
            )}
            <p className="text-muted-foreground">{result.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
