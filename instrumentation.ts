import * as Sentry from '@sentry/nextjs';

// Loads the Sentry server/edge SDK only when a DSN is configured.
export async function register() {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  if (process.env.NEXT_RUNTIME === 'nodejs') await import('./sentry.server.config');
  if (process.env.NEXT_RUNTIME === 'edge') await import('./sentry.edge.config');
}

// Captures errors thrown in nested React Server Components (no-op until init runs).
export const onRequestError = Sentry.captureRequestError;
