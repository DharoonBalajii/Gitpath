'use client';

import { useState } from 'react';
import { X, ExternalLink, BookOpen, Lightbulb, ChevronRight } from 'lucide-react';

interface LearnMoreProps {
  concept: string;
  children?: React.ReactNode;
}

// Static knowledge base for common concepts — enough to enrich any generated course.
const CONCEPT_KNOWLEDGE: Record<string, { summary: string; whyItMatters: string; realWorld: string; goDeeper: string[] }> = {
  'api-routes': {
    summary: 'API routes are server-side endpoints that handle HTTP requests. In Next.js, any file inside `app/api/` exports route handlers (GET, POST, etc.) that run on the server, never in the browser.',
    whyItMatters: 'They let you co-locate backend logic with your frontend in one repo. No separate Express server needed — the framework handles routing, edge deployment, and streaming out of the box.',
    realWorld: 'Stripe webhooks, form submissions, AI completions, OAuth callbacks — anything that needs a server-side HTTP endpoint uses API routes.',
    goDeeper: ['HTTP semantics (GET vs POST vs PUT vs DELETE)', 'Edge runtime vs Node.js runtime in Next.js', 'Rate limiting strategies', 'API authentication with JWT or sessions'],
  },
  'validation': {
    summary: 'Validation ensures data meets the expected shape and constraints before it is used. Schema-first libraries like Zod or Yup describe the expected type, then parse and coerce incoming data.',
    whyItMatters: 'Unvalidated input is the root cause of most injection attacks, crashes, and data corruption. Validating at the boundary (API route, form submit) means your business logic can trust the data it receives.',
    realWorld: 'Every production API validates its input. Zod is common in the TypeScript ecosystem because it generates types from the schema, eliminating the type/validation drift you get with hand-written guards.',
    goDeeper: ['Zod vs Yup vs Valibot', 'Runtime vs compile-time type checking', 'Input sanitisation vs validation', 'Error message formatting for UX'],
  },
  'idempotency': {
    summary: 'An idempotent operation produces the same result no matter how many times it is called. A "check before create" pattern (findUnique → create only if null) makes writes idempotent.',
    whyItMatters: 'Networks are unreliable. Retries, double-clicks, and race conditions mean the same request can arrive multiple times. Idempotency ensures each logical operation happens exactly once.',
    realWorld: 'Stripe payment intents use idempotency keys. GitHub webhooks can be delivered more than once. S3 PutObject is idempotent by design.',
    goDeeper: ['Database unique constraints as idempotency enforcement', 'Optimistic locking vs pessimistic locking', 'Idempotency keys in REST APIs', 'Saga pattern in distributed systems'],
  },
  'job-queue': {
    summary: 'A job queue decouples slow work from the request-response cycle. The API enqueues a task, a background worker picks it up, and the client polls or listens for completion.',
    whyItMatters: 'HTTP requests time out after ~30s. Cloning a repo, sending emails, processing images, or running AI inference can take minutes — they belong in a worker, not a route handler.',
    realWorld: 'BullMQ (Redis-backed), AWS SQS, Celery (Python), and Sidekiq (Ruby) are all job queue implementations. Every large web app uses one.',
    goDeeper: ['BullMQ concurrency and rate limiting', 'Dead letter queues for failed jobs', 'Priority queues', 'Saga pattern for multi-step workflows'],
  },
  'auth': {
    summary: 'Authentication (who you are) and authorization (what you can do) are the foundation of secure apps. Sessions tie a server-stored token to a user identity; JWTs encode claims in a signed token.',
    whyItMatters: 'Without auth, any user can read or modify any data. With NextAuth/Auth.js, provider OAuth, session management, and CSRF protection are handled by the library.',
    realWorld: 'GitHub OAuth, Google sign-in, magic links, passkeys — all different auth flows, all built on the same session-or-JWT model.',
    goDeeper: ['OAuth 2.0 flow in depth', 'JWT signing algorithms (HS256 vs RS256)', 'CSRF protection', 'Session fixation attacks'],
  },
  'react-context': {
    summary: 'React Context provides a way to pass data through the component tree without prop drilling. A Provider wraps a subtree; any descendant can read the value with useContext.',
    whyItMatters: 'Prop drilling (passing the same prop through 5 layers of components that don\'t use it) makes refactoring painful. Context solves this for genuinely global state like theme, user, or locale.',
    realWorld: 'next-themes uses Context for the dark/light theme toggle. SWR\'s cache uses Context to share data between hooks. Auth state is classically stored in Context.',
    goDeeper: ['Context vs Zustand vs Redux', 'Performance: preventing unnecessary re-renders with useMemo', 'Multiple contexts vs a single store', 'Server Components and why Context is client-only'],
  },
};

const FALLBACK = {
  summary: 'This concept is a foundational building block used throughout modern software development. Understanding it well will make every related pattern easier to reason about.',
  whyItMatters: 'Core concepts compound — once you truly understand the "why" behind them, you start recognising the same pattern in new frameworks and languages without needing to re-learn from scratch.',
  realWorld: 'Production systems everywhere rely on this pattern. It appears in backend APIs, frontend state management, database design, and infrastructure configuration.',
  goDeeper: ['Official documentation for the framework or library', 'Source code of popular open-source projects using this pattern', 'Blog posts on the trade-offs', 'Conference talks on design decisions'],
};

export function LearnMore({ concept, children }: LearnMoreProps) {
  const [open, setOpen] = useState(false);
  const slug = concept.toLowerCase().replace(/\s+/g, '-');
  const info = CONCEPT_KNOWLEDGE[slug] ?? FALLBACK;
  const displayName = concept.replace(/[-_]/g, ' ');

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full border border-brand-violet/40 bg-brand-violet/5 px-2.5 py-1 text-[11px] font-medium text-brand-violet transition-all hover:bg-brand-violet/15"
      >
        {children ?? displayName}
        <ChevronRight className="h-3 w-3" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={() => setOpen(false)}>
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* panel */}
          <div
            className="relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-2xl gradient-border glass-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-violet">Deep dive</p>
                <h3 className="mt-0.5 text-xl font-bold capitalize">{displayName}</h3>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-accent text-muted-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-border bg-background/40 p-4">
                <p className="mb-1.5 flex items-center gap-1.5 font-semibold text-foreground"><BookOpen className="h-4 w-4 text-brand-indigo" /> What is it?</p>
                <p className="text-muted-foreground leading-relaxed">{info.summary}</p>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="mb-1.5 flex items-center gap-1.5 font-semibold text-amber-500"><Lightbulb className="h-4 w-4" /> Why it matters</p>
                <p className="text-muted-foreground leading-relaxed">{info.whyItMatters}</p>
              </div>

              <div className="rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 p-4">
                <p className="mb-1.5 font-semibold text-brand-cyan">In the real world</p>
                <p className="text-muted-foreground leading-relaxed">{info.realWorld}</p>
              </div>

              <div className="rounded-xl border border-border bg-background/40 p-4">
                <p className="mb-2 font-semibold text-foreground">Go deeper</p>
                <ul className="space-y-1.5">
                  {info.goDeeper.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-muted-foreground">
                      <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-brand-violet" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
