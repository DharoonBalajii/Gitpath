// POST /api/repositories — import a new repository
// GET  /api/repositories — list repositories with generation status

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { importRepositorySchema } from '@/lib/validators/repository';
import { rateLimit } from '@/lib/utils/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import type { APIResponse } from '@/lib/types/index';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<APIResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const pageSize = Math.min(20, Number(searchParams.get('pageSize') ?? 10));
  const skip = (page - 1) * pageSize;

  const [repositories, total] = await Promise.all([
    db.repository.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            generationStatus: true,
            isPublished: true,
            totalLessons: true,
          },
        },
        _count: { select: { courses: true } },
      },
    }),
    db.repository.count(),
  ]);

  return NextResponse.json<APIResponse>({
    success: true,
    data: { items: repositories, total, page, pageSize, hasMore: skip + pageSize < total },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<APIResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 5 imports per 10 minutes per user
  const rl = rateLimit(`import:${session.user.id}`, 5, 10 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json<APIResponse>(
      { success: false, error: 'Rate limit exceeded. Try again later.', code: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<APIResponse>({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = importRepositorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<APIResponse>(
      { success: false, error: parsed.error.errors[0]?.message ?? 'Validation error' },
      { status: 422 },
    );
  }

  const { url } = parsed.data;

  // Cloudflare Turnstile bot check (skipped automatically when not configured)
  const turnstileToken = (body as { turnstileToken?: string }).turnstileToken;
  if (!(await verifyTurnstile(turnstileToken))) {
    return NextResponse.json<APIResponse>(
      { success: false, error: 'Bot verification failed. Please try again.', code: 'TURNSTILE_FAILED' },
      { status: 403 },
    );
  }

  // Parse owner/name from URL
  const match = url.match(/github\.com\/([^/]+)\/([^/?#]+)/);
  if (!match) {
    return NextResponse.json<APIResponse>({ success: false, error: 'Invalid GitHub URL' }, { status: 422 });
  }
  const [, owner, repoName] = match;
  if (!owner || !repoName) {
    return NextResponse.json<APIResponse>({ success: false, error: 'Could not parse owner/repo from URL' }, { status: 422 });
  }
  const fullName = `${owner}/${repoName.replace(/\.git$/, '')}`;

  try {
    // fullName is globally unique — courses are shared across users.
    // If this repo already exists (imported by anyone), return it immediately.
    const existing = await db.repository.findUnique({ where: { fullName } });
    if (existing) {
      return NextResponse.json<APIResponse>({ success: true, data: existing });
    }

    // Fetch basic metadata from GitHub API (public, no auth required)
    let repoMeta: {
      description: string | null;
      language: string | null;
      default_branch: string;
      private: boolean;
      stargazers_count: number;
      topics: string[];
    } = {
      description: null,
      language: null,
      default_branch: 'main',
      private: false,
      stargazers_count: 0,
      topics: [],
    };

    try {
      const ghRes = await fetch(`https://api.github.com/repos/${fullName}`, {
        headers: {
          Accept: 'application/vnd.github+json',
          ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
        },
        next: { revalidate: 300 },
      });
      if (ghRes.ok) {
        repoMeta = await ghRes.json() as typeof repoMeta;
      }
    } catch {
      // Non-fatal — continue without GitHub metadata
    }

    const repository = await db.repository.create({
      data: {
        userId: session.user.id,
        owner: owner!,
        name: repoName.replace(/\.git$/, ''),
        fullName,
        description: repoMeta.description,
        githubUrl: `https://github.com/${fullName}`,
        defaultBranch: repoMeta.default_branch,
        isPrivate: repoMeta.private,
        stars: repoMeta.stargazers_count,
        language: repoMeta.language,
        topics: repoMeta.topics ?? [],
        cloneStatus: 'PENDING',
        analysisStatus: 'PENDING',
      },
    });

    // Trigger pipeline: clone → analyze → generate.
    // Uses inline (in-process) mode locally; BullMQ queue in production.
    const pipelineMode = process.env.PIPELINE_MODE ?? (process.env.REDIS_URL ? 'queue' : 'inline');
    const cloneUrl = `https://github.com/${fullName}.git`;

    if (pipelineMode === 'inline') {
      const { runPipelineInline } = await import('@/lib/pipeline/inline');
      void runPipelineInline({ repositoryId: repository.id, githubUrl: cloneUrl });
    } else {
      const { enqueueRepositoryImport } = await import('@/lib/queue/queues');
      await enqueueRepositoryImport({
        repositoryId: repository.id,
        githubUrl: cloneUrl,
        userId: session.user.id,
      });
    }

    return NextResponse.json<APIResponse>({ success: true, data: repository }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/repositories] Unhandled error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json<APIResponse>({ success: false, error: message }, { status: 500 });
  }
}
