// Dev-only sign-in — creates a local session WITHOUT GitHub OAuth.
// Lets you test the full app locally without registering a GitHub OAuth App.
// Hard-disabled in production. Your real GitHub token is never stored here —
// repo access uses the server-side GITHUB_TOKEN from .env.local.

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

const DEV_EMAIL = 'dev@gitpath.local';
const SESSION_DAYS = 30;

export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Dev login is disabled in production.' }, { status: 403 });
  }

  // Upsert a local dev user
  const user = await db.user.upsert({
    where: { email: DEV_EMAIL },
    update: {},
    create: {
      email: DEV_EMAIL,
      name: 'Dev User',
      githubUsername: process.env.DEV_GITHUB_USERNAME ?? null,
    },
  });

  // Create a database-backed session (matches the NextAuth database strategy)
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: { sessionToken, userId: user.id, expires },
  });

  // Redirect using the host the BROWSER used (not the server bind host, which may
  // be 0.0.0.0) so the host-only session cookie is sent back on the next request.
  const host = req.headers.get('host') ?? new URL(req.url).host;
  const proto = req.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'http');
  const res = NextResponse.redirect(`${proto}://${host}/dashboard`);
  res.cookies.set('authjs.session-token', sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: false, // localhost over http
    expires,
  });
  return res;
}
