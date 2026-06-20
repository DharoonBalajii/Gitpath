/**
 * app/admin/layout.tsx
 *
 * Shared layout for all /admin/* routes.
 * Minimal design — no app sidebar, no user-facing navigation.
 * Just a clean container so the login and dashboard pages share a consistent wrapper.
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin — Gitpath',
  // Prevent search engines from indexing admin pages
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // Full-height column, dark muted background to differentiate from main app
    <div className="min-h-screen bg-muted/40 text-foreground antialiased">
      {children}
    </div>
  );
}
