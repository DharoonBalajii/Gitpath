// Structured logging that ships to Better Stack (Logtail) when configured,
// and always mirrors to the console. Non-blocking and inert without a token.
//
// Set BETTER_STACK_SOURCE_TOKEN (and optionally BETTER_STACK_INGEST_URL) to enable.

type Level = 'info' | 'warn' | 'error' | 'debug';

const TOKEN = process.env.BETTER_STACK_SOURCE_TOKEN;
const INGEST_URL = process.env.BETTER_STACK_INGEST_URL ?? 'https://in.logs.betterstack.com';

function ship(level: Level, message: string, meta?: Record<string, unknown>) {
  if (!TOKEN) return;
  // Fire-and-forget — never block or throw on a logging failure.
  void fetch(INGEST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ dt: new Date().toISOString(), level, message, ...meta }),
  }).catch(() => {});
}

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  const line = meta ? `${message} ${JSON.stringify(meta)}` : message;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
  ship(level, message, meta);
}

export const logger = {
  debug: (m: string, meta?: Record<string, unknown>) => log('debug', m, meta),
  info: (m: string, meta?: Record<string, unknown>) => log('info', m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => log('warn', m, meta),
  error: (m: string, meta?: Record<string, unknown>) => log('error', m, meta),
};
