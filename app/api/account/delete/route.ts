// Account deletion API
//
// POST  /api/account/delete          → schedule deletion 30 days from now
// DELETE /api/account/delete         → delete the account immediately
// POST  /api/account/delete?cancel=1 → cancel a pending scheduled deletion

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import { auth, signOut } from '@/lib/auth';
import { db } from '@/lib/db/client';

const CLONE_BASE_DIR = process.env.CLONE_BASE_DIR ?? '/tmp/gitpath/repos';
const DELETION_GRACE_DAYS = 30;

// POST — schedule deletion (sets deletionRequestedAt, user has 30 days to cancel)
// POST ?cancel=1 — cancel a pending deletion
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cancel = request.nextUrl.searchParams.get('cancel') === '1';

  if (cancel) {
    await db.user.update({
      where: { id: session.user.id },
      data: { deletionRequestedAt: null },
    });
    return NextResponse.json({ cancelled: true });
  }

  // Schedule deletion — 30-day grace period
  const scheduledFor = new Date();
  scheduledFor.setDate(scheduledFor.getDate() + DELETION_GRACE_DAYS);

  await db.user.update({
    where: { id: session.user.id },
    data: { deletionRequestedAt: new Date() },
  });

  return NextResponse.json({
    scheduled: true,
    deletionDate: scheduledFor.toISOString(),
    message: `Your account is scheduled for deletion on ${scheduledFor.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. You can cancel this at any time before that date.`,
  });
}

// DELETE — wipe the account immediately (no grace period)
export async function DELETE(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Delete any remaining local repo clones for this user
  try {
    const repos = await db.repository.findMany({
      where: { userId },
      select: { id: true, clonePath: true },
    });
    for (const repo of repos) {
      const clonePath = repo.clonePath ?? `${CLONE_BASE_DIR}/${repo.id}`;
      if (fs.existsSync(clonePath)) {
        fs.rmSync(clonePath, { recursive: true, force: true });
      }
    }
  } catch {
    // Non-fatal — continue with DB deletion even if filesystem cleanup fails
  }

  // Null out userId on repositories so courses remain publicly accessible
  // (courses are educational content, not personal data)
  await db.repository.updateMany({
    where: { userId },
    data: { userId: null },
  });

  // Delete the user — cascades to: accounts, sessions, enrollments,
  // userProgress, quizAttempts, userBadges, conceptMastery, tutorMessages
  await db.user.delete({ where: { id: userId } });

  // Clear the auth session cookie by signing out
  // signOut() redirects, so we handle this on the client after the API returns
  return NextResponse.json({ deleted: true });
}
