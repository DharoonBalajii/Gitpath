import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Analytics } from '@/components/Analytics';
import { PostHogProvider } from '@/components/PostHogProvider';
import { ClerkProvider } from '@clerk/nextjs';

// Clerk only activates when both keys are present; otherwise the app runs on
// the existing NextAuth + dev-login auth untouched.
const clerkEnabled =
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) && Boolean(process.env.CLERK_SECRET_KEY);

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'Gitpath', template: '%s | Gitpath' },
  description: 'Turn any GitHub repository into an interactive learning course. Learn by doing, not reading.',
  keywords: ['learn to code', 'github', 'course', 'programming', 'interactive'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Gitpath',
    description: 'Turn any GitHub repository into an interactive learning course.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const tree = (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <PostHogProvider>{children}</PostHogProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );

  return clerkEnabled ? <ClerkProvider>{tree}</ClerkProvider> : tree;
}
