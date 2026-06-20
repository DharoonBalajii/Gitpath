// Course Generation Worker — the ONLY place AI is called
// Runs separately from Next.js, triggered by BullMQ

import * as fs from 'fs';
import { Worker } from 'bullmq';
import { createRedisConnection } from '../lib/queue/redis';
import { QUEUE_NAMES } from '../lib/queue/queues';
import { db } from '../lib/db/client';
import { generateCourse } from '../lib/ai/generator';
import type { CourseGenerationJobPayload, RepositoryGraph } from '../lib/types/index';

export function startCourseGenerationWorker() {
  const worker = new Worker<CourseGenerationJobPayload>(
    QUEUE_NAMES.COURSE_GENERATION,
    async (job) => {
      const { repositoryId, aiJobId } = job.data;
      console.log(`[CourseGen] Starting for repository: ${repositoryId}`);

      await db.aIJob.update({
        where: { id: aiJobId },
        data: { status: 'PROCESSING', startedAt: new Date() },
      });

      try {
        const repo = await db.repository.findUniqueOrThrow({
          where: { id: repositoryId },
          include: { graph: true },
        });

        if (!repo.graph) {
          throw new Error('Repository graph not found — analysis must complete first');
        }

        if (!repo.clonePath) {
          throw new Error('Clone path not set — clone must complete first');
        }

        const graph = {
          folders: repo.graph.folders,
          files: repo.graph.files,
          dependencies: repo.graph.dependencies,
          components: repo.graph.components,
          apiRoutes: repo.graph.apiRoutes,
          dbSchema: repo.graph.dbSchema,
          envVars: repo.graph.envVars,
          importGraph: repo.graph.importGraph,
          conceptTags: repo.graph.conceptTags,
          architectureType: repo.graph.architectureType,
          complexity: repo.graph.complexity,
        } as RepositoryGraph;

        await job.updateProgress(5);
        await generateCourse(repositoryId, graph, repo.clonePath);
        await job.updateProgress(100);

        await db.aIJob.update({
          where: { id: aiJobId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            resultSummary: { message: 'Course generated successfully' },
          },
        });

        // Delete the local clone — all content is now stored in the DB.
        if (fs.existsSync(repo.clonePath)) {
          fs.rmSync(repo.clonePath, { recursive: true, force: true });
          await db.repository.update({ where: { id: repositoryId }, data: { clonePath: null } }).catch(() => {});
          console.log(`[CourseGen] Clone deleted: ${repo.clonePath}`);
        }

        console.log(`[CourseGen] Completed for repository: ${repositoryId}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[CourseGen] Failed for repository ${repositoryId}:`, message);

        await db.aIJob.update({
          where: { id: aiJobId },
          data: {
            status: 'FAILED',
            errorMessage: message,
            completedAt: new Date(),
          },
        });

        await db.course.updateMany({
          where: { repositoryId, generationStatus: 'GENERATING' },
          data: { generationStatus: 'FAILED', generationError: message },
        });

        throw err;
      }
    },
    {
      connection: createRedisConnection(),
      concurrency: 1,    // one AI job at a time — GPU is the bottleneck
      limiter: {
        max: 1,
        duration: 1000,
      },
    },
  );

  worker.on('failed', (job, err) => {
    console.error(`[CourseGen] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
