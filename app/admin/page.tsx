/**
 * app/admin/page.tsx
 *
 * Redirects /admin → /admin/login so that visiting the admin root
 * takes the user to the login page rather than showing a 404.
 */

import { redirect } from 'next/navigation';

export default function AdminRootPage() {
  redirect('/admin/login');
}
