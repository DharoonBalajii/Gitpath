/**
 * lib/db/index.ts
 *
 * Re-exports the Prisma client so both import paths work:
 *   import { db } from '@/lib/db'          (short form used in new files)
 *   import { db } from '@/lib/db/client'   (existing files)
 */
export { db } from './client';
