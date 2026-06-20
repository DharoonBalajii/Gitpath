'use client';

import { useState } from 'react';
import { Layers, Footprints, ArrowLeft, ArrowRight, FileCode2 } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import type { CodeSnippet } from '@/lib/types/index';

/** Two ways to read the code: all-at-once (Stacked) or guided one-step-at-a-time (Stepped). */
export function CodeWalkthrough({ snippets }: { snippets: CodeSnippet[] }) {
  const [mode, setMode] = useState<'stacked' | 'stepped'>('stacked');
  const [step, setStep] = useState(0);

  if (snippets.length === 0) return null;
  const cur = snippets[Math.min(step, snippets.length - 1)]!;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <div className="inline-flex rounded-lg border border-border bg-muted/50 p-1">
          {([['stacked', 'Stacked', Layers], ['stepped', 'Stepped', Footprints]] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'stacked' ? (
        <div className="space-y-6">
          {snippets.map((snip, i) => (
            <div key={i} className="space-y-3">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileCode2 className="h-4 w-4 text-brand-cyan" /> {snip.explanation}
              </p>
              <CodeBlock code={snip.code} language={snip.language} filename={snip.filename} highlight={snip.highlight} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Step {step + 1} of {snippets.length}</span>
            <div className="flex gap-1.5">
              {snippets.map((_, i) => (
                <span key={i} className={`h-1.5 w-6 rounded-full ${i === step ? 'accent-gradient-bg' : 'bg-muted'}`} />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-brand-violet/30 bg-brand-violet/5 p-4 text-sm">{cur.explanation}</div>
          <CodeBlock code={cur.code} language={cur.language} filename={cur.filename} highlight={cur.highlight} />
          <div className="flex justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> Prev
            </button>
            <button
              onClick={() => setStep((s) => Math.min(snippets.length - 1, s + 1))}
              disabled={step >= snippets.length - 1}
              className="inline-flex items-center gap-1.5 rounded-lg accent-gradient-bg px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
