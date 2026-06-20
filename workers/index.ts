// Worker entry point — run with: tsx workers/index.ts
// Keep this process separate from the Next.js server

import { startCloneWorker } from './clone.worker';
import { startAnalysisWorker } from './analysis.worker';
import { startCourseGenerationWorker } from './course-generation.worker';

console.log('[Workers] Starting all workers...');

const cloneWorker = startCloneWorker();
const analysisWorker = startAnalysisWorker();
const courseWorker = startCourseGenerationWorker();

console.log('[Workers] All workers running');

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`[Workers] Received ${signal}, shutting down...`);
  await Promise.all([
    cloneWorker.close(),
    analysisWorker.close(),
    courseWorker.close(),
  ]);
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
