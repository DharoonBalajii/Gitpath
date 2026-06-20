'use client';

import { useState } from 'react';
import { Orbit, GitFork, Route } from 'lucide-react';
import { ConceptMap } from './ConceptMap';
import { TreeMindmap } from './mindmaps/TreeMindmap';
import { RoadmapMap } from './mindmaps/RoadmapMap';

const DESIGNS = [
  { id: 'radial', label: 'Radial', icon: Orbit },
  { id: 'tree', label: 'Tree', icon: GitFork },
  { id: 'roadmap', label: 'Roadmap', icon: Route },
] as const;

/** Lets the learner switch between multiple mindmap visualisations of the same concepts. */
export function ConceptMapDesigns({ center, concepts }: { center: string; concepts: string[] }) {
  const [design, setDesign] = useState<(typeof DESIGNS)[number]['id']>('radial');

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="mb-2 flex justify-center">
        <div className="inline-flex rounded-lg border border-border bg-muted/50 p-1">
          {DESIGNS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDesign(d.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                design === d.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <d.icon className="h-3.5 w-3.5" /> {d.label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-[300px]">
        {design === 'radial' && <ConceptMap center={center} concepts={concepts} />}
        {design === 'tree' && <TreeMindmap center={center} concepts={concepts} />}
        {design === 'roadmap' && <RoadmapMap center={center} concepts={concepts} />}
      </div>
    </div>
  );
}
