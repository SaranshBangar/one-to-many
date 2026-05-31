<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version (16.2) has breaking changes, APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices (e.g. `middleware.ts` is now `proxy.ts`).

<!-- END:nextjs-agent-rules -->

# OneToMany, agent notes

AI content repurposing for indie B2B SaaS founders. One source (podcast/video/transcript) → LinkedIn, Twitter/X, email, YouTube Shorts, in the founder's voice. Key-setup + go-live steps in `docs/SETUP.md`.

## Architecture

- Single Next.js 16 App Router monolith (UI + API route handlers + in-process jobs). No separate backend.
- **Mock-first**: every external service has a mock fallback selected in `src/lib/env.ts` (`mock.*`). With no keys the whole app runs. Keys in `.env.local` flip services live independently. Never assume a service is live, branch on `mock.<service>`.

## Key modules

- `src/lib/env.ts`, env + per-service `mock` flags. Source of truth for live/mock.
- `src/lib/session.ts`, `getSessionUser()` = auth identity + persisted `AppUser`. Use in pages/routes.
- `src/lib/db/`, `Db` interface; `mock.ts` (in-memory, seeded demo user `demo_user` + `sample01` project) and `firestore.ts`. Get via `getDb()`.
- `src/lib/ai/`, `prompts.ts` (the founder-voice prompts, the product's differentiator; edit carefully) + `gemini.ts` (`@google/genai`, model `gemini-2.0-flash`, mock canned outputs).
- `src/lib/transcription/`, whisper CLI + yt-dlp, passthrough for pasted transcript, mock transcript.
- `src/lib/jobs/processor.ts`, `runProject` (transcribe→summarize→generate, persists status each stage; client polls) + `regenerateOutput`.
- `src/lib/plans.ts` / `usage.ts`, tiers (Starter $19 / Pro $39 / Max $99), limits, monthly usage.

## Conventions

- Auth gate: authed pages live under `src/app/(app)/` (group layout redirects + `force-dynamic`).
- API routes validate with zod, check ownership (`project.userId === user.id`), return `{error}` JSON.
- UI: dark default + founder-orange accent, tokens in `globals.css`, primitives in `src/components/ui/`. Tailwind v4 (`@theme`).
- `lucide-react` brand icons (Youtube etc.) were removed, use generic icons.

## Verify

`npm run build` (turbopack + tsc) and `npm run lint` must pass. Smoke test mock flow: POST `/api/projects` with a transcript, poll GET `/api/projects/[id]` to `ready`. `/api/health` shows service modes.
