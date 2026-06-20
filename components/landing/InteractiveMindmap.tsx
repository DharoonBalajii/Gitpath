'use client';

import { useState } from 'react';

/**
 * Interactive, animated course mindmap.
 *
 * DATA CONTRACT — the AI generator emits exactly this shape, and it renders
 * with zero code changes. Demo data on the landing page is replaced 1:1 by
 * the model's output (course title → root, modules → branches).
 */
export interface MindmapBranch {
  id: string;
  label: string;
  lessons: number;
  xp: number;
  color: string;
}
export interface MindmapData {
  title: string;
  subtitle?: string;
  branches: MindmapBranch[];
}

const DEMO: MindmapData = {
  title: 'Spotify Clone',
  subtitle: 'Repository',
  branches: [
    { id: 'arch', label: 'Architecture', lessons: 4, xp: 100, color: '#6366f1' },
    { id: 'auth', label: 'Authentication', lessons: 5, xp: 120, color: '#8b5cf6' },
    { id: 'db', label: 'Database', lessons: 4, xp: 90, color: '#06b6d4' },
    { id: 'api', label: 'API', lessons: 6, xp: 140, color: '#10b981' },
    { id: 'deploy', label: 'Deployment', lessons: 3, xp: 80, color: '#ec4899' },
  ],
};

export function InteractiveMindmap({ data = DEMO }: { data?: MindmapData }) {
  const [active, setActive] = useState<string | null>(null);
  const branches = data.branches;
  const n = branches.length;

  const VB_W = 980;
  const VB_H = 520;
  const top = 70;
  const bottom = VB_H - 70;
  const step = n > 1 ? (bottom - top) / (n - 1) : 0;
  const rootY = VB_H / 2;
  const rootRight = 210;
  const branchX = 560;
  const branchW = 250;
  const branchH = 60;

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="h-full w-full" role="img" aria-label={`${data.title} course mindmap`}>
      <defs>
        <linearGradient id="mm-root" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="55%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        <filter id="mm-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <style>{`
          .mm-branch { cursor: pointer; transition: transform .35s cubic-bezier(.16,1,.3,1); transform-box: fill-box; transform-origin: left center; }
          .mm-branch:hover { transform: translateX(6px); }
          .mm-card { transition: filter .3s ease; }
          .mm-branch:hover .mm-card { filter: drop-shadow(0 10px 22px rgba(79,70,229,.22)); }
          .mm-flow { animation: mm-dash 1.1s linear infinite; }
          @keyframes mm-dash { to { stroke-dashoffset: -16; } }
          @media (prefers-reduced-motion: reduce) {
            .mm-flow { animation: none; }
            .mm-pulse { display: none; }
          }
        `}</style>
      </defs>

      {/* connectors + branches */}
      {branches.map((b, i) => {
        const cy = n > 1 ? top + i * step : rootY;
        const pathId = `mm-path-${b.id}`;
        const d = `M ${rootRight} ${rootY} C ${branchX - 180} ${rootY}, ${branchX - 150} ${cy}, ${branchX} ${cy}`;
        const dim = active !== null && active !== b.id;
        return (
          <g key={b.id} className="mm-branch" opacity={dim ? 0.35 : 1}
             onMouseEnter={() => setActive(b.id)} onMouseLeave={() => setActive(null)}>
            <path id={pathId} d={d} fill="none" stroke={b.color} strokeWidth={2} opacity={0.3} />
            <path className="mm-flow" d={d} fill="none" stroke={b.color} strokeWidth={2}
                  strokeLinecap="round" strokeDasharray="2 14" opacity={0.85} />
            {/* travelling packet */}
            <circle className="mm-pulse" r={4} fill={b.color}>
              <animateMotion dur="3s" begin={`${i * 0.45}s`} repeatCount="indefinite">
                <mpath href={`#${pathId}`} />
              </animateMotion>
            </circle>

            {/* branch card */}
            <g className="mm-card">
              <rect x={branchX} y={cy - branchH / 2} width={branchW} height={branchH} rx={14}
                    fill="hsl(var(--card))" stroke="hsl(var(--border))" />
              <rect x={branchX} y={cy - branchH / 2} width={5} height={branchH} rx={2.5} fill={b.color} />
              <circle cx={branchX + 28} cy={cy} r={6} fill={b.color} />
              <circle cx={branchX + 28} cy={cy} r={6} fill={b.color} opacity={0.35} filter="url(#mm-soft)" />
              <text x={branchX + 48} y={cy - 4} fontSize={16} fontWeight={600} fill="hsl(var(--foreground))">{b.label}</text>
              <text x={branchX + 48} y={cy + 16} fontSize={12} fill="hsl(var(--muted-foreground))">{b.lessons} lessons · {b.xp} XP</text>
            </g>
          </g>
        );
      })}

      {/* root node */}
      <g>
        <rect x={40} y={rootY - 38} width={170} height={76} rx={18} fill="url(#mm-root)" />
        <rect x={40} y={rootY - 38} width={170} height={76} rx={18} fill="url(#mm-root)" opacity={0.5} filter="url(#mm-soft)" />
        <text x={125} y={rootY - 6} fontSize={17} fontWeight={700} fill="#ffffff" textAnchor="middle">{data.title}</text>
        {data.subtitle && (
          <text x={125} y={rootY + 16} fontSize={11} fill="#e9d5ff" textAnchor="middle" letterSpacing="0.08em">
            {data.subtitle.toUpperCase()}
          </text>
        )}
      </g>
    </svg>
  );
}
