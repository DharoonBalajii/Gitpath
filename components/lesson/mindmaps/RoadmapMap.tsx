'use client';

const PALETTE = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#ec4899', '#f59e0b', '#ef4444', '#14b8a6'];
const humanize = (s: string) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Vertical "learning path" roadmap — concepts as ordered stepping stones. */
export function RoadmapMap({ concepts }: { center?: string; concepts: string[] }) {
  const nodes = concepts.slice(0, 8);
  return (
    <div className="relative mx-auto max-w-md py-4 pl-2">
      {/* spine */}
      <div className="absolute bottom-6 left-[27px] top-6 w-0.5 bg-gradient-to-b from-brand-indigo via-brand-violet to-brand-fuchsia" />
      <ul className="space-y-3">
        {nodes.map((c, i) => {
          const color = PALETTE[i % PALETTE.length]!;
          return (
            <li key={c} className="group relative flex items-center gap-4">
              <span
                className="z-10 flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-md transition-transform group-hover:scale-110"
                style={{ background: color }}
              >
                {i + 1}
              </span>
              <div className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm transition-all group-hover:border-brand-violet/40 group-hover:shadow-md">
                <span className="text-sm font-medium">{humanize(c)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
