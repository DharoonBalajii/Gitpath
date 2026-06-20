'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface ActiveImport {
  id: string;
  name: string;
  startedAt: number;
  cloneStatus?: string;
  analysisStatus?: string;
  courseStatus?: string | null;
  courseId?: string | null;
}

const STORAGE_KEY = 'gitpath_imports';

function loadImports(): ActiveImport[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as ActiveImport[];
  } catch { return []; }
}

function persistImports(list: ActiveImport[]) {
  const live = list.filter(
    (i) => i.courseStatus !== 'COMPLETED' && i.courseStatus !== 'FAILED',
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(live));
}

function stepIndex(imp: ActiveImport): number {
  if (imp.courseStatus === 'GENERATING' || imp.courseStatus === 'COMPLETED') return 2;
  if (imp.analysisStatus === 'ANALYZING' || imp.analysisStatus === 'ANALYZED') return 1;
  return 0;
}

function stepLabel(imp: ActiveImport): string {
  if (imp.courseStatus === 'GENERATING') return 'Creating a road map...';
  if (imp.analysisStatus === 'ANALYZING' || imp.analysisStatus === 'ANALYZED') return 'Analyzing the files...';
  return 'Project files are being fetched...';
}

function ElapsedTimer({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(Math.floor((Date.now() - startedAt) / 1000));
  useEffect(() => {
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => clearInterval(t);
  }, [startedAt]);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return <span className="tabular-nums">{m > 0 ? `${m}m ${s}s` : `${s}s`}</span>;
}

const STEP_NAMES = ['Fetching files', 'Analyzing code', 'Creating roadmap'];

export function ImportProgressBanner() {
  const [imports, setImports] = useState<ActiveImport[]>([]);
  const esRefs = useRef<Map<string, EventSource>>(new Map());
  const router = useRouter();

  const upsertImport = useCallback((id: string, patch: Partial<ActiveImport>) => {
    setImports((prev) => {
      const exists = prev.some((i) => i.id === id);
      const next = exists
        ? prev.map((i) => (i.id === id ? { ...i, ...patch } : i))
        : [...prev, { id, name: id, startedAt: Date.now(), ...patch }];
      persistImports(next);
      return next;
    });
  }, []);

  const dismiss = useCallback(
    (id: string, immediate = false) => {
      esRefs.current.get(id)?.close();
      esRefs.current.delete(id);
      if (immediate) {
        setImports((prev) => {
          const next = prev.filter((i) => i.id !== id);
          persistImports(next);
          return next;
        });
      }
    },
    [],
  );

  const subscribe = useCallback(
    (imp: ActiveImport, retries = 0) => {
      if (esRefs.current.has(imp.id)) return;

      const es = new EventSource(`/api/repositories/${imp.id}/status`);
      esRefs.current.set(imp.id, es);

      es.onmessage = (e) => {
        const data = JSON.parse(e.data as string) as {
          cloneStatus: string;
          analysisStatus: string;
          courseStatus: string | null;
          courseId: string | null;
          done: boolean;
        };
        upsertImport(imp.id, {
          cloneStatus: data.cloneStatus,
          analysisStatus: data.analysisStatus,
          courseStatus: data.courseStatus,
          courseId: data.courseId,
        });
        if (data.done) {
          es.close();
          esRefs.current.delete(imp.id);
        }
      };

      es.onerror = () => {
        es.close();
        esRefs.current.delete(imp.id);
        // Retry up to 6 times with increasing backoff before showing failed
        const MAX_RETRIES = 6;
        if (retries < MAX_RETRIES) {
          const delay = Math.min(3000 * (retries + 1), 15000);
          setTimeout(() => subscribe(imp, retries + 1), delay);
        } else {
          upsertImport(imp.id, { courseStatus: 'FAILED' });
        }
      };
    },
    [upsertImport],
  );

  // Restore persisted imports on mount
  useEffect(() => {
    const saved = loadImports();
    if (saved.length > 0) {
      setImports(saved);
      saved.forEach(subscribe);
    }
  }, [subscribe]);

  // Listen for new imports started in useRepositoryImport
  useEffect(() => {
    const handler = (e: CustomEvent<ActiveImport>) => {
      const imp = e.detail;
      setImports((prev) => {
        const existing = prev.find((i) => i.id === imp.id);
        if (existing) {
          // Reset failed/stale state when user retries the same repo
          const next = prev.map((i) =>
            i.id === imp.id
              ? { ...i, courseStatus: undefined, startedAt: imp.startedAt }
              : i,
          );
          persistImports(next);
          return next;
        }
        const next = [...prev, imp];
        persistImports(next);
        return next;
      });
      // Always re-subscribe (closes old connection if any stale one lingered)
      const oldEs = esRefs.current.get(imp.id);
      if (oldEs) { oldEs.close(); esRefs.current.delete(imp.id); }
      subscribe(imp);
    };
    window.addEventListener('gitpath:import-started', handler as EventListener);
    return () =>
      window.removeEventListener('gitpath:import-started', handler as EventListener);
  }, [subscribe]);

  // Cleanup EventSources on unmount
  useEffect(() => {
    return () => { esRefs.current.forEach((es) => es.close()); };
  }, []);

  if (imports.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-80 pointer-events-none">
      {imports.map((imp) => {
        const done = imp.courseStatus === 'COMPLETED';
        const failed = imp.courseStatus === 'FAILED';
        const si = stepIndex(imp);
        const sl = stepLabel(imp);

        return (
          <div
            key={imp.id}
            className="rounded-2xl gradient-border glass-card p-4 shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-4 duration-300"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {done ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                ) : failed ? (
                  <XCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
                ) : (
                  <Loader2 className="h-5 w-5 flex-shrink-0 text-brand-violet animate-spin" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{imp.name}</p>
                  <p
                    className={`text-xs mt-0.5 ${
                      failed
                        ? 'text-destructive'
                        : done
                        ? 'text-emerald-500'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {done ? 'Course ready!' : failed ? 'Generation failed' : sl}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismiss(imp.id, true)}
                className="flex-shrink-0 p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* In-progress details */}
            {!done && !failed && (
              <>
                {/* Step progress bar */}
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {STEP_NAMES.map((name, i) => (
                    <div
                      key={name}
                      className={`h-1.5 rounded-full transition-all duration-700 ${
                        i <= si ? 'brand-gradient' : 'bg-border'
                      }`}
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{STEP_NAMES[si]}</span>
                  <ElapsedTimer startedAt={imp.startedAt} />
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground/60">
                  Typically 5–15 min · Browse freely, we&apos;ll notify you
                </p>
              </>
            )}

            {/* Success CTA */}
            {done && imp.courseId && (
              <button
                onClick={() => {
                  dismiss(imp.id, true);
                  router.push(`/learn/${imp.courseId}`);
                }}
                className="mt-3 w-full rounded-xl brand-gradient text-white text-xs font-semibold py-2 hover:opacity-90 transition-opacity"
              >
                Start Learning →
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
