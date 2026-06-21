import { Queue } from 'bullmq';
import { getRedis } from './redis';
import type {
  CloneJobPayload,
  AnalysisJobPayload,
  CourseGenerationJobPayload,
} from '../types/index';

// One queue per job type keeps priorities and concurrency separate
export const QUEUE_NAMES = {
  CLONE: 'repo-clone',
  ANALYSIS: 'repo-analysis',
  COURSE_GENERATION: 'course-generation',
} as const;

const defaultJobOptions = {
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 200 },
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5000,
  },
};

let _cloneQueue: Queue<CloneJobPayload> | null = null;
let _analysisQueue: Queue<AnalysisJobPayload> | null = null;
let _courseQueue: Queue<CourseGenerationJobPayload> | null = null;

export function getCloneQueue(): Queue<CloneJobPayload> {
  if (!_cloneQueue) {
    _cloneQueue = new Queue<CloneJobPayload>(QUEUE_NAMES.CLONE, {
      connection: getRedis() as any,
      defaultJobOptions,
    });
  }
  return _cloneQueue;
}

export function getAnalysisQueue(): Queue<AnalysisJobPayload> {
  if (!_analysisQueue) {
    _analysisQueue = new Queue<AnalysisJobPayload>(QUEUE_NAMES.ANALYSIS, {
      connection: getRedis() as any,
      defaultJobOptions,
    });
  }
  return _analysisQueue;
}

export function getCourseGenerationQueue(): Queue<CourseGenerationJobPayload> {
  if (!_courseQueue) {
    _courseQueue = new Queue<CourseGenerationJobPayload>(QUEUE_NAMES.COURSE_GENERATION, {
      connection: getRedis() as any,
      defaultJobOptions: {
        ...defaultJobOptions,
        // Course generation can take several minutes — long timeout
        attempts: 2,
      },
    });
  }
  return _courseQueue;
}

export async function enqueueRepositoryImport(payload: CloneJobPayload): Promise<string> {
  const queue = getCloneQueue();
  const job = await queue.add('clone', payload, {
    priority: 1,
  });
  return job.id ?? '';
}

export async function enqueueCourseGeneration(
  payload: CourseGenerationJobPayload,
): Promise<string> {
  const queue = getCourseGenerationQueue();
  const job = await queue.add('generate-course', payload, {
    priority: payload.priority,
    jobId: `course-${payload.repositoryId}`,  // deduplicate
  });
  return job.id ?? '';
}

export async function getJobStatus(queueName: string, jobId: string) {
  const queues: Record<string, Queue> = {
    [QUEUE_NAMES.CLONE]: getCloneQueue(),
    [QUEUE_NAMES.ANALYSIS]: getAnalysisQueue(),
    [QUEUE_NAMES.COURSE_GENERATION]: getCourseGenerationQueue(),
  };
  const queue = queues[queueName];
  if (!queue) return null;
  const job = await queue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  return {
    id: job.id,
    state,
    progress: job.progress,
    failedReason: job.failedReason,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
  };
}
