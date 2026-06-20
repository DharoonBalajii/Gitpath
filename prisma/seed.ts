// Seed script — populates default badges and concepts
// Run with: pnpm db:seed

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const BADGES = [
  { slug: 'first-lesson', name: 'First Step', description: 'Completed your first lesson', icon: '🎯', condition: { type: 'lessons', value: 1 } },
  { slug: 'ten-lessons', name: 'Momentum', description: 'Completed 10 lessons', icon: '🔥', condition: { type: 'lessons', value: 10 } },
  { slug: 'fifty-lessons', name: 'Dedicated', description: 'Completed 50 lessons', icon: '💪', condition: { type: 'lessons', value: 50 } },
  { slug: 'week-streak', name: 'Consistent', description: '7-day learning streak', icon: '📅', condition: { type: 'streak', value: 7 } },
  { slug: 'month-streak', name: 'Unstoppable', description: '30-day learning streak', icon: '🏆', condition: { type: 'streak', value: 30 } },
  { slug: 'first-repo', name: 'Explorer', description: 'Imported your first repository', icon: '🔍', condition: { type: 'repos', value: 1 } },
  { slug: 'five-repos', name: 'Polyglot', description: 'Imported 5 repositories', icon: '🌐', condition: { type: 'repos', value: 5 } },
  { slug: 'level-5', name: 'Rising Star', description: 'Reached level 5', icon: '⭐', xpThreshold: 2000 },
  { slug: 'level-10', name: 'Expert', description: 'Reached level 10', icon: '💎', xpThreshold: 4500 },
];

const CONCEPTS = [
  // React
  { slug: 'react-basics', name: 'React Basics', category: 'frontend', difficulty: 'BEGINNER' as const },
  { slug: 'react-hooks', name: 'React Hooks', category: 'frontend', difficulty: 'INTERMEDIATE' as const },
  { slug: 'react-context', name: 'React Context', category: 'frontend', difficulty: 'INTERMEDIATE' as const },
  { slug: 'react-server-components', name: 'React Server Components', category: 'frontend', difficulty: 'ADVANCED' as const },
  // Next.js
  { slug: 'nextjs-routing', name: 'Next.js App Router', category: 'frontend', difficulty: 'INTERMEDIATE' as const },
  { slug: 'nextjs-api-routes', name: 'Next.js API Routes', category: 'backend', difficulty: 'INTERMEDIATE' as const },
  { slug: 'nextjs-middleware', name: 'Next.js Middleware', category: 'backend', difficulty: 'ADVANCED' as const },
  { slug: 'server-actions', name: 'Server Actions', category: 'backend', difficulty: 'INTERMEDIATE' as const },
  // Backend
  { slug: 'rest-api', name: 'REST API Design', category: 'backend', difficulty: 'BEGINNER' as const },
  { slug: 'authentication', name: 'Authentication', category: 'backend', difficulty: 'INTERMEDIATE' as const },
  { slug: 'jwt-auth', name: 'JWT Authentication', category: 'backend', difficulty: 'INTERMEDIATE' as const },
  { slug: 'oauth', name: 'OAuth 2.0', category: 'backend', difficulty: 'INTERMEDIATE' as const },
  // Database
  { slug: 'database-basics', name: 'Database Basics', category: 'database', difficulty: 'BEGINNER' as const },
  { slug: 'prisma-orm', name: 'Prisma ORM', category: 'database', difficulty: 'INTERMEDIATE' as const },
  { slug: 'postgresql', name: 'PostgreSQL', category: 'database', difficulty: 'INTERMEDIATE' as const },
  { slug: 'database-schema', name: 'Database Schema Design', category: 'database', difficulty: 'INTERMEDIATE' as const },
  // Architecture
  { slug: 'monorepo', name: 'Monorepo Architecture', category: 'devops', difficulty: 'ADVANCED' as const },
  { slug: 'job-queues', name: 'Job Queues & Workers', category: 'backend', difficulty: 'ADVANCED' as const },
  { slug: 'caching', name: 'Caching Strategies', category: 'backend', difficulty: 'INTERMEDIATE' as const },
  { slug: 'middleware', name: 'Middleware Patterns', category: 'backend', difficulty: 'INTERMEDIATE' as const },
  // TypeScript
  { slug: 'typescript', name: 'TypeScript', category: 'language', difficulty: 'INTERMEDIATE' as const },
  { slug: 'zod-validation', name: 'Zod Validation', category: 'backend', difficulty: 'INTERMEDIATE' as const },
  // DevOps
  { slug: 'docker', name: 'Docker', category: 'devops', difficulty: 'INTERMEDIATE' as const },
  { slug: 'ci-cd', name: 'CI/CD Pipelines', category: 'devops', difficulty: 'INTERMEDIATE' as const },
  { slug: 'deployment', name: 'Deployment', category: 'devops', difficulty: 'BEGINNER' as const },
];

async function main() {
  console.log('Seeding badges...');
  for (const badge of BADGES) {
    await db.badge.upsert({
      where: { slug: badge.slug },
      create: badge,
      update: badge,
    });
  }

  console.log('Seeding concepts...');
  for (const concept of CONCEPTS) {
    await db.concept.upsert({
      where: { slug: concept.slug },
      create: {
        ...concept,
        description: `Learn ${concept.name}`,
        prerequisites: [],
      },
      update: {},
    });
  }

  console.log('Seed complete.');
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
