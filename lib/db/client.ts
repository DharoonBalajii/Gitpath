/**
 * lib/db/client.ts
 *
 * Singleton Prisma client. Exports `db` for use in all server-side code.
 *
 * Why the globalThis pattern?
 * Next.js hot-reload creates a new module context on every file change.
 * Without this guard, each hot-reload would open a new DB connection pool
 * and quickly exhaust the Supabase / PostgreSQL connection limit.
 *
 * In production, module code runs once per process, so the guard is a no-op.
 * Import as: import { db } from '@/lib/db';  (re-exported from lib/db/index.ts)
 */

import { PrismaClient } from '@prisma/client';

// Attach the client to globalThis so it survives hot-reloads in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Log all queries in development for debugging; only errors in production
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Cache the client on globalThis in non-production environments
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
