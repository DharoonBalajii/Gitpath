'use client';

import { useEffect, useState } from 'react';
import { GitBranch, Loader2, Lock, Search, Star, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRepositoryImport } from './useRepositoryImport';

interface Repo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description: string | null;
  language: string | null;
  stars: number;
  isPrivate: boolean;
  url: string;
}

type LoadState = 'loading' | 'ready' | 'no-token' | 'error';

export function RepoPicker() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const { state, error, progress, activeUrl, busy, importRepo } = useRepositoryImport();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/github/repos');
        const data = (await res.json()) as { success: boolean; data?: { items: Repo[] }; error?: string; code?: string };
        if (cancelled) return;
        if (!res.ok || !data.success) {
          if (data.code === 'NO_GITHUB_TOKEN') setLoadState('no-token');
          else { setLoadState('error'); setLoadError(data.error ?? 'Failed to load repositories'); }
          return;
        }
        setRepos(data.data?.items ?? []);
        setLoadState('ready');
      } catch {
        if (!cancelled) { setLoadState('error'); setLoadError('Could not reach the server'); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = repos.filter((r) => r.fullName.toLowerCase().includes(query.toLowerCase()));

  if (loadState === 'loading') {
    return (
      <div className="rounded-2xl gradient-border glass-card p-10 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading your repositories…
      </div>
    );
  }

  if (loadState === 'no-token') {
    return (
      <div className="rounded-2xl gradient-border glass-card p-6">
        <h2 className="font-semibold text-lg mb-1">Connect your repositories</h2>
        <p className="text-muted-foreground text-sm">
          Add a GitHub <span className="font-mono text-xs">GITHUB_TOKEN</span> to{' '}
          <span className="font-mono text-xs">.env.local</span> to list your repositories here.
          Create one at{' '}
          <a
            href="https://github.com/settings/tokens?type=beta"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 text-brand-cyan"
          >
            github.com/settings/tokens
          </a>{' '}
          (read-only access to repositories). For now, you can paste a repo URL below.
        </p>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="rounded-2xl gradient-border glass-card p-6 flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="w-4 h-4" /> {loadError}
      </div>
    );
  }

  return (
    <div className="rounded-2xl gradient-border glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-lg">Your repositories</h2>
          <p className="text-muted-foreground text-sm">Pick one to generate a course</p>
        </div>
        <div className="relative w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="pl-9 text-sm h-9" />
        </div>
      </div>

      {(state === 'polling' || state === 'loading' || state === 'error') && (
        <div className={`mb-3 flex items-center gap-2 text-sm ${state === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
          {state === 'error' ? <AlertCircle className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{state === 'error' ? error : progress}</span>
        </div>
      )}

      <div className="max-h-96 overflow-y-auto -mr-2 pr-2 space-y-2">
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-sm py-8 text-center">No repositories match “{query}”.</p>
        )}
        {filtered.map((repo) => {
          const isActive = activeUrl === repo.url;
          return (
            <button
              key={repo.id}
              onClick={() => importRepo(repo.url)}
              disabled={busy}
              className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-border bg-accent/40 hover:bg-accent hover:border-brand-violet/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                {repo.isPrivate ? <Lock className="w-4 h-4 text-amber-400" /> : <GitBranch className="w-4 h-4 text-brand-cyan" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{repo.fullName}</p>
                {repo.description && <p className="text-xs text-muted-foreground truncate">{repo.description}</p>}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                {repo.language && <span>{repo.language}</span>}
                {repo.stars > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {repo.stars}</span>}
              </div>
              {isActive && state === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {isActive && (state === 'polling' || state === 'loading') && <Loader2 className="w-4 h-4 animate-spin text-brand-violet" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
