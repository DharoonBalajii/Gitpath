import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from './db/client';
import { encrypt } from './crypto/encryption';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          // Request repo read access for private repos (optional)
          scope: 'read:user user:email repo',
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // Attach GitHub username to session
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { githubUsername: true, xp: true, level: true, streak: true },
        });
        if (dbUser) {
          (session.user as typeof session.user & {
            githubUsername: string | null;
            xp: number;
            level: number;
            streak: number;
          }).githubUsername = dbUser.githubUsername;
          (session.user as typeof session.user & { xp: number }).xp = dbUser.xp;
          (session.user as typeof session.user & { level: number }).level = dbUser.level;
          (session.user as typeof session.user & { streak: number }).streak = dbUser.streak;
        }
      }
      return session;
    },
    async signIn({ account, profile }) {
      // Store GitHub username and OAuth token on first sign-in
      if (account?.provider === 'github' && profile) {
        const githubProfile = profile as { login?: string; id?: number };
        await db.user.updateMany({
          where: {
            accounts: {
              some: {
                provider: 'github',
                providerAccountId: String(githubProfile.id ?? ''),
              },
            },
          },
          data: {
            githubUsername: githubProfile.login,
            githubId: String(githubProfile.id ?? ''),
            githubToken: encrypt(account.access_token ?? null),
          },
        });
      }
      return true;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'database' },
});
