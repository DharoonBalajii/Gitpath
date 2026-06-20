'use client';

import { useState } from 'react';
import { GitBranch, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRepositoryImport } from './useRepositoryImport';
import { Turnstile } from '@/components/Turnstile';

export function ImportRepositoryForm() {
  const [url, setUrl] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string>();
  const { state, error, progress, busy, importRepo } = useRepositoryImport();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    importRepo(url, turnstileToken);
  };

  return (
    <div className="rounded-2xl gradient-border glass-card p-6">
      <h2 className="font-semibold mb-1 text-lg">Paste a repository URL</h2>
      <p className="text-muted-foreground text-sm mb-4">
        Any public GitHub URL works — or pick from your repositories above.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/vercel/next.js"
            className="pl-9 font-mono text-sm"
            disabled={busy}
          />
        </div>
        <Button
          type="submit"
          disabled={!url.trim() || busy}
          className="brand-gradient text-white border-0 shadow-lg shadow-brand-violet/25 hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          {(state === 'loading' || state === 'polling') && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
          {state === 'success' && <CheckCircle2 className="mr-2 w-4 h-4" />}
          {state === 'idle' || state === 'error' ? 'Import' : progress}
        </Button>
      </form>

      <Turnstile onVerify={setTurnstileToken} />

      {(state === 'loading' || state === 'polling') && (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
            <span className="font-medium">{progress}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {['Fetching files', 'Analyzing code', 'Creating roadmap'].map((step, i) => {
              const active =
                (progress.includes('fetched') && i === 0) ||
                (progress.includes('Analyzing') && i <= 1) ||
                (progress.includes('road map') && i <= 2);
              return (
                <div key={step} className="space-y-1">
                  <div className={`h-1.5 rounded-full transition-all duration-700 ${active ? 'brand-gradient' : 'bg-border'}`} />
                  <p className={`text-[10px] ${active ? 'text-foreground' : 'text-muted-foreground/60'}`}>{step}</p>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Typically 5–15 min · You can navigate freely — progress continues in background
          </p>
        </div>
      )}

      {state === 'error' && error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
