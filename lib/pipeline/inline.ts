// Inline pipeline — runs clone → analyze → generate in-process, without Redis/BullMQ.
// Used for local testing (PIPELINE_MODE=inline). Production uses the BullMQ workers.
// Mirrors the DB status updates the workers perform, so the SSE status endpoint
// (/api/repositories/[id]/status) reflects progress exactly the same way.

import * as path from 'path';
import * as fs from 'fs';
import simpleGit from 'simple-git';
import { db } from '../db/client';
import { analyzeRepository } from '../analyzer/index';
import { generateCourse } from '../ai/generator';
import type { RepositoryGraph } from '../types/index';

const CLONE_BASE_DIR = process.env.CLONE_BASE_DIR ?? '/tmp/gitpath/repos';

interface InlinePipelinePayload {
  repositoryId: string;
  githubUrl: string;
}

/**
 * Fire-and-forget friendly: callers should `void runPipelineInline(...)` so the
 * HTTP request returns immediately. All progress is persisted to the DB.
 */
export async function runPipelineInline({ repositoryId, githubUrl }: InlinePipelinePayload): Promise<void> {
  let clonePath: string | null = null;
  try {
    clonePath = await cloneStep(repositoryId, githubUrl);
    await analyzeStep(repositoryId, clonePath);
    await generateStep(repositoryId, clonePath);
    console.log(`[InlinePipeline] Completed for repository: ${repositoryId}`);
  } catch (err) {
    console.error(`[InlinePipeline] Failed for repository ${repositoryId}:`, err);
  } finally {
    // Always delete the local clone — all content is persisted in the DB.
    // This runs on success AND failure so no orphaned files are left on disk.
    if (clonePath && fs.existsSync(clonePath)) {
      fs.rmSync(clonePath, { recursive: true, force: true });
      await db.repository.update({ where: { id: repositoryId }, data: { clonePath: null } }).catch(() => {});
      console.log(`[InlinePipeline] Clone deleted: ${clonePath}`);
    }
  }
}

async function cloneStep(repositoryId: string, githubUrl: string): Promise<string> {
  console.log(`[InlinePipeline] Cloning: ${githubUrl}`);
  await db.repository.update({
    where: { id: repositoryId },
    data: { cloneStatus: 'CLONING' },
  });

  fs.mkdirSync(CLONE_BASE_DIR, { recursive: true });
  const clonePath = path.join(CLONE_BASE_DIR, repositoryId);
  if (fs.existsSync(clonePath)) {
    fs.rmSync(clonePath, { recursive: true, force: true });
  }

  try {
    // Use the GitHub token (if set) so private repos can be cloned over HTTPS.
    const token = process.env.GITHUB_TOKEN;
    const cloneUrl = token
      ? githubUrl.replace('https://github.com/', `https://${token}@github.com/`)
      : githubUrl;

    await simpleGit().clone(cloneUrl, clonePath, ['--depth=1', '--single-branch', '--no-tags']);

    await db.repository.update({
      where: { id: repositoryId },
      data: { cloneStatus: 'CLONED', clonedAt: new Date(), clonePath },
    });
    return clonePath;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.repository.update({
      where: { id: repositoryId },
      data: { cloneStatus: 'FAILED' },
    });
    throw new Error(`Clone failed: ${message}`);
  }
}

async function analyzeStep(repositoryId: string, clonePath: string): Promise<void> {
  console.log(`[InlinePipeline] Analyzing: ${repositoryId}`);
  await db.repository.update({
    where: { id: repositoryId },
    data: { analysisStatus: 'ANALYZING' },
  });

  try {
    const result = await analyzeRepository(clonePath);

    await db.repositoryGraph.upsert({
      where: { repositoryId },
      create: {
        repositoryId,
        folders: result.graph.folders,
        files: result.graph.files,
        dependencies: result.graph.dependencies,
        components: result.graph.components,
        apiRoutes: result.graph.apiRoutes,
        dbSchema: result.graph.dbSchema ?? undefined,
        envVars: result.graph.envVars,
        importGraph: result.graph.importGraph,
        conceptTags: result.graph.conceptTags,
        architectureType: result.graph.architectureType,
        complexity: result.graph.complexity,
      },
      update: {
        folders: result.graph.folders,
        files: result.graph.files,
        dependencies: result.graph.dependencies,
        components: result.graph.components,
        apiRoutes: result.graph.apiRoutes,
        dbSchema: result.graph.dbSchema ?? undefined,
        envVars: result.graph.envVars,
        importGraph: result.graph.importGraph,
        conceptTags: result.graph.conceptTags,
        architectureType: result.graph.architectureType,
        complexity: result.graph.complexity,
        version: { increment: 1 },
      },
    });

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
    console.log(`[InlinePipeline] Analysis done: ${repositoryId}, complexity=${result.graph.complexity}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.repository.update({
      where: { id: repositoryId },
      data: { analysisStatus: 'FAILED' },
    });
    throw new Error(`Analysis failed: ${message}`);
  }
}

async function generateStep(repositoryId: string, clonePath: string): Promise<void> {
  // Skip if a course already exists (AI runs once per repo — cached forever)
  const existingCourse = await db.course.findFirst({ where: { repositoryId } });
  if (existingCourse) {
    console.log(`[InlinePipeline] Course already exists for ${repositoryId}, skipping generation`);
    return;
  }

  console.log(`[InlinePipeline] Generating course: ${repositoryId}`);
  const aiJob = await db.aIJob.create({
    data: { repositoryId, type: 'GENERATE_COURSE', status: 'PROCESSING', priority: 5, startedAt: new Date() },
  });

  try {
    const repo = await db.repository.findUniqueOrThrow({
      where: { id: repositoryId },
      include: { graph: true },
    });
    if (!repo.graph) throw new Error('Repository graph not found');

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

    await generateCourse(repositoryId, graph, clonePath);

    await db.aIJob.update({
      where: { id: aiJob.id },
      data: { status: 'COMPLETED', completedAt: new Date(), resultSummary: { message: 'Course generated successfully' } },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.aIJob.update({
      where: { id: aiJob.id },
      data: { status: 'FAILED', errorMessage: message, completedAt: new Date() },
    });
    await db.course.updateMany({
      where: { repositoryId, generationStatus: 'GENERATING' },
      data: { generationStatus: 'FAILED', generationError: message },
    });
    throw new Error(`Course generation failed: ${message}`);
  }
}
