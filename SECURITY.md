# Security Policy

## Reporting a vulnerability

Please report security issues privately — do **not** open a public issue.
Use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
(Security tab → "Report a vulnerability"), or email the maintainer.

We aim to acknowledge reports within 72 hours.

## Automated checks

- **CodeQL** static analysis runs on every push/PR and weekly (`.github/workflows/security.yml`).
- **Dependency audit** (`pnpm audit --audit-level=high`) fails CI on high/critical advisories.

## Hardening in this app

- Security headers set in `next.config.mjs` (`X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`; plus `X-Frame-Options` + HSTS in production).
- Secrets live only in `.env.local` (gitignored) and are never sent to the browser.
- Sensitive DB fields (e.g. GitHub OAuth tokens) are encrypted at rest via
  AES-256-GCM (`lib/crypto/encryption.ts`).
- Optional Cloudflare Turnstile bot-protection on the repository import endpoint.
- Rate limiting on import and tutor endpoints.
