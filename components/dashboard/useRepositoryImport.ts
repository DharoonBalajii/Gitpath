'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type ImportState = 'idle' | 'loading' | 'polling' | 'success' | 'error';

interface StatusEvent {
  cloneStatus: string;
  analysisStatus: string;
  courseStatus: string | null;
  courseId: string | null;
  done: boolean;
}

/**
 * Imports a repository and tracks the clone → analyze → generate pipeline
 * via the SSE status stream. Shared by the URL form and the repo picker.
 */
export function useRepositoryImport() {
  const [state, setState] = useState<ImportState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const importRepo = useCallback((url: string, turnstileToken?: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;

    startTransition(async () => {
      setState('loading');
      setError(null);
      setActiveUrl(trimmed);
      setProgress('Importing repository...');

      try {
        const res = await fetch('/api/repositories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed, turnstileToken }),
        });

        let data: { success: boolean; data?: { id: string }; error?: string };
        try {
          data = (await res.json()) as typeof data;
        } catch {
          setError('Server error — please try again.');
          setState('error');
          return;
        }

        if (!res.ok || !data.success) {
          setError(data.error ?? 'Import failed');
          setState('error');
          return;
        }

        const repoId = data.data?.id;
        if (!repoId) {
          setError('Unexpected response from server');
          setState('error');
          return;
        }

        // Save to localStorage so the ImportProgressBanner can track across navigation
        const repoName = trimmed.match(/github\.com\/([^/]+\/[^/?#]+)/)?.[1] ?? trimmed;
        const importEntry = { id: repoId, name: repoName, startedAt: Date.now() };
        try {
          const key = 'gitpath_imports';
          const existing = JSON.parse(localStorage.getItem(key) ?? '[]') as Array<{ id: string }>;
          if (!existing.some((e: { id: string }) => e.id === repoId)) {
            localStorage.setItem(key, JSON.stringify([...existing, importEntry]));
          }
          window.dispatchEvent(new CustomEvent('gitpath:import-started', { detail: importEntry }));
        } catch { /* localStorage unavailable */ }

        setState('polling');
        setProgress('Project files are being fetched...');

        const eventSource = new EventSource(`/api/repositories/${repoId}/status`);
        eventSource.onmessage = (event: MessageEvent) => {
          const status = JSON.parse(event.data as string) as StatusEvent;

          if (status.courseStatus === 'COMPLETED' && status.courseId) {
            setProgress('Course ready!');
            setState('success');
            eventSource.close();
            setTimeout(() => router.push(`/learn/${status.courseId}`), 800);
          } else if (status.courseStatus === 'FAILED') {
            setError('Course generation failed. Please try again.');
            setState('error');
            eventSource.close();
          } else if (status.courseStatus === 'GENERATING') {
            setProgress('Creating a road map...');
          } else if (status.analysisStatus === 'ANALYZING') {
            setProgress('Analyzing the files...');
          } else if (status.cloneStatus === 'CLONING') {
            setProgress('Project files are being fetched...');
          }

          if (status.done) eventSource.close();
        };

        eventSource.onerror = () => {
          eventSource.close();
          setError('Connection lost. Refresh to check status.');
          setState('error');
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error');
        setState('error');
      }
    });
  }, [router]);

  const busy = state === 'loading' || state === 'polling' || state === 'success' || isPending;

  return { state, error, progress, activeUrl, busy, importRepo };
}
