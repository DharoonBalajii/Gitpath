// POST /api/tutor — AI tutor chat, scoped to a specific repository
// This is the one API that calls AI per request, but it's gated and uses streaming

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { createAIClient, AI_MODEL } from '@/lib/ai/client';
import { buildTutorSystemPrompt } from '@/lib/ai/prompts';
import { rateLimit } from '@/lib/utils/rate-limit';
import type { APIResponse, RepositoryGraph, TutorMessageItem } from '@/lib/types/index';

const tutorMessageSchema = z.object({
  repositoryId: z.string().cuid(),
  message: z.string().min(1).max(2000),
  sessionId: z.string().cuid().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<APIResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit tutor: 20 messages per hour per user
  const rl = rateLimit(`tutor:${session.user.id}`, 20, 60 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json<APIResponse>(
      { success: false, error: 'Tutor rate limit reached. Try again in an hour.', code: 'RATE_LIMITED' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<APIResponse>({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = tutorMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<APIResponse>({ success: false, error: 'Validation error' }, { status: 422 });
  }

  const { repositoryId, message, sessionId } = parsed.data;

  const repoGraph = await db.repositoryGraph.findUnique({
    where: { repositoryId },
    select: {
      conceptTags: true,
      architectureType: true,
      complexity: true,
      files: true,
      components: true,
      apiRoutes: true,
      envVars: true,
      repository: { select: { fullName: true } },
    },
  });

  if (!repoGraph) {
    return NextResponse.json<APIResponse>(
      { success: false, error: 'Repository graph not found. Analysis must complete first.' },
      { status: 404 },
    );
  }

  // Get or create tutor session
  let tutorSession;
  if (sessionId) {
    tutorSession = await db.tutorSession.findUnique({ where: { id: sessionId } });
  }
  if (!tutorSession) {
    tutorSession = await db.tutorSession.create({
      data: { userId: session.user.id, repositoryId },
    });
  }

  // Load last 10 messages for context
  const history = await db.tutorMessage.findMany({
    where: { sessionId: tutorSession.id },
    orderBy: { createdAt: 'asc' },
    take: 10,
    select: { role: true, content: true },
  });

  // Save user message
  await db.tutorMessage.create({
    data: {
      sessionId: tutorSession.id,
      userId: session.user.id,
      role: 'USER',
      content: message,
    },
  });

  const graph = repoGraph as unknown as RepositoryGraph & { repository: { fullName: string } };
  const systemPrompt = buildTutorSystemPrompt(graph, repoGraph.repository.fullName);

  const messages: TutorMessageItem[] = [
    ...history.map((h) => ({
      role: h.role.toLowerCase() as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user' as const, content: message },
  ];

  // Stream the AI response
  const ai = createAIClient();
  const stream = await ai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    max_tokens: 1024,
    temperature: 0.4,
    stream: true,
  });

  const encoder = new TextEncoder();
  let fullResponse = '';

  const responseStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta.content ?? '';
        if (delta) {
          fullResponse += delta;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
        }
      }

      // Save assistant response to DB
      await db.tutorMessage.create({
        data: {
          sessionId: tutorSession.id,
          userId: session.user.id,
          role: 'ASSISTANT',
          content: fullResponse,
        },
      });

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, sessionId: tutorSession.id })}\n\n`));
      controller.close();
    },
  });

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
