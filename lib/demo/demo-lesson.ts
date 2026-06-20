// Demo content for the interactive lesson template.
// Shape = GeneratedLesson (lib/types) — the exact object the Vast.ai / Qwen Coder
// generator produces. Swap this object for AI output and the page renders identically.

import type { GeneratedLesson } from '@/lib/types/index';

export const demoLesson: GeneratedLesson & { moduleTitle: string; courseTitle: string } = {
  courseTitle: 'Spotify Clone',
  moduleTitle: 'Module 2 · Backend & Data',
  order: 4,
  title: 'The Repository Import Endpoint',
  description:
    'How a single POST request turns a GitHub URL into a background job — validation, idempotency, and the queue hand-off.',
  difficulty: 'INTERMEDIATE',
  estimatedMinutes: 12,
  xpReward: 120,

  explanation: `This file is the **front door** of the whole pipeline. When a user pastes a repository URL, the browser sends a \`POST\` to \`/api/repositories\`. This route's job is deliberately small: **validate the request, make sure we never import the same repo twice, then hand the slow work to a background queue** and return immediately.

Why so little logic here? Because cloning and analysing a repository can take minutes. If we did that inside the request, the HTTP connection would time out. Instead the route is a *dispatcher* — it records intent in the database and enqueues a job. The heavy lifting happens later in a worker.`,

  codeSnippets: [
    {
      filename: 'app/api/repositories/route.ts',
      language: 'typescript',
      explanation:
        'The handler authenticates the user, rate-limits, then validates the body with a Zod schema before touching the database.',
      highlight: [3, 9],
      code: `export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = importRepositorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 422 });
  }
  const { url } = parsed.data;`,
    },
    {
      filename: 'app/api/repositories/route.ts',
      language: 'typescript',
      explanation:
        'Idempotency: if the repo already exists we return it instead of importing again — the AI only ever runs once per repository.',
      highlight: [2, 3],
      code: `  const existing = await db.repository.findUnique({ where: { fullName } });
  if (existing) {
    return NextResponse.json({ success: true, data: existing });
  }

  const repository = await db.repository.create({ data: { /* ... */ } });
  await enqueueRepositoryImport({ repositoryId: repository.id, githubUrl });
  return NextResponse.json({ success: true, data: repository }, { status: 201 });`,
    },
  ],

  flowDiagram: null,

  realWorldAnalogy:
    'Think of this endpoint like the front desk of a dry cleaner. You hand over your clothes (the URL), they write a ticket and give it a number (create the DB row), and drop the bag into the back room (the queue). They do NOT clean your shirt while you wait at the counter — you get your ticket instantly and the work happens out back.',

  summary:
    'The import route validates and de-duplicates the request, persists a repository record, and enqueues a background job — returning in milliseconds while the real work runs asynchronously.',

  practiceTask:
    'Add a guard that rejects URLs from hosts other than github.com. Where in the handler should it go — before or after the Zod parse, and why?',

  keyTakeaways: [
    'API routes should dispatch slow work, not perform it inline.',
    'Always authenticate and validate before writing to the database.',
    'Idempotency (check-before-create) is what makes "AI runs once per repo" possible.',
    'Returning 201 + the new resource lets the client start polling for status.',
  ],

  architecturalDecisions: [
    {
      decision: 'Enqueue a background job instead of processing inline',
      rationale: 'Cloning + static analysis + AI generation can take minutes; an HTTP request would time out.',
      alternatives: ['Process synchronously in the request', 'Use a serverless cron poll'],
      tradeoffs: ['Adds a queue (Redis) dependency', 'Client must poll/stream for completion status'],
    },
  ],

  bestPractices: [
    'Validate request bodies with a schema (Zod) — never trust client input.',
    'Rate-limit write endpoints to protect the GPU/queue from abuse.',
    'Return early on the unhappy path to keep the happy path readable.',
  ],

  commonMistakes: [
    'Doing the clone/analysis inside the route → request timeouts.',
    'Skipping the existence check → duplicate work and wasted GPU time.',
    'Trusting the URL without parsing owner/repo → injection & bad data.',
  ],

  relatedFiles: [
    'lib/validators/repository.ts',
    'lib/queue/queues.ts',
    'workers/clone.worker.ts',
    'app/api/repositories/[id]/status/route.ts',
  ],

  conceptsCovered: ['api-routes', 'validation', 'idempotency', 'job-queue', 'auth'],

  quizzes: [
    {
      type: 'MULTIPLE_CHOICE',
      question: 'Why does the import route enqueue a job instead of cloning the repo directly?',
      options: [
        'Because cloning requires a GPU',
        'Because the work can take minutes and would time out the HTTP request',
        'Because Next.js forbids file system access in routes',
        'Because the database is read-only',
      ],
      correctAnswer: 'Because the work can take minutes and would time out the HTTP request',
      explanation:
        'Long-running work belongs in a background worker. The route stays fast by recording intent and handing off to the queue.',
      difficulty: 'INTERMEDIATE',
      xpReward: 20,
    },
    {
      type: 'MULTIPLE_CHOICE',
      question: 'What does the existence check (`findUnique` before `create`) guarantee?',
      options: [
        'That the user is authenticated',
        'That the URL is a valid GitHub link',
        'That a repository is only imported (and AI-generated) once',
        'That the response is cached in Redis',
      ],
      correctAnswer: 'That a repository is only imported (and AI-generated) once',
      explanation:
        'Idempotency: if the repo already exists we return it, so the expensive AI generation never runs twice for the same repo.',
      codeContext: "const existing = await db.repository.findUnique({ where: { fullName } });",
      difficulty: 'INTERMEDIATE',
      xpReward: 20,
    },
    {
      type: 'MULTIPLE_CHOICE',
      question: 'The route validates the request body before writing to the database.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: 'Validation (Zod safeParse) and auth happen first — the database is only touched on the happy path.',
      difficulty: 'BEGINNER',
      xpReward: 10,
    },
  ],
};

