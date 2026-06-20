// Local development PostgreSQL — a real Postgres 18 server, no Docker/Homebrew needed.
// Powered by `embedded-postgres` (ships a native PG binary). Data persists in ./.pgdata.
//
//   node scripts/dev-db.mjs        → starts Postgres on localhost:5432 and stays running
//
// Leave this running in its own terminal while you use the app.

import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const databaseDir = join(__dirname, '..', '.pgdata');
const DB_NAME = 'gitpath';
const PORT = 5432;

const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'postgres',
  password: 'postgres',
  port: PORT,
  persistent: true,
});

async function main() {
  const initialised = existsSync(join(databaseDir, 'PG_VERSION'));
  if (!initialised) {
    console.log('[db] Initialising data directory…');
    await pg.initialise();
  }

  console.log('[db] Starting PostgreSQL on localhost:%d …', PORT);
  await pg.start();

  // Create the app database (ignore "already exists")
  try {
    await pg.createDatabase(DB_NAME);
    console.log('[db] Created database "%s"', DB_NAME);
  } catch (err) {
    if (String(err?.message ?? err).includes('already exists')) {
      console.log('[db] Database "%s" already exists', DB_NAME);
    } else {
      throw err;
    }
  }

  console.log('[db] READY  →  postgresql://postgres:postgres@localhost:%d/%s', PORT, DB_NAME);

  const shutdown = async (sig) => {
    console.log(`\n[db] ${sig} received, stopping PostgreSQL…`);
    try { await pg.stop(); } catch {}
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Keep the process alive
  await new Promise(() => {});
}

main().catch((err) => {
  console.error('[db] Failed to start:', err);
  process.exit(1);
});
