'use client';

import { useEffect, useRef, useState } from 'react';
import { Zap } from 'lucide-react';
import { normaliseVibe } from '@/lib/utils/xp';

interface VibeBarProps {
  rawVibe: number;
}

export function VibeBar({ rawVibe }: VibeBarProps) {
  const pct = normaliseVibe(rawVibe);
  const [displayed, setDisplayed] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out-cubic
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(ease * pct));
      if (t < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current != null) cancelAnimationFrame(raf.current); };
  }, [pct]);

  const level = pct >= 80 ? 'On fire' : pct >= 50 ? 'Grooving' : pct >= 25 ? 'Warming up' : 'Getting started';
  const pulseColor = pct >= 80 ? 'bg-rose-500' : pct >= 50 ? 'bg-amber-500' : pct >= 25 ? 'bg-brand-violet' : 'bg-brand-indigo';

  return (
    <div className="rounded-2xl gradient-border glass-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-brand-violet shadow-lg">
            <Zap className="h-4 w-4 text-white" />
            {pct >= 50 && (
              <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ${pulseColor} ring-2 ring-card animate-pulse`} />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">Vibe Coding</p>
            <p className="text-xs text-muted-foreground">{level}</p>
          </div>
        </div>
        <span className="text-2xl font-bold tabular-nums">{displayed}<span className="text-sm font-normal text-muted-foreground">%</span></span>
      </div>

      {/* bar */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full ease-out"
          style={{
            transition: 'width 1200ms cubic-bezier(0,0,0.2,1)',
            width: `${pct}%`,
            background: pct >= 80
              ? 'linear-gradient(90deg, #f43f5e, #fb923c)'
              : pct >= 50
              ? 'linear-gradient(90deg, #f59e0b, #f43f5e)'
              : 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)',
          }}
        />
      </div>

      <div className="mt-2.5 flex justify-between text-[10px] text-muted-foreground">
        <span>Answer quizzes &amp; complete lessons to grow your vibe</span>
        <span>{rawVibe} pts</span>
      </div>
    </div>
  );
}
