// AI Client — wraps any OpenAI-compatible chat endpoint (Gemini today; self-hosted
// Qwen Coder on a GPU later). AI is ONLY called during lesson generation, never on a
// user page request. Provider is chosen entirely by env vars — no code changes needed.
//
// ─────────────────────────────────────────────────────────────────────────────
//  HOW TO SWITCH FROM GEMINI TO A SELF-HOSTED QWEN CODER ON VAST.AI
//  (step-by-step — a junior dev can follow this top to bottom)
// ─────────────────────────────────────────────────────────────────────────────
//
//  Right now the app talks to Google Gemini via its OpenAI-compatible endpoint:
//      AI_BASE_URL = https://generativelanguage.googleapis.com/v1beta/openai/
//      AI_MODEL    = gemini-2.5-flash
//      AI_API_KEY  = <your Gemini key>
//
//  To run your OWN model on a rented GPU instead, do this:
//
//  1. CREATE A VAST.AI ACCOUNT + ADD CREDIT
//     - Go to https://vast.ai , sign up, add a few dollars of credit.
//     - Console → "Account" → copy your API Key (used by the vastai CLI, optional).
//
//  2. RENT A GPU INSTANCE
//     - Console → "Search". Filter for a GPU with enough VRAM for the model:
//         * qwen2.5-coder:7b   → ~8 GB  VRAM  (1x RTX 3090/4090 is plenty)
//         * qwen2.5-coder:32b  → ~24 GB VRAM (1x RTX 4090/A6000, or 2x 3090)
//     - Pick a template that has CUDA + Docker (e.g. "Ollama" or "vLLM" template),
//       or a plain "PyTorch/CUDA" image and install the runtime yourself.
//     - Click RENT. Wait until the instance status is "running".
//
//  3a. EASIEST RUNTIME — OLLAMA (good for dev / smaller models)
//     - SSH into the instance (Console → the instance → "Open SSH"), then run:
//           curl -fsSL https://ollama.com/install.sh | sh
//           OLLAMA_HOST=0.0.0.0:11434 ollama serve &     # listen on all interfaces
//           ollama pull qwen2.5-coder:7b                  # downloads the model
//     - Ollama exposes an OpenAI-compatible API at:  http://<INSTANCE_IP>:11434/v1
//
//  3b. PRODUCTION RUNTIME — vLLM (higher throughput, batched)
//           pip install vllm
//           python -m vllm.entrypoints.openai.api_server \
//               --model Qwen/Qwen2.5-Coder-7B-Instruct \
//               --host 0.0.0.0 --port 8000 --api-key MY_SECRET
//     - vLLM exposes an OpenAI-compatible API at:  http://<INSTANCE_IP>:8000/v1
//
//  4. OPEN THE PORT
//     - On the Vast.ai instance card, map/expose the port (11434 for Ollama,
//       8000 for vLLM). Vast shows the public "IP:PORT" to use from outside.
//
//  5. POINT THIS APP AT IT — edit .env.local, then restart the server:
//           AI_BASE_URL = "http://<INSTANCE_IP>:<PORT>/v1"
//           AI_MODEL    = "qwen2.5-coder:7b"        # the exact name you pulled/served
//           AI_API_KEY  = "ollama"                  # any non-empty string for Ollama,
//                                                   # or the --api-key you set for vLLM
//     - No code changes. createAIClient() below reads these env vars.
//
//  6. (COST SAVING) STOP THE GPU WHEN IDLE
//     - Generation is one-shot per repo, so you don't need the GPU running 24/7.
//     - Stop the instance in the Vast.ai console (or `vastai stop instance <id>`)
//       after a batch of imports finishes. Start it again before the next batch.
//     - See workers/course-generation.worker.ts for where generation is triggered —
//       a wake/sleep hook can be added there to start/stop the instance automatically.
//
//  TEST IT QUICKLY (from your laptop) once the model is serving:
//      curl http://<INSTANCE_IP>:<PORT>/v1/chat/completions \
//        -H "Content-Type: application/json" \
//        -d '{"model":"qwen2.5-coder:7b","messages":[{"role":"user","content":"hi"}]}'
// ─────────────────────────────────────────────────────────────────────────────

import OpenAI from 'openai';

// ─── Token budgets ────────────────────────────────────────────────────────────
// Kept generous: "thinking" models (gemini-2.5-flash) spend part of the output
// budget on reasoning tokens — too small a limit truncates the JSON mid-string.
export const MAX_TOKENS = {
  COURSE_OUTLINE: 32768,
  LESSON_CONTENT: 16384,
  QUIZ_BATCH: 8192,
} as const;

// ─── Legacy single-client factory ─────────────────────────────────────────────
// Kept for backward compatibility with any code that still calls createAIClient().
// New code should use callAI() from key-rotator instead.
export function createAIClient(): OpenAI {
  return new OpenAI({
    baseURL: process.env.AI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta/openai/',
    apiKey: process.env.AI_API_KEY ?? process.env.AI_API_KEY_1 ?? 'missing-key',
    timeout: 5 * 60 * 1000,
    maxRetries: 2,
  });
}

// Legacy model name export (used by any files that haven't migrated to callAI yet)
export const AI_MODEL = process.env.AI_MODEL ?? 'gemini-2.5-flash';

// ─── Key-rotating AI call (use this everywhere new) ───────────────────────────
// Re-exported here so callers only need one import: '@/lib/ai/client'
export { callAI, getKeyRotatorStatus } from './key-rotator';
