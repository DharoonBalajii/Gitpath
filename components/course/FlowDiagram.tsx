'use client';

import { useEffect, useRef, useState } from 'react';
import { Layers } from 'lucide-react';

interface FlowDiagramProps {
  definition: string;
}

export function FlowDiagram({ definition }: FlowDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState(false);

  useEffect(() => {
    async function render() {
      try {
        const { default: mermaid } = await import('mermaid');
        mermaid.initialize({ theme: 'dark', securityLevel: 'loose', darkMode: true });
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg: rendered } = await mermaid.render(id, definition);
        setSvg(rendered);
      } catch {
        setError(true);
      }
    }
    render();
  }, [definition]);

  if (error) return null;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-card border-b border-border flex items-center gap-2">
        <Layers className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Flow diagram</span>
      </div>
      <div className="p-4 bg-background overflow-x-auto" ref={containerRef}>
        {svg ? (
          <div dangerouslySetInnerHTML={{ __html: svg }} className="flex justify-center" />
        ) : (
          <div className="h-24 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-g2c-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
