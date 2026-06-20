'use client';

import { useState } from 'react';

const PALETTE = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#ec4899', '#f59e0b', '#ef4444', '#14b8a6'];

function humanize(slug: string): string {
  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Interactive radial concept map. Center = the lesson, spokes = concepts covered.
 * Pure SVG with animated connectors; theme-aware via CSS tokens.
 */
export function ConceptMap({ center, concepts }: { center: string; concepts: string[] }) {
  const [active, setActive] = useState<number | null>(null);
  const nodes = concepts.slice(0, 8);
  const n = nodes.length || 1;

  const W = 720;
  const H = 460;
  const cx = W / 2;
  const cy = H / 2;
  const R = 168;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label={`Concept map for ${center}`}>
      <defs>
        <linearGradient id="cm-center" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="55%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        <style>{`
          .cm-node { cursor: pointer; transition: opacity .3s ease; }
          .cm-flow { animation: cm-dash 1.1s linear infinite; }
          @keyframes cm-dash { to { stroke-dashoffset: -16; } }
          @media (prefers-reduced-motion: reduce) { .cm-flow { animation: none; } }
        `}</style>
      </defs>

      {nodes.map((concept, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * R;
        const y = cy + Math.sin(angle) * R;
        const color = PALETTE[i % PALETTE.length]!;
        const label = humanize(concept);
        const w = Math.max(96, label.length * 8 + 28);
        const dim = active !== null && active !== i;
        return (
          <g key={concept} className="cm-node" opacity={dim ? 0.3 : 1}
             onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke={color} strokeWidth={2} opacity={0.3} />
            <line className="cm-flow" x1={cx} y1={cy} x2={x} y2={y} stroke={color} strokeWidth={2} strokeDasharray="2 12" strokeLinecap="round" opacity={0.85} />
            <g transform={`translate(${x - w / 2}, ${y - 17})`}>
              <rect width={w} height={34} rx={17} fill="hsl(var(--card))" stroke={color} strokeWidth={1.5} />
              <circle cx={18} cy={17} r={5} fill={color} />
              <text x={32} y={22} fontSize={13} fontWeight={600} fill="hsl(var(--foreground))">{label}</text>
            </g>
          </g>
        );
      })}

      {/* center */}
      <g>
        <circle cx={cx} cy={cy} r={52} fill="url(#cm-center)" />
        <text x={cx} y={cy - 2} fontSize={12} fontWeight={700} fill="#fff" textAnchor="middle">THIS</text>
        <text x={cx} y={cy + 14} fontSize={12} fontWeight={700} fill="#fff" textAnchor="middle">LESSON</text>
      </g>
    </svg>
  );
}
