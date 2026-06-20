import { auth, signIn } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Code2, Github, Zap, Shield, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata = { title: 'Sign in' };

export default async function LoginPage() {
  let session = null;
  try {
    session = await auth();
  } catch {
    // DB unreachable — render login page as unauthenticated
  }
  if (session?.user) redirect('/dashboard');

  const githubConfigured = Boolean(process.env.GITHUB_CLIENT_ID);

  return (
    <div className="flex min-h-screen bg-background text-foreground antialiased">
      {/* Left panel — branding */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-muted/30 p-10 lg:flex lg:w-1/2">
        <div className="glow-blob animate-drift left-[-10%] top-[10%] h-80 w-80 bg-indigo-400/20" />
        <div className="glow-blob animate-drift-slow bottom-[5%] right-[0%] h-72 w-72 bg-fuchsia-400/15" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl accent-gradient-bg shadow-md shadow-indigo-500/20">
            <Code2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Gitpath</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Learn how real software is built —{' '}
            <span className="text-accent-gradient">not just how it works</span>
          </h2>
          <div className="mt-8 space-y-4">
            {[
              { icon: BookOpen, text: 'AI-generated lessons from actual code' },
              { icon: Zap, text: 'Zero AI cost on repeat visits — cached forever' },
              { icon: Shield, text: 'Scope-locked AI tutor — no hallucinations' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-muted-foreground">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-card text-indigo-500 shadow-sm">
                  <item.icon className="h-4 w-4" />
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-sm italic text-muted-foreground">
          &ldquo;The best way to learn a codebase is to build it from scratch.&rdquo;
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="relative flex flex-1 flex-col items-center justify-center p-8">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="mb-6 flex items-center justify-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl accent-gradient-bg">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold">Gitpath</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in with GitHub to start learning
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-xl shadow-slate-200/60 dark:shadow-black/30">
            {githubConfigured ? (
              <form action={async () => {
                'use server';
                await signIn('github', { redirectTo: '/dashboard' });
              }}>
                <Button
                  type="submit"
                  className="h-12 w-full bg-foreground font-medium text-background transition-colors hover:bg-foreground/90"
                >
                  <Github className="mr-2 h-5 w-5" />
                  Continue with GitHub
                </Button>
              </form>
            ) : (
              <>
                <Button
                  type="button"
                  disabled
                  className="h-12 w-full bg-foreground font-medium text-background opacity-50"
                >
                  <Github className="mr-2 h-5 w-5" />
                  Continue with GitHub
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  GitHub sign-in isn&apos;t configured for local dev. Use the option below.
                </p>
              </>
            )}

            {process.env.NODE_ENV !== 'production' && (
              <>
                <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  for local testing
                  <span className="h-px flex-1 bg-border" />
                </div>
                <a
                  href="/api/dev-login"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Code2 className="h-4 w-4" />
                  Continue as Dev User (no GitHub)
                </a>
              </>
            )}

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By signing in you agree to our{' '}
              <a href="#" className="underline underline-offset-4 hover:text-foreground">Terms</a>
              {' '}and{' '}
              <a href="#" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
