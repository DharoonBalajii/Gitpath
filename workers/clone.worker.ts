// Clone Worker — runs outside Next.js, no page-level dependencies
// Clones GitHub repositories to disk and triggers analysis

import { Worker } from 'bullmq';
import * as path from 'path';
import * as fs from 'fs';
import simpleGit from 'simple-git';
import { createRedisConnection } from '../lib/queue/redis';
import { QUEUE_NAMES, getAnalysisQueue } from '../lib/queue/queues';
import { db } from '../lib/db/client';
import type { CloneJobPayload } from '../lib/types/index';

const CLONE_BASE_DIR = process.env.CLONE_BASE_DIR ?? '/tmp/gitpath/repos';
fs.mkdirSync(CLONE_BASE_DIR, { recursive: true });

export function startCloneWorker() {
  const worker = new Worker<CloneJobPayload>(
    QUEUE_NAMES.CLONE,
    async (job) => {
      const { repositoryId, githubUrl } = job.data;
      console.log(`[Clone] Starting: ${githubUrl}`);

      await db.repository.update({
        where: { id: repositoryId },
        data: { cloneStatus: 'CLONING' },
      });

      const clonePath = path.join(CLONE_BASE_DIR, repositoryId);

      // Remove stale clone if exists
      if (fs.existsSync(clonePath)) {
        fs.rmSync(clonePath, { recursive: true, force: true });
      }

      try {
        await job.updateProgress(10);

        const git = simpleGit();
        await git.clone(githubUrl, clonePath, [
          '--depth=1',          // shallow clone to save disk + time
          '--single-branch',
          '--no-tags',
        ]);

        await job.updateProgress(80);

        await db.repository.update({
          where: { id: repositoryId },
          data: {
            cloneStatus: 'CLONED',
            clonedAt: new Date(),
            clonePath,
          },
        });

        // Chain to analysis queue
        const analysisQueue = getAnalysisQueue();
        await analysisQueue.add('analyze', {
          repositoryId,
          clonePath,
        });

        await job.updateProgress(100);
        console.log(`[Clone] Done: ${repositoryId} → ${clonePath}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await db.repository.update({
          where: { id: repositoryId },
          data: { cloneStatus: 'FAILED' },
        });
        throw new Error(`Clone failed: ${message}`);
      }
    },
    {
      connection: createRedisConnection(),
      concurrency: 3,         // clone 3 repos at a time
    },
  );

  worker.on('failed', (job, err) => {
    console.error(`[Clone] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
