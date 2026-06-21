// GET /api/repositories/[id]/status — SSE endpoint for real-time pipeline progress

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id } = await params;

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Poll DB every 2 seconds and push status updates
      const poll = async () => {
        if (closed) return;
        try {
          const repo = await db.repository.findUnique({
            where: { id },
            select: {
              cloneStatus: true,
              analysisStatus: true,
              courses: {
                select: { generationStatus: true, id: true },
                take: 1,
              },
              aiJobs: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { status: true, type: true },
              },
            },
          });

          if (!repo) {
            send({ error: 'Repository not found' });
            controller.close();
            return;
          }

          const courseStatus = repo.courses[0]?.generationStatus ?? null;
          const courseId = repo.courses[0]?.id ?? null;

          send({
            cloneStatus: repo.cloneStatus,
            analysisStatus: repo.analysisStatus,
            courseStatus,
            courseId,
            done: courseStatus === 'COMPLETED' || courseStatus === 'FAILED',
          });

          if (courseStatus === 'COMPLETED' || courseStatus === 'FAILED') {
            controller.close();
            return;
          }
        } catch {
          // ignore transient DB errors
        }

        if (!closed) setTimeout(poll, 2000);
      };

      await poll();
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
