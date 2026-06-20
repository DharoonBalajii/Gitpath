# Integrations

Every integration below is **off by default** and turns on the moment you add its
key(s) to `.env.local` (or your host's env). No code changes needed.

| Service | Enable by setting | What it does |
|---|---|---|
| **Clerk** | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` | Hosted auth — sign in with Google/GitHub/email |
| **Google Analytics** | `NEXT_PUBLIC_GA_ID` | GA4 page/event tracking |
| **Better Stack** | `BETTER_STACK_SOURCE_TOKEN` | Ships logs; `/api/health` for uptime monitoring |
| **Cloudflare Turnstile** | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | Bot protection on repo import |
| **PostHog** | `NEXT_PUBLIC_POSTHOG_KEY` | Product analytics (autocapture, pageviews) |
| **Sentry** | `NEXT_PUBLIC_SENTRY_DSN` | Error & performance monitoring |

## Clerk (hosted auth)

1. Create an app at https://dashboard.clerk.com, enable Google + GitHub.
2. Copy the **Publishable key** and **Secret key** into `.env.local`.
3. Restart the dev server. A "Sign in with Clerk" option appears on `/login`.

> **Current state:** Clerk is wired (provider, middleware, sign-in UI) and gated.
> The local **dev-login** stays available either way. The final step to make Clerk
> *the* app session (syncing the Clerk user into the app's user/session record) is
> done once your keys are in — ping me and I'll finish that bridge, since it can't
> be tested without a live Clerk instance.

## Google Analytics

Set `NEXT_PUBLIC_GA_ID=G-XXXXXXX` (from https://analytics.google.com). The GA4
script loads on every page automatically.

## Better Stack (logs + uptime)

1. Create a **Source** (telemetry.betterstack.com) → copy its **Source token** into
   `BETTER_STACK_SOURCE_TOKEN`. Use `lib/logger.ts` (`logger.info/warn/error`) to log.
2. **Uptime:** point a Better Stack monitor at `https://<your-domain>/api/health`
   (returns 200 when app + DB are healthy, 503 otherwise).

## Cloudflare

- **Turnstile** (in-app): create a widget at dash.cloudflare.com → Turnstile, set the
  site + secret keys. The widget then appears on the import form and is verified
  server-side.
- **CDN / DNS / WAF** (in front of the VPS): add your domain to Cloudflare, point DNS
  at the Lightsail IP (proxied/orange-cloud), and enable the WAF managed ruleset.
  Set SSL/TLS mode to **Full (strict)**.
- **Cloudflare Tunnel** (optional): run `cloudflared tunnel` on the VPS to expose the
  app without opening inbound ports or managing TLS yourself.

## PostHog (product analytics)

Set `NEXT_PUBLIC_POSTHOG_KEY` (Project API key from app.posthog.com), and optionally
`NEXT_PUBLIC_POSTHOG_HOST` (defaults to `https://us.i.posthog.com`; use the EU host if
your project is in the EU). Pageviews + autocapture start automatically.

## Sentry (error monitoring)

Set `NEXT_PUBLIC_SENTRY_DSN` (Project → Settings → Client Keys). Client, server, and
edge errors are then captured automatically. For source maps on production builds, also
set `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN`. When the DSN is unset,
Sentry is completely skipped (including the build plugin).

## Security audits

- CodeQL + `pnpm audit` run in `.github/workflows/security.yml`.
- See `SECURITY.md` for the disclosure policy and hardening summary.
