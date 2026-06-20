/**
 * lib/admin/auth.ts
 *
 * Admin-only authentication utilities.
 * Uses HMAC-SHA256 signed tokens stored in an httpOnly cookie.
 * No external JWT library needed — Node.js crypto handles signing.
 *
 * Authorised admin emails are hard-coded here (not sensitive — they're just
 * email addresses). The password lives in ADMIN_PASSWORD env var only.
 */

import crypto from 'crypto';
import { cookies } from 'next/headers';

// ─── Authorised admin email addresses ────────────────────────────────────────
// Only these two emails can access the admin panel.
export const ADMIN_EMAILS = [
  'balajiilabs@gmail.com',
  'dharoonbalajiie@gmail.com',
];

// Cookie name for admin session
export const ADMIN_COOKIE = 'gp_admin_token';

// Token lifetime: 24 hours in seconds
const TOKEN_TTL_SECONDS = 60 * 60 * 24;

// ─── Secret key ──────────────────────────────────────────────────────────────
// Falls back to a dev placeholder — MUST be set in production via ADMIN_JWT_SECRET.
function getSecret(): string {
  return process.env.ADMIN_JWT_SECRET ?? 'dev-admin-secret-change-in-production';
}

// ─── Credential verification ──────────────────────────────────────────────────
/**
 * Returns true if the submitted email+password match an authorised admin.
 * Uses timing-safe comparison to prevent timing attacks on the password.
 */
export function verifyAdminCredentials(email: string, password: string): boolean {
  // Check email is in the allowlist (case-insensitive)
  if (!ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase())) {
    return false;
  }

  const expectedPassword = process.env.ADMIN_PASSWORD ?? '';
  if (!expectedPassword) {
    console.error('[admin] ADMIN_PASSWORD env var is not set');
    return false;
  }

  // Pad to same length before timingSafeEqual (it requires equal-length buffers)
  const a = Buffer.from(password.padEnd(128, '\0'));
  const b = Buffer.from(expectedPassword.padEnd(128, '\0'));

  // Constant-time comparison: prevents attackers timing the loop
  return crypto.timingSafeEqual(a, b);
}

// ─── Token creation ───────────────────────────────────────────────────────────
/**
 * Creates a signed token string: base64url(payload) + "." + hmac_signature
 * Payload contains the email and expiry timestamp so we can verify it later.
 */
export function createAdminToken(email: string): string {
  const payload = {
    email,
    // "issued at" and "expires at" Unix timestamps
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };

  // Encode payload as base64url
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

  // Sign with HMAC-SHA256 using our secret
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

// ─── Token verification ───────────────────────────────────────────────────────
/**
 * Verifies a token string. Returns the admin email if valid, null otherwise.
 * Checks: signature matches, token has not expired, email is in allowlist.
 */
export function verifyAdminToken(token: string): { email: string } | null {
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;

    // Re-compute expected signature to check tampering
    const expectedSignature = crypto
      .createHmac('sha256', getSecret())
      .update(encodedPayload)
      .digest('base64url');

    // Timing-safe comparison of signatures
    const sigA = Buffer.from(signature.padEnd(64, '0'));
    const sigB = Buffer.from(expectedSignature.padEnd(64, '0'));
    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      return null;
    }

    // Decode and parse payload
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());

    // Check expiry
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    // Double-check email is still in allowlist
    if (!ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(payload.email?.toLowerCase())) {
      return null;
    }

    return { email: payload.email };
  } catch {
    // Any parse/decode error → invalid token
    return null;
  }
}

// ─── Session helpers (server components / route handlers) ────────────────────
/**
 * Reads and verifies the admin cookie from the current request.
 * Returns the admin email if authenticated, null if not.
 */
export async function getAdminSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
