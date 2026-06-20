# Gitpath

> Turn any GitHub repository into an interactive learning course.

**Gitpath** analyzes a repository's code structure, generates structured lessons using a self-hosted AI model, and delivers a Duolingo-style learning experience — with XP, quizzes, an AI tutor, and concept graphs.

---

## Architecture Overview

```
User imports GitHub URL
        ↓
Repository cloned (shallow, depth=1)
        ↓
Static analysis (ts-morph, file system)  ← NO AI
        ↓
RepositoryGraph stored in PostgreSQL
        ↓
AI generates course ONCE (Qwen Coder via Ollama/vLLM)
        ↓
Lessons stored permanently in DB
        ↓
All future users read from cache — AI never called again
```

### Key Principle: AI is called exactly once per repository, not on every request.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Supabase PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v5 + GitHub OAuth |
| Queue | BullMQ + Redis |
| Static Analysis | ts-morph, glob |
| AI | Qwen Coder 32B via Ollama/vLLM (self-hosted) |
| Deployment | AWS Lightsail, Docker, GitHub Actions |

---

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 9+
- PostgreSQL (or Supabase account)
- Redis
- Ollama with `qwen2.5-coder:32b` model

### 1. Clone & install

```bash
git clone https://github.com/yourorg/gitpath
cd gitpath
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 3. Set up database

```bash
pnpm db:generate   # generate Prisma client
pnpm db:migrate    # run migrations
pnpm db:seed       # seed badges & concepts
```

### 4. Start AI model (Ollama)

```bash
ollama pull qwen2.5-coder:32b
ollama serve
```

### 5. Start Redis

```bash
redis-server
# or: docker run -p 6379:6379 redis:7-alpine
```

### 6. Start workers (separate terminal)

```bash
pnpm worker:dev
```

### 7. Start the app

```bash
pnpm dev
```

Open http://localhost:3000

---

## Project Structure

```
gitpath/
├── app/                    # Next.js App Router
│   ├── api/               # REST API routes
│   ├── dashboard/         # Dashboard page
│   ├── learn/             # Course + Lesson pages
│   └── (auth)/            # Auth pages
├── components/             # React components
│   ├── course/            # Lesson viewer, flow diagrams
│   ├── dashboard/         # Import form, repo cards
│   ├── quiz/              # Quiz engine
│   ├── tutor/             # AI tutor chat
│   ├── layout/            # Sidebar, topbar
│   └── ui/               # shadcn/ui primitives
├── lib/
│   ├── ai/               # AI client, prompts, generator
│   ├── analyzer/         # Static analysis (no AI)
│   ├── db/              # Prisma client
│   ├── queue/           # BullMQ queues
│   ├── auth.ts          # NextAuth config
│   ├── types/           # TypeScript types
│   ├── utils/           # Utilities
│   └── validators/      # Zod schemas
├── workers/              # Background workers
│   ├── clone.worker.ts  # Git clone jobs
│   ├── analysis.worker.ts # Static analysis jobs
│   ├── course-generation.worker.ts # AI generation jobs
│   └── index.ts         # Worker entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed data
├── Dockerfile           # App container
├── Dockerfile.worker    # Worker container
└── docker-compose.yml  # Local development stack
```

---

## Database Schema

14 tables covering users, repositories, courses, lessons, quizzes, progress, concepts, gamification, and AI jobs. See [prisma/schema.prisma](prisma/schema.prisma).

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/repositories` | Import a GitHub repository |
| `GET` | `/api/repositories` | List repositories |
| `GET` | `/api/repositories/:id` | Get repository details + graph |
| `GET` | `/api/repositories/:id/status` | SSE status stream |
| `GET` | `/api/lessons/:id` | Get lesson content |
| `POST` | `/api/lessons/:id/complete` | Mark lesson done, award XP |
| `POST` | `/api/quiz/:id/attempt` | Submit quiz answer |
| `POST` | `/api/tutor` | AI tutor chat (SSE streaming) |
| `GET` | `/api/progress` | User dashboard data |

---

## Deployment (AWS Lightsail)

```bash
# Build and push Docker images (automated via GitHub Actions on push to main)
# SSH into Lightsail instance
ssh user@your-lightsail-ip

# On the server
cd /opt/gitpath
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

See [.github/workflows/ci.yml](.github/workflows/ci.yml) for the full CI/CD pipeline.

---

## Environment Variables

See [.env.example](.env.example) for all required variables.

---

## Production Checklist

- [ ] `AUTH_SECRET` set to a strong random value
- [ ] GitHub OAuth App created and credentials set
- [ ] Supabase project created, `DATABASE_URL` and `DIRECT_URL` configured
- [ ] Redis deployed (Upstash or self-hosted)
- [ ] AI model running on Vast.ai instance with `AI_BASE_URL` configured
- [ ] HTTPS configured on Lightsail (Caddy or nginx with Let's Encrypt)
- [ ] `CLONE_BASE_DIR` points to a disk with sufficient space
- [ ] Prisma migrations run: `prisma migrate deploy`
- [ ] Seed data populated: `pnpm db:seed`
- [ ] Worker process running separately from Next.js
- [ ] GitHub Actions secrets configured (`LIGHTSAIL_HOST`, `LIGHTSAIL_USER`, `LIGHTSAIL_SSH_KEY`)
