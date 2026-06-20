/**
 * lib/ai/key-rotator.ts
 *
 * Automatic API-key rotation for AI providers.
 *
 * How it works:
 *   1. Reads up to 6 Gemini keys from AI_API_KEY_1 … AI_API_KEY_6.
 *   2. Uses them in order (key 1 first, key 6 last).
 *   3. When a key hits its daily quota (HTTP 429 / RESOURCE_EXHAUSTED),
 *      it is marked exhausted until midnight UTC and the SAME request is
 *      retried immediately with the next key — no error surfaces to the user,
 *      no content is lost. Generation picks up right where it was.
 *   4. After all Gemini keys are exhausted, falls back to OpenRouter
 *      (OPENROUTER_API_KEY) which is paid and has no daily cap.
 *   5. State is stored on globalThis so it survives Next.js HMR reloads.
 *
 * Env vars required:
 *   AI_API_KEY_1  … AI_API_KEY_6   — Google AI Studio keys (1M tokens/day each)
 *   OPENROUTER_API_KEY             — OpenRouter key (backup, paid per token)
 *   OPENROUTER_MODEL               — Model on OpenRouter (default: google/gemini-2.5-flash)
 *   AI_MODEL                       — Gemini model name (default: gemini-2.5-flash)
 *
 * Legacy single-key mode (AI_API_KEY) still works if the numbered keys are absent.
 */

import OpenAI from 'openai';
import { MAX_TOKENS } from './client';

// ─── Provider config shape ────────────────────────────────────────────────────
export interface ProviderConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  label: string;       // human-readable name used in log messages
  isBackup: boolean;   // true = paid backup; skip daily-quota exhaustion logic
}

// ─── Rotator state (persisted on globalThis to survive HMR) ──────────────────
interface RotatorState {
  pool: ProviderConfig[];         // ordered list of providers to try
  currentIdx: number;             // index of the currently active provider
  exhaustedUntil: Record<number, number>; // map of pool-index → unix-ms reset time
  poolBuiltAt: number;            // timestamp when pool was last built from env vars
}

const g = globalThis as unknown as { __aiKeyRotator?: RotatorState };

// ─── Pool builder ─────────────────────────────────────────────────────────────
/**
 * Reads env vars and assembles the ordered provider pool:
 *   [Gemini #1, Gemini #2, …, Gemini #5, DeepSeek V3]
 */
function buildPool(): ProviderConfig[] {
  const pool: ProviderConfig[] = [];

  // Numbered Gemini keys (AI_API_KEY_1 … AI_API_KEY_6)
  // Each Google AI Studio key gives 1M free tokens/day (6M total across all 6 accounts)
  for (let i = 1; i <= 6; i++) {
    const key = process.env[`AI_API_KEY_${i}`]?.trim();
    if (key) {
      pool.push({
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        apiKey: key,
        model: process.env.AI_MODEL ?? 'gemini-2.5-flash',
        label: `Gemini #${i}`,
        isBackup: false,
      });
    }
  }

  // Legacy single-key fallback (AI_API_KEY) — used when numbered keys aren't set
  if (pool.length === 0) {
    const legacyKey = process.env.AI_API_KEY?.trim();
    if (legacyKey) {
      pool.push({
        baseURL: process.env.AI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta/openai/',
        apiKey: legacyKey,
        model: process.env.AI_MODEL ?? 'gemini-2.5-flash',
        label: 'Gemini (legacy single key)',
        isBackup: false,
      });
    }
  }

  // OpenRouter backup — paid, no daily quota cap, wide model selection
  // Kicks in only after all Gemini keys are exhausted for the day
  const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openrouterKey) {
    pool.push({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: openrouterKey,
      // Default to Gemini Flash on OpenRouter so prompts behave identically
      // Override with OPENROUTER_MODEL= if you want a different model
      model: process.env.OPENROUTER_MODEL ?? 'google/gemini-2.5-flash',
      label: 'OpenRouter (backup)',
      isBackup: true,
    });
  }

  // DeepSeek V3 — optional second backup if both Gemini and OpenRouter are exhausted
  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (deepseekKey) {
    pool.push({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: deepseekKey,
      model: 'deepseek-chat',
      label: 'DeepSeek V3 (backup)',
      isBackup: true,
    });
  }

  if (pool.length === 0) {
    console.warn('[key-rotator] No AI API keys configured — add AI_API_KEY_1 … AI_API_KEY_6 to .env.local');
  }

  return pool;
}

// ─── State accessor ───────────────────────────────────────────────────────────
function getState(): RotatorState {
  if (!g.__aiKeyRotator) {
    g.__aiKeyRotator = {
      pool: buildPool(),
      currentIdx: 0,
      exhaustedUntil: {},
      poolBuiltAt: Date.now(),
    };
    console.log(
      `[key-rotator] Initialised with ${g.__aiKeyRotator.pool.length} provider(s): ` +
      g.__aiKeyRotator.pool.map((p) => p.label).join(', ')
    );
  }
  return g.__aiKeyRotator;
}

// ─── Active provider selection ────────────────────────────────────────────────
/**
 * Returns the next non-exhausted provider in the pool, starting from
 * state.currentIdx and wrapping around. Returns null if all are exhausted.
 */
function pickActiveProvider(state: RotatorState): ProviderConfig | null {
  const now = Date.now();
  const n = state.pool.length;

  for (let offset = 0; offset < n; offset++) {
    const idx = (state.currentIdx + offset) % n;
    const exhaustedUntil = state.exhaustedUntil[idx] ?? 0;
    if (now >= exhaustedUntil) {
      // Found a live key — update currentIdx to point at it
      state.currentIdx = idx;
      return state.pool[idx] ?? null;
    }
  }
  return null; // every key is currently exhausted
}

// ─── Retryable-error detection ───────────────────────────────────────────────
/**
 * Returns true if the error should trigger a key rotation (try the next key).
 * Covers quota/rate-limit rejections and transient 400 gateway errors with no body.
 */
function isRetryableError(err: unknown): boolean {
  const str = String(err).toLowerCase();
  const httpStatus = err instanceof Error && 'status' in err
    ? (err as { status: number }).status
    : null;
  return (
    str.includes('429') ||
    str.includes('quota') ||
    str.includes('rate limit') ||
    str.includes('rate_limit') ||
    str.includes('resource_exhausted') ||
    str.includes('too many requests') ||
    str.includes('exhausted') ||
    httpStatus === 429 ||
    // 400 with no body is a transient gateway rejection — try the next key
    (httpStatus === 400 && str.includes('no body'))
  );
}

// ─── Exhaust-and-rotate ───────────────────────────────────────────────────────
/**
 * Marks the provider at `idx` as exhausted and advances currentIdx.
 * Gemini keys are marked until midnight UTC (their daily reset time).
 * DeepSeek (isBackup) is backed off for 60 seconds (rate-limit, not daily cap).
 */
function exhaustProvider(state: RotatorState, idx: number): void {
  const config = state.pool[idx];
  if (!config) return; // safety guard for out-of-bounds index

  if (config.isBackup) {
    // Rate-limited paid provider — back off for 60 seconds then retry
    state.exhaustedUntil[idx] = Date.now() + 60_000;
    console.warn(`[key-rotator] ${config.label} rate-limited — backing off 60 s`);
  } else {
    // Gemini free tier — exhausted until midnight UTC (daily quota window)
    const midnight = new Date();
    midnight.setUTCHours(24, 0, 0, 0);
    state.exhaustedUntil[idx] = midnight.getTime();
    const remaining = state.pool.filter((_, i) => {
      const ex = state.exhaustedUntil[i] ?? 0;
      return Date.now() >= ex;
    }).length;
    console.warn(
      `[key-rotator] ${config.label} daily quota hit — exhausted until ${midnight.toISOString()} UTC. ` +
      `${remaining - 1} provider(s) remaining today.`
    );
  }

  // Advance to next slot in the pool
  state.currentIdx = (idx + 1) % state.pool.length;
}

// ─── Public: callAI ───────────────────────────────────────────────────────────
/**
 * callAI — the single entry point for all AI completion requests.
 *
 * Drop-in replacement for `ai.chat.completions.create(...)`.
 * Automatically rotates through the key pool on quota errors.
 *
 * Usage in generator.ts:
 *   const rawJSON = await callAI(messages, { maxTokens: MAX_TOKENS.COURSE_OUTLINE });
 */
export async function callAI(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options: {
    maxTokens?: number;
    temperature?: number;
    jsonMode?: boolean; // pass false if the model doesn't support json_object format
  } = {},
): Promise<string> {
  const state = getState();
  const { maxTokens = MAX_TOKENS.LESSON_CONTENT, temperature = 0.3, jsonMode = true } = options;

  // Attempt every provider in the pool before giving up
  for (let attempt = 0; attempt < state.pool.length; attempt++) {
    const provider = pickActiveProvider(state);

    if (!provider) {
      // All keys exhausted — give a helpful error message
      const geminiKeys = state.pool.filter((p) => !p.isBackup);
      const nextReset = Math.min(
        ...geminiKeys.map((_, i) => state.exhaustedUntil[i] ?? 0).filter(Boolean)
      );
      const resetIn = nextReset
        ? `Next Gemini key resets in ${Math.ceil((nextReset - Date.now()) / 60_000)} min.`
        : '';
      throw new Error(
        `[AI] All ${state.pool.length} provider(s) are exhausted or unavailable. ` +
        resetIn
      );
    }

    const savedIdx = state.currentIdx; // remember which index we're trying
    console.log(`[AI] callAI — using ${provider.label} (attempt ${attempt + 1}/${state.pool.length})`);

    // Build a fresh OpenAI client for this provider
    const client = new OpenAI({
      baseURL: provider.baseURL,
      apiKey: provider.apiKey,
      timeout: 5 * 60 * 1000,  // 5 minutes (long-running generation)
      maxRetries: 0,            // we handle retry logic ourselves via rotation
    });

    try {
      const completion = await client.chat.completions.create({
        model: provider.model,
        messages,
        max_tokens: maxTokens,
        temperature,
        // json_object mode ensures the model outputs valid JSON
        // (supported by Gemini, DeepSeek, and most modern models)
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      });

      const content = completion.choices[0]?.message?.content ?? '';

      // Log token usage so you can track consumption per key
      const usage = completion.usage;
      if (usage) {
        console.log(
          `[AI] ${provider.label} usage — prompt: ${usage.prompt_tokens}, ` +
          `completion: ${usage.completion_tokens}, total: ${usage.total_tokens}`
        );
      }

      return content;
    } catch (err) {
      if (isRetryableError(err)) {
        // Quota hit — exhaust this key and loop to try the next one
        exhaustProvider(state, savedIdx);
        continue;
      }
      // Non-quota error (bad prompt, network issue, etc.) — propagate immediately
      throw err;
    }
  }

  throw new Error('[AI] All providers failed — see logs for details');
}

// ─── Public: status ───────────────────────────────────────────────────────────
/**
 * Returns a snapshot of the current rotation state for debugging / admin UI.
 * Safe to call at any time.
 */
export function getKeyRotatorStatus(): Array<{
  label: string;
  model: string;
  isActive: boolean;
  isExhausted: boolean;
  resetsAt: string | null;
}> {
  const state = getState();
  const now = Date.now();
  return state.pool.map((p, idx) => {
    const exhaustedUntil = state.exhaustedUntil[idx] ?? 0;
    const isExhausted = now < exhaustedUntil;
    return {
      label: p.label,
      model: p.model,
      isActive: idx === state.currentIdx && !isExhausted,
      isExhausted,
      resetsAt: isExhausted ? new Date(exhaustedUntil).toISOString() : null,
    };
  });
}
