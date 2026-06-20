'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

let initialized = false;

/**
 * PostHog product analytics. Initializes only when NEXT_PUBLIC_POSTHOG_KEY is set,
 * so it's completely inert in local dev / until you add your key.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || initialized || typeof window === 'undefined') return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      person_profiles: 'identified_only',
    });
    initialized = true;
  }, []);

  return <>{children}</>;
}
