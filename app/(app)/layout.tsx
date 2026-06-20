import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ImportProgressBanner } from '@/components/layout/ImportProgressBanner';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar user={session.user as { name?: string | null; email?: string | null; image?: string | null; id?: string }} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar user={session.user as { name?: string | null; email?: string | null; image?: string | null }} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
      <ImportProgressBanner />
    </div>
  );
}
