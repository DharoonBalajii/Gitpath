import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';

// Clerk runs only when configured; otherwise plain edge-safe gating.
const clerkEnabled = Boolean(process.env.CLERK_SECRET_KEY);

// Routes that require a user auth session (NextAuth)
const PROTECTED_PREFIXES = ['/dashboard', '/learn', '/profile', '/achievements', '/explore'];

// Auth.js v5 session cookie names (http vs https)
const SESSION_COOKIES = ['authjs.session-token', '__Secure-authjs.session-token'];

// Admin session cookie name (set by /api/admin/auth on successful admin login)
const ADMIN_COOKIE = 'gp_admin_token';

/**
 * Lightweight, edge-safe auth gate.
 *
 * We do NOT call auth() here — database sessions require Prisma, which can't
 * run on the edge runtime. We only do an optimistic cookie-presence check.
 *
 * Two separate gates:
 *   1. User gate  — /dashboard, /learn, /profile, etc. → NextAuth session cookie
 *   2. Admin gate — /admin/dashboard                   → admin HMAC token cookie
 *
 * Real validation happens in the node-runtime pages (auth() / getAdminSession()).
 * We deliberately do NOT redirect /login → /dashboard on cookie presence to
 * avoid stale-cookie redirect loops.
 */
function gate(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin route guard ──────────────────────────────────────────────────────
  // /admin/login is public; /admin/dashboard and sub-routes require the cookie
  if (pathname.startsWith('/admin/dashboard')) {
    const hasAdminCookie = Boolean(request.cookies.get(ADMIN_COOKIE)?.value);
    if (!hasAdminCookie) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  // ── User route guard ───────────────────────────────────────────────────────
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const hasSession = SESSION_COOKIES.some((name) => Boolean(request.cookies.get(name)?.value));
  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// When Clerk is configured, wrap our gate in clerkMiddleware so Clerk's auth
// context is available; otherwise use the plain gate (current behaviour).
const middleware = clerkEnabled
  ? clerkMiddleware((_auth, request) => gate(request as unknown as NextRequest))
  : gate;

export default middleware;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
