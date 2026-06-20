'use client';

// Danger Zone section shown at the bottom of the profile page.
// Lets users schedule deletion (30-day grace window) or delete immediately.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Trash2, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  deletionRequestedAt: Date | null;
}

type ModalMode = 'schedule' | 'immediate' | null;

const GRACE_DAYS = 30;

function scheduledDate(requestedAt: Date): string {
  const d = new Date(requestedAt);
  d.setDate(d.getDate() + GRACE_DAYS);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function DeleteAccountSection({ deletionRequestedAt }: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalMode>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSchedule() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      if (!res.ok) throw new Error('Request failed');
      setModal(null);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/account/delete?cancel=1', { method: 'POST' });
      if (!res.ok) throw new Error('Request failed');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleImmediate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' });
      if (!res.ok) throw new Error('Request failed');
      // Redirect to home — session will be cleared by middleware on next request
      window.location.href = '/';
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h2 className="text-base font-semibold text-red-500">Danger Zone</h2>
        </div>

        {deletionRequestedAt ? (
          /* Pending deletion banner */
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
              <div className="text-sm">
                <p className="font-medium text-amber-300">Account scheduled for deletion</p>
                <p className="mt-1 text-amber-400/80">
                  Your account and all personal data will be permanently deleted on{' '}
                  <strong className="text-amber-300">{scheduledDate(deletionRequestedAt)}</strong>.
                  You can cancel this at any time before that date.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={loading}
                className="border-border"
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Cancel deletion
              </Button>
              <Button
                size="sm"
                onClick={() => setModal('immediate')}
                disabled={loading}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete now
              </Button>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        ) : (
          /* Default state */
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Deleting your account removes all personal data — your progress, XP, quiz history,
              and tutor conversations. Courses you&apos;ve imported remain available publicly.
              You have a {GRACE_DAYS}-day window to change your mind after requesting deletion.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModal('schedule')}
                className="border-red-500/40 text-red-400 hover:border-red-500 hover:bg-red-500/10 hover:text-red-300"
              >
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                Request deletion ({GRACE_DAYS}-day notice)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setModal('immediate')}
                className="border-red-500/60 text-red-400 hover:bg-red-600 hover:text-white"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete immediately
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !loading && setModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold">
                {modal === 'schedule' ? 'Schedule account deletion?' : 'Delete account now?'}
              </h3>
            </div>

            {modal === 'schedule' ? (
              <p className="text-sm text-muted-foreground">
                Your account will be queued for deletion. All personal data will be permanently
                removed in <strong className="text-foreground">{GRACE_DAYS} days</strong>. You can
                cancel this from your profile page at any time before that date.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                This will <strong className="text-red-400">immediately and permanently</strong> delete
                your account, all learning progress, XP, quiz history, and tutor conversations.{' '}
                <strong className="text-foreground">This cannot be undone.</strong>
              </p>
            )}

            {error && (
              <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModal(null)}
                disabled={loading}
                className="border-border"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={modal === 'schedule' ? handleSchedule : handleImmediate}
                disabled={loading}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {loading
                  ? 'Processing…'
                  : modal === 'schedule'
                  ? `Schedule deletion`
                  : 'Delete my account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
