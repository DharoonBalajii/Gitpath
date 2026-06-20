'use client';

import { useState } from 'react';

const PALETTE = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#ec4899', '#f59e0b', '#ef4444', '#14b8a6'];
const humanize = (s: string) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Horizontal tree: lesson on the left, concepts branching to the right. */
export function TreeMindmap({ center, concepts }: { center: string; concepts: string[] }) {
  const [active, setActive] = useState<number | null>(null);
  const nodes = concepts.slice(0, 8);
  const n = nodes.length || 1;
  const W = 720, H = Math.max(300, n * 56 + 40);
  const rootX = 150, rootY = H / 2, branchX = 470, top = 40, step = n > 1 ? (H - 80) / (n - 1) : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label={`Tree map for ${center}`}>
      <defs>
        <linearGradient id="tm-root" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f46e5" /><stop offset="55%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        <style>{`.tm-flow{animation:tm-dash 1.1s linear infinite}@keyframes tm-dash{to{stroke-dashoffset:-16}}@media (prefers-reduced-motion:reduce){.tm-flow{animation:none}}`}</style>
      </defs>
      {nodes.map((c, i) => {
        const cy = n > 1 ? top + i * step : rootY;
        const color = PALETTE[i % PALETTE.length]!;
        const label = humanize(c);
        const w = Math.max(120, label.length * 8 + 36);
        const d = `M ${rootX + 70} ${rootY} C ${branchX - 90} ${rootY}, ${branchX - 70} ${cy}, ${branchX} ${cy}`;
        const dim = active !== null && active !== i;
        return (
          <g key={c} opacity={dim ? 0.3 : 1} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} style={{ cursor: 'pointer' }}>
            <path d={d} fill="none" stroke={color} strokeWidth={2} opacity={0.3} />
            <path className="tm-flow" d={d} fill="none" stroke={color} strokeWidth={2} strokeDasharray="2 12" strokeLinecap="round" opacity={0.85} />
            <g transform={`translate(${branchX}, ${cy - 17})`}>
              <rect width={w} height={34} rx={10} fill="hsl(var(--card))" stroke={color} strokeWidth={1.5} />
              <circle cx={18} cy={17} r={5} fill={color} />
              <text x={32} y={22} fontSize={13} fontWeight={600} fill="hsl(var(--foreground))">{label}</text>
            </g>
          </g>
        );
      })}
      <g>
        <rect x={rootX - 70} y={rootY - 28} width={140} height={56} rx={14} fill="url(#tm-root)" />
        <text x={rootX} y={rootY + 5} fontSize={13} fontWeight={700} fill="#fff" textAnchor="middle">This lesson</text>
      </g>
    </svg>
  );
}
