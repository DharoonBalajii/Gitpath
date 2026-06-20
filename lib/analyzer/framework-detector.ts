import * as fs from 'fs';
import * as path from 'path';

interface DetectionResult {
  frameworks: string[];
  packageManager: string | null;
}

export function detectFrameworks(clonePath: string): DetectionResult {
  const frameworks: string[] = [];
  let packageManager: string | null = null;

  // Detect package manager
  if (fs.existsSync(path.join(clonePath, 'pnpm-lock.yaml'))) packageManager = 'pnpm';
  else if (fs.existsSync(path.join(clonePath, 'yarn.lock'))) packageManager = 'yarn';
  else if (fs.existsSync(path.join(clonePath, 'package-lock.json'))) packageManager = 'npm';
  else if (fs.existsSync(path.join(clonePath, 'bun.lockb'))) packageManager = 'bun';

  const pkgPath = path.join(clonePath, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    // Check for non-Node projects
    if (fs.existsSync(path.join(clonePath, 'Cargo.toml'))) frameworks.push('Rust/Cargo');
    if (fs.existsSync(path.join(clonePath, 'go.mod'))) frameworks.push('Go');
    if (fs.existsSync(path.join(clonePath, 'requirements.txt'))) frameworks.push('Python');
    if (fs.existsSync(path.join(clonePath, 'Gemfile'))) frameworks.push('Ruby');
    return { frameworks, packageManager };
  }

  let pkg: Record<string, unknown> = {};
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
  } catch {
    return { frameworks, packageManager };
  }

  const deps: Record<string, string> = {
    ...((pkg['dependencies'] as Record<string, string>) ?? {}),
    ...((pkg['devDependencies'] as Record<string, string>) ?? {}),
    ...((pkg['peerDependencies'] as Record<string, string>) ?? {}),
  };

  const has = (name: string) => name in deps;

  if (has('next')) frameworks.push('Next.js');
  if (has('react')) frameworks.push('React');
  if (has('vue')) frameworks.push('Vue.js');
  if (has('@angular/core')) frameworks.push('Angular');
  if (has('svelte')) frameworks.push('@svelte');
  if (has('astro')) frameworks.push('Astro');
  if (has('remix')) frameworks.push('Remix');
  if (has('express')) frameworks.push('Express');
  if (has('fastify')) frameworks.push('Fastify');
  if (has('hono')) frameworks.push('Hono');
  if (has('tailwindcss')) frameworks.push('Tailwind CSS');
  if (has('@prisma/client') || has('prisma')) frameworks.push('Prisma');
  if (has('drizzle-orm')) frameworks.push('Drizzle ORM');
  if (has('next-auth') || has('@auth/core')) frameworks.push('NextAuth.js');
  if (has('@supabase/supabase-js')) frameworks.push('Supabase');
  if (has('stripe')) frameworks.push('Stripe');
  if (has('bullmq') || has('bull')) frameworks.push('BullMQ');
  if (has('ioredis') || has('redis')) frameworks.push('Redis');
  if (has('zod')) frameworks.push('Zod');
  if (has('graphql')) frameworks.push('GraphQL');
  if (has('@trpc/server')) frameworks.push('tRPC');
  if (has('socket.io')) frameworks.push('Socket.io');
  if (has('vitest')) frameworks.push('Vitest');
  if (has('jest')) frameworks.push('Jest');
  if (has('playwright')) frameworks.push('Playwright');
  if (has('cypress')) frameworks.push('Cypress');

  return { frameworks, packageManager };
}
