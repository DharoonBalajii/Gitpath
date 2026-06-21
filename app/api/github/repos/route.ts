// GET /api/github/repos — lists the authenticated user's GitHub repositories.
// Uses the server-side GITHUB_TOKEN (a Personal Access Token in .env.local).
// The token is never sent to the browser — only the repo list is.

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import type { APIResponse } from '@/lib/types/index';

export const dynamic = 'force-dynamic';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; avatar_url: string };
  description: string | null;
  language: string | null;
  stargazers_count: number;
  private: boolean;
  fork: boolean;
  html_url: string;
  updated_at: string;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<APIResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'No GitHub token configured. Add GITHUB_TOKEN to .env.local to list your repositories, or paste a repo URL instead.',
        code: 'NO_GITHUB_TOKEN',
      },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member',
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
        cache: 'no-store',
      },
    );

    if (!res.ok) {
      const detail = res.status === 401 ? 'Invalid or expired GitHub token.' : `GitHub API error (${res.status}).`;
      return NextResponse.json<APIResponse>({ success: false, error: detail, code: 'GITHUB_API_ERROR' }, { status: 502 });
    }

    const repos = (await res.json()) as GitHubRepo[];
    const items = repos.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      owner: r.owner.login,
      ownerAvatar: r.owner.avatar_url,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      isPrivate: r.private,
      isFork: r.fork,
      url: r.html_url,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json<APIResponse>({ success: true, data: { items } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to reach GitHub';
    return NextResponse.json<APIResponse>({ success: false, error: message, code: 'GITHUB_FETCH_FAILED' }, { status: 502 });
  }
}
