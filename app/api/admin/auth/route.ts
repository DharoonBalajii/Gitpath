/**
 * app/api/admin/auth/route.ts
 *
 * Admin authentication API endpoints.
 *
 * POST /api/admin/auth  → verify email+password, set httpOnly admin cookie
 * DELETE /api/admin/auth → clear the admin cookie (logout)
 *
 * The cookie is httpOnly (JS can't read it) and SameSite=Lax (CSRF protection).
 * No user data, GitHub tokens, or any sensitive DB records are ever returned here.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminToken, verifyAdminCredentials, ADMIN_COOKIE } from '@/lib/admin/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validate incoming login request body
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── POST /api/admin/auth — Login ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Parse and validate the request body
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const { email, password } = parsed.data;

  // Verify credentials — returns false for wrong email OR wrong password
  if (!verifyAdminCredentials(email, password)) {
    // Return the same error for both wrong email and wrong password
    // (don't reveal which one is wrong — security best practice)
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Create a signed token valid for 24 hours
  const token = createAdminToken(email);

  // Build the response and attach the session cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,           // JS cannot access this cookie (XSS protection)
    sameSite: 'lax',          // CSRF protection
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    maxAge: 60 * 60 * 24,    // 24 hours in seconds
    path: '/admin',           // Only sent on /admin routes
  });

  return response;
}

// ─── DELETE /api/admin/auth — Logout ─────────────────────────────────────────
export async function DELETE() {
  const response = NextResponse.json({ success: true });

  // Clear the admin cookie by setting maxAge to 0
  response.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,  // Immediately expires the cookie
    path: '/admin',
  });

  return response;
}
