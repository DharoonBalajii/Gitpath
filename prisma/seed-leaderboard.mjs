// Seed 10 fake leaderboard users so new real users immediately see competition.
// Run with: node prisma/seed-leaderboard.mjs
// Safe to re-run — checks for existing fake users first.

import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

const FAKE_USERS = [
  { name: 'Alex Morgan',    email: 'fake1@leaderboard.internal', xp: 120,  level: 2 },
  { name: 'Sam Rivera',    email: 'fake2@leaderboard.internal', xp: 95,   level: 1 },
  { name: 'Jordan Lee',    email: 'fake3@leaderboard.internal', xp: 78,   level: 1 },
  { name: 'Casey Chen',    email: 'fake4@leaderboard.internal', xp: 55,   level: 1 },
  { name: 'Taylor Kim',    email: 'fake5@leaderboard.internal', xp: 30,   level: 1 },
  { name: 'Riley Patel',   email: 'fake6@leaderboard.internal', xp: 290,  level: 3 },
  { name: 'Drew Nakamura', email: 'fake7@leaderboard.internal', xp: 210,  level: 3 },
  { name: 'Morgan Osei',   email: 'fake8@leaderboard.internal', xp: 175,  level: 2 },
  { name: 'Quinn Torres',  email: 'fake9@leaderboard.internal', xp: 155,  level: 2 },
  { name: 'Avery Johansson', email: 'fake10@leaderboard.internal', xp: 140, level: 2 },
];

async function main() {
  let created = 0;
  for (const u of FAKE_USERS) {
    const existing = await db.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      await db.user.create({ data: { ...u, isFakeUser: true } });
      created++;
    }
  }
  console.log(`Seeded ${created} fake leaderboard users (${FAKE_USERS.length - created} already existed).`);
}

main().finally(() => db.$disconnect());
