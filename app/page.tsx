/**
 * app/page.tsx
 *
 * Public landing page — the first thing visitors see at /.
 *
 * Sections (top → bottom):
 *   1. Sticky navigation bar with logo, links, sign-in CTA
 *   2. Hero — headline, sub-headline, stats strip, dual CTA, browser mockup
 *   3. "Trusted by" tech stack strip
 *   4. "How it works" — 3-step explainer
 *   5. Feature grid — 6 feature cards
 *   6. "Why Gitpath" — principles + pipeline visual
 *   7. Comparison table — vs docs / YouTube / tutorials
 *   8. FAQ accordion
 *   9. Final CTA banner
 *  10. Footer with legal links
 *
 * Authenticated users are instantly redirected to /dashboard.
 * All interactive bits (ThemeToggle, LiveGraphBackground, InteractiveMindmap,
 * FaqItem, AnimatedCounter) are separate components to keep this file lean.
 */

import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  GitBranch, Zap, BookOpen, Trophy, ArrowRight, Code2,
  Sparkles, Brain, GraduationCap, MessageSquare, FolderTree, Gauge,
  Check, Shield, Clock, Users, Star, ChevronDown, ChevronRight,
  Layers, Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';
import { LiveGraphBackground } from '@/components/landing/LiveGraphBackground';
import { InteractiveMindmap } from '@/components/landing/InteractiveMindmap';
import { ThemeToggle } from '@/components/ThemeToggle';

export default async function LandingPage() {
  // Try to get current session — if logged in, skip the landing page entirely
  let session = null;
  try {
    session = await auth();
  } catch {
    // DB unreachable at render time — show the landing page as unauthenticated
  }
  if (session?.user) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">

      {/* ── 1. Navigation ───────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl accent-gradient-bg shadow-md shadow-indigo-500/20">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-[17px] font-semibold tracking-tight">Gitpath</span>
          </div>

          {/* Nav links — hidden on mobile */}
          <div className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#compare" className="transition-colors hover:text-foreground">Compare</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
          </div>

          {/* Right side: theme toggle + auth buttons */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-accent hover:text-foreground">
                Sign in
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="accent-gradient-bg border-0 text-white shadow-md shadow-indigo-500/25 transition-all hover:opacity-90">
                Get started free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── 2. Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-24 pb-20">
        {/* Animated node-network background */}
        <LiveGraphBackground className="absolute inset-0 h-full w-full opacity-70 [mask-image:radial-gradient(ellipse_75%_60%_at_50%_38%,#000_45%,transparent_100%)]" />
        {/* Ambient colour blobs */}
        <div className="glow-blob animate-drift left-[-10%] top-[-10%] h-[420px] w-[420px] bg-indigo-400/20" />
        <div className="glow-blob animate-drift-slow right-[-8%] top-[5%] h-[380px] w-[380px] bg-fuchsia-400/15" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          {/* Badge */}
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              AI-powered learning from real code
            </span>
          </Reveal>

          {/* Headline */}
          <Reveal delay={80}>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Turn any GitHub repo into{' '}
              <span className="text-accent-gradient">a learning course</span>
            </h1>
          </Reveal>

          {/* Sub-headline */}
          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Paste a GitHub URL and get an interactive course — structured lessons,
              quizzes, and an AI tutor grounded in the actual codebase. Learn how
              real projects are built, not just how they work.
            </p>
          </Reveal>

          {/* Stats strip */}
          <Reveal delay={200}>
            <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              {[
                { icon: Users, stat: '100% free', label: 'to get started' },
                { icon: Clock, stat: '< 5 min', label: 'to first lesson' },
                { icon: Shield, stat: 'No CC', label: 'required' },
              ].map((item) => (
                <div key={item.stat} className="flex items-center gap-1.5">
                  <item.icon className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="font-semibold text-foreground">{item.stat}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </Reveal>

          {/* CTA buttons */}
          <Reveal delay={240}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/login">
                <Button size="lg" className="accent-gradient-bg h-12 border-0 px-7 text-base text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] hover:opacity-95">
                  Start learning free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo/lesson">
                <Button size="lg" variant="outline" className="h-12 border-border bg-card px-7 text-base text-foreground shadow-sm transition-all hover:bg-accent">
                  <GitBranch className="mr-2 h-4 w-4" /> See an example lesson
                </Button>
              </Link>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <p className="mt-4 text-xs text-muted-foreground">
              Sign in with GitHub · No credit card · No setup required
            </p>
          </Reveal>
        </div>

        {/* Browser mockup with live mindmap */}
        <Reveal delay={200} y={40}>
          <div className="relative z-10 mx-auto mt-16 max-w-4xl">
            <div className="rounded-2xl border border-border bg-card p-2 shadow-2xl shadow-slate-300/40 dark:shadow-black/40">
              <div className="rounded-xl border border-border bg-muted/30">
                {/* Fake browser chrome */}
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
                    <div className="ml-3 flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5">
                      <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono text-xs text-muted-foreground">github.com/facebook/react</span>
                    </div>
                  </div>
                  <span className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground sm:flex">
                    {/* Pulsing green dot — "live" indicator */}
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    Generating course…
                  </span>
                </div>
                {/* The interactive mindmap preview */}
                <div className="px-2 py-3 sm:px-4">
                  <InteractiveMindmap />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── 3. Tech Stack Strip ─────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30 px-6 py-10">
        <div className="mx-auto max-w-5xl text-center">
          <Reveal>
            <p className="text-sm font-medium text-muted-foreground">
              Works with any public repo — across the languages and frameworks you already use
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {[
                'TypeScript', 'React', 'Next.js', 'Python', 'Node.js', 'Go', 'Rust', 'Vue', 'Django',
              ].map((t) => (
                <span key={t} className="text-sm font-semibold text-muted-foreground/70">{t}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 4. How it works ─────────────────────────────────────────────────── */}
      <section id="how" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-indigo-500">How it works</span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Three steps. No setup.</h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Paste a URL and get a full course in under five minutes.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: '01',
                icon: GitBranch,
                title: 'Import a repository',
                description: 'Paste any public GitHub URL. We clone it, map imports/exports, detect frameworks, and build a dependency graph — no AI yet.',
              },
              {
                step: '02',
                icon: Brain,
                title: 'AI generates the course',
                description: 'The AI reads the graph and writes structured lessons explaining the WHY behind every architectural decision — grounded in real files.',
              },
              {
                step: '03',
                icon: GraduationCap,
                title: 'Learn interactively',
                description: 'Work through lessons at your pace. Earn XP, pass quizzes, level up, and ask the repo-scoped AI tutor anything.',
              },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 100} className="h-full">
                <div className="lift-card group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-sm">
                  {/* Large ghost step number in the background */}
                  <span className="pointer-events-none absolute right-5 top-4 select-none text-5xl font-bold text-foreground/[0.04]">
                    {item.step}
                  </span>
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl accent-gradient-bg shadow-lg shadow-indigo-500/20">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>

                  {/* Arrow between steps (not shown on last) */}
                  {i < 2 && (
                    <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 sm:block">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm">
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="border-t border-border bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-indigo-500">Features</span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Everything you need to{' '}
                <span className="text-accent-gradient">master a codebase</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                A complete learning platform built around real-world code — not made-up examples.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FolderTree,
                title: 'Adaptive learning paths',
                desc: 'Prerequisites are detected automatically — you never skip a concept you need.',
              },
              {
                icon: Code2,
                title: 'Real code, real context',
                desc: 'Every lesson references actual files from the repo. No hallucinated examples.',
              },
              {
                icon: Trophy,
                title: 'XP, levels & leaderboard',
                desc: 'Stay motivated with experience points, skill levels, streaks, and a live leaderboard.',
              },
              {
                icon: MessageSquare,
                title: 'Repo-scoped AI tutor',
                desc: 'Ask anything about the codebase. The tutor only answers about this repo — keeping it accurate.',
              },
              {
                icon: BookOpen,
                title: 'Learn-more on any concept',
                desc: 'Tap any concept chip to open a deep-dive modal: what it is, why it matters, real-world use.',
              },
              {
                icon: Gauge,
                title: 'Generated once, cached forever',
                desc: 'AI runs once per repo. Future learners get instant results — zero repeated GPU cost.',
              },
              {
                icon: Layers,
                title: 'Concept mastery tracking',
                desc: 'Profile shows every concept you\'ve Introduced, Practiced, or Mastered across all repos.',
              },
              {
                icon: Star,
                title: 'Vibe Coding Bar',
                desc: 'An animated bar that grows with your activity — quizzes, lessons, and consistency all count.',
              },
              {
                icon: Lock,
                title: 'Private by default',
                desc: 'Your imported repos are only visible to you — never shared with other users.',
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 90} className="h-full">
                <div className="lift-card h-full rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1.5 font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Why Gitpath ─────────────────────────────────────────────── */}
      <section id="principles" className="px-6 py-24">
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <span className="text-sm font-semibold uppercase tracking-wider text-indigo-500">
                Why Gitpath
              </span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Built to be accurate, fast, and honest
              </h2>
              <p className="mt-4 text-muted-foreground">
                We don&apos;t invent content. Every course is generated from a real
                repository&apos;s structure and source — then cached so it&apos;s instant
                for everyone after.
              </p>
              <div className="mt-7 space-y-4">
                {[
                  {
                    t: 'Grounded in real code',
                    d: 'Static analysis maps the repo before the AI writes a single word.',
                  },
                  {
                    t: 'AI runs once per repo',
                    d: 'Results are cached permanently — no repeated cost, no waiting in line.',
                  },
                  {
                    t: 'Scope-locked AI tutor',
                    d: 'The tutor only answers about the specific repo you\'re studying.',
                  },
                  {
                    t: 'Your repos stay private',
                    d: 'Imported repositories are only visible to you — not shared with other learners.',
                  },
                ].map((p) => (
                  <div key={p.t} className="flex gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </div>
                    <div>
                      <p className="font-medium">{p.t}</p>
                      <p className="text-sm text-muted-foreground">{p.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Pipeline visual */}
          <Reveal delay={120} y={36}>
            <div className="relative rounded-2xl border border-border bg-card p-8 shadow-xl shadow-slate-200/60 dark:shadow-black/30">
              <div className="space-y-4">
                {[
                  { icon: GitBranch, label: 'Clone & analyse', value: 'Imports, exports, routes, deps — no AI', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                  { icon: Brain, label: 'AI generation (once)', value: 'Structured lessons, quizzes, mindmaps', color: 'text-violet-500', bg: 'bg-violet-500/10' },
                  { icon: Zap, label: 'Cached delivery', value: 'Instant for every learner after the first', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                  { icon: Trophy, label: 'Gamified progress', value: 'XP, levels, streaks, concept mastery', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                ].map((row, i) => (
                  <div key={row.label}>
                    <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-4 shadow-sm">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${row.bg} ${row.color} flex-shrink-0`}>
                        <row.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{row.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{row.value}</p>
                      </div>
                    </div>
                    {/* Arrow connector between rows */}
                    {i < 3 && (
                      <div className="flex justify-center py-1">
                        <div className="h-4 w-px bg-border" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 7. Comparison Table ─────────────────────────────────────────────── */}
      <section id="compare" className="border-t border-border bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-indigo-500">Compare</span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Why not just read the docs?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Traditional learning methods leave gaps. Gitpath fills them.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80} y={20}>
            <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-card shadow-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-6 py-4 text-left font-semibold">Feature</th>
                    <th className="px-4 py-4 text-center font-semibold text-indigo-500">Gitpath</th>
                    <th className="px-4 py-4 text-center font-medium text-muted-foreground">Docs / README</th>
                    <th className="px-4 py-4 text-center font-medium text-muted-foreground">YouTube tutorials</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ['Grounded in actual repo code', true, false, false],
                    ['Interactive quizzes', true, false, false],
                    ['Concept mastery tracking', true, false, false],
                    ['AI tutor scoped to the repo', true, false, false],
                    ['Works for any public repo', true, false, false],
                    ['Free to use', true, true, true],
                    ['Always up to date', true, true, false],
                  ].map(([feature, g2c, docs, yt]) => (
                    <tr key={String(feature)} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3.5 font-medium">{String(feature)}</td>
                      {[g2c, docs, yt].map((val, i) => (
                        <td key={i} className="px-4 py-3.5 text-center">
                          {val ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500">
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 8. FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <div className="text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-indigo-500">FAQ</span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Common questions</h2>
            </div>
          </Reveal>

          <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            {[
              {
                q: 'Is this really free?',
                a: 'Yes. Signing up, importing repositories, and taking lessons are completely free. The AI generation cost is absorbed on our end — it runs once per repo and is cached forever, so the marginal cost per additional learner is zero.',
              },
              {
                q: 'Does it work with private repositories?',
                a: 'Private repo support is planned. Right now, Gitpath works with any public repository. You can import as many public repos as you like from your dashboard.',
              },
              {
                q: 'How long does it take to generate a course?',
                a: 'For a typical mid-size repo (10–50 files), generation takes 2–5 minutes. Small repos (like utility libraries) can be under 60 seconds. The result is then cached — everyone else gets it instantly.',
              },
              {
                q: 'What languages and frameworks are supported?',
                a: 'Any language or framework works — the static analysis is language-agnostic and reads file structure, imports, and exports. AI-generated lesson quality is highest for TypeScript/JavaScript, Python, Go, and Rust repos.',
              },
              {
                q: 'Is my data private?',
                a: 'Your imported repos are only visible to you — other users cannot see what you\'ve imported or your progress. We do not sell your data. See our Privacy Policy for full details.',
              },
              {
                q: 'Can I use my own AI API key?',
                a: 'Self-hosted instances can point AI_BASE_URL at any OpenAI-compatible endpoint — Ollama, vLLM, Vast.ai, or any cloud provider. The cloud version uses our key so you don\'t have to.',
              },
            ].map((item) => (
              <details key={item.q} className="group px-6 py-5 cursor-pointer">
                <summary className="flex items-center justify-between gap-4 font-medium list-none">
                  {item.q}
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Final CTA ────────────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <Reveal y={36}>
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl accent-gradient-bg px-8 py-20 text-center shadow-2xl shadow-indigo-500/30 sm:px-14">
            {/* Ambient glow */}
            <div className="glow-blob right-[-5%] top-[-30%] h-72 w-72 bg-white/20" />
            <div className="glow-blob left-[-5%] bottom-[-20%] h-56 w-56 bg-white/10" />

            <div className="relative z-10">
              {/* Stars / social proof */}
              <div className="mb-4 flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-white/80 text-white/80" />
                ))}
              </div>

              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Ready to learn from the best codebases?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-indigo-100">
                Import any public GitHub repo. Your first course is ready in minutes.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link href="/login">
                  <Button size="lg" className="h-12 border-0 bg-white px-8 text-base font-semibold text-indigo-700 shadow-lg transition-all hover:scale-[1.02] hover:bg-slate-50">
                    Get started free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/demo/lesson">
                  <Button size="lg" variant="outline" className="h-12 border-white/30 bg-white/10 px-6 text-base text-white backdrop-blur transition-all hover:bg-white/20">
                    See a demo lesson
                  </Button>
                </Link>
              </div>
              <p className="mt-5 text-sm text-indigo-200">
                Sign in with GitHub · No credit card · No setup
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── 10. Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md accent-gradient-bg">
                <Code2 className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-semibold">Gitpath</span>
            </div>

            {/* Footer nav columns */}
            <div className="flex flex-wrap gap-x-12 gap-y-6 text-sm text-muted-foreground">
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Product</p>
                <a href="#how" className="block hover:text-foreground transition-colors">How it works</a>
                <a href="#features" className="block hover:text-foreground transition-colors">Features</a>
                <Link href="/demo/lesson" className="block hover:text-foreground transition-colors">Demo</Link>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Legal</p>
                <Link href="/privacy" className="block hover:text-foreground transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="block hover:text-foreground transition-colors">Terms of Service</Link>
                <a href="mailto:legal@gitpath.app" className="block hover:text-foreground transition-colors">Legal enquiries</a>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Contact</p>
                <a href="mailto:hello@gitpath.app" className="block hover:text-foreground transition-colors">General</a>
                <a href="mailto:privacy@gitpath.app" className="block hover:text-foreground transition-colors">Privacy</a>
                <a href="mailto:abuse@gitpath.app" className="block hover:text-foreground transition-colors">DMCA / Abuse</a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-border pt-6 flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} Gitpath. Built for engineers, by engineers.</p>
            <p>
              By using this service you agree to our{' '}
              <Link href="/terms" className="underline hover:text-foreground transition-colors">Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="underline hover:text-foreground transition-colors">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
