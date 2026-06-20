// Field-level encryption for sensitive DB columns (e.g. stored GitHub OAuth tokens).
// AES-256-GCM with a per-value random IV and an auth tag. The key is derived from
// ENCRYPTION_KEY in the environment (never stored in the database).
//
// Encrypted values are tagged `enc:v1:` so we can tell encrypted from plaintext and
// migrate formats later. If ENCRYPTION_KEY is unset, values pass through unchanged
// (and a warning is logged) — so local dev never hard-fails on a missing key.

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const PREFIX = 'enc:v1:';
const IV_LEN = 12;
const TAG_LEN = 16;

let warned = false;

function getKey(): Buffer | null {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    if (!warned) {
      console.warn('[encryption] ENCRYPTION_KEY not set — sensitive values are NOT encrypted.');
      warned = true;
    }
    return null;
  }
  // Normalise any-length secret to a 32-byte key
  return crypto.createHash('sha256').update(secret).digest();
}

export function encrypt(plaintext: string | null | undefined): string | null {
  if (plaintext == null) return null;
  const key = getKey();
  if (!key) return plaintext;

  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decrypt(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (!value.startsWith(PREFIX)) return value; // plaintext / legacy
  const key = getKey();
  if (!key) return value;

  const raw = Buffer.from(value.slice(PREFIX.length), 'base64');
  const iv = raw.subarray(0, IV_LEN);
  const tag = raw.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const data = raw.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}
