// Analysis Worker — runs static analysis on cloned repos, no AI
// Produces the RepositoryGraph stored in Postgres

import { Worker } from 'bullmq';
import { createRedisConnection } from '../lib/queue/redis';
import { QUEUE_NAMES, getCourseGenerationQueue } from '../lib/queue/queues';
import { db } from '../lib/db/client';
import { analyzeRepository } from '../lib/analyzer/index';
import type { AnalysisJobPayload } from '../lib/types/index';

export function startAnalysisWorker() {
  const worker = new Worker<AnalysisJobPayload>(
    QUEUE_NAMES.ANALYSIS,
    async (job) => {
      const { repositoryId, clonePath } = job.data;
      console.log(`[Analysis] Starting: ${repositoryId}`);

      await db.repository.update({
        where: { id: repositoryId },
        data: { analysisStatus: 'ANALYZING' },
      });

      try {
        await job.updateProgress(5);
        const result = await analyzeRepository(clonePath);
        await job.updateProgress(80);

        // Store graph in DB
        await db.repositoryGraph.upsert({
          where: { repositoryId },
          create: {
            repositoryId,
            folders: result.graph.folders as any,
            files: result.graph.files as any,
            dependencies: result.graph.dependencies as any,
            components: result.graph.components as any,
            apiRoutes: result.graph.apiRoutes as any,
            dbSchema: (result.graph.dbSchema ?? undefined) as any,
            envVars: result.graph.envVars as any,
            importGraph: result.graph.importGraph as any,
            conceptTags: result.graph.conceptTags,
            architectureType: result.graph.architectureType,
            complexity: result.graph.complexity,
          },
          update: {
            folders: result.graph.folders as any,
            files: result.graph.files as any,
            dependencies: result.graph.dependencies as any,
            components: result.graph.components as any,
            apiRoutes: result.graph.apiRoutes as any,
            dbSchema: (result.graph.dbSchema ?? undefined) as any,
            envVars: result.graph.envVars as any,
            importGraph: result.graph.importGraph as any,
            conceptTags: result.graph.conceptTags,
            architectureType: result.graph.architectureType,
            complexity: result.graph.complexity,
            version: { increment: 1 },
          },
        });

        // Update repo metadata from analysis
        await db.repository.update({
          where: { id: repositoryId },
          data: {
            analysisStatus: 'ANALYZED',
            analyzedAt: new Date(),
            detectedLanguages: result.detectedLanguages,
            detectedFrameworks: result.detectedFrameworks,
            packageManager: result.packageManager,
            hasTests: result.hasTests,
            hasDocker: result.hasDocker,
            hasCI: result.hasCI,
            totalFiles: result.totalFiles,
            totalLines: result.totalLines,
          },
        });

        await job.updateProgress(90);

        // Create AIJob record and enqueue course generation
        const existingCourse = await db.course.findFirst({ where: { repositoryId } });
        if (!existingCourse) {
          const aiJob = await db.aIJob.create({
            data: {
              repositoryId,
              type: 'GENERATE_COURSE',
              status: 'QUEUED',
              priority: 5,
            },
          });

          const courseQueue = getCourseGenerationQueue();
          const bullJob = await courseQueue.add('generate-course', {
            repositoryId,
            aiJobId: aiJob.id,
            priority: 5,
          });

          await db.aIJob.update({
            where: { id: aiJob.id },
            data: { bullmqJobId: bullJob.id },
          });
        }

        await job.updateProgress(100);
        console.log(`[Analysis] Done: ${repositoryId}, complexity=${result.graph.complexity}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await db.repository.update({
          where: { id: repositoryId },
          data: { analysisStatus: 'FAILED' },
        });
        throw new Error(`Analysis failed: ${message}`);
      }
    },
    {
      connection: createRedisConnection() as any,
      concurrency: 2,        // analysis is CPU-heavy — limit parallelism
    },
  );

  worker.on('failed', (job, err) => {
    console.error(`[Analysis] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
