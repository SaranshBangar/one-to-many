# OneToMany

Turn one podcast/video into LinkedIn, Twitter/X, email, and YouTube Shorts content, in your founder voice, in ~2 minutes.

Built for indie B2B SaaS founders. **To bring it live, follow [`docs/SETUP.md`](docs/SETUP.md)**, step-by-step key generation + go-live checklist.

## Stack

- **Next.js 16** (App Router) + React 19 + Tailwind v4, single monolith, deploys to Vercel
- **Clerk** auth · **Firestore** db · **Gemini 2.0 Flash** generation · **Stripe** payments · local **Whisper** transcription

Every external service degrades to a built-in **mock** when its keys are absent, so the whole app runs with zero accounts.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional, runs fully mocked if left blank
npm run dev                  # http://localhost:3000
```

With an empty `.env.local` you get: a fake demo user (no login), an in-memory database, canned AI outputs, simulated Stripe checkout, and a sample transcript. Fill keys in `.env.local` to bring each service live independently.

## Going live, one service at a time

| Service       | Env vars                                                               | Mock fallback         |
| ------------- | ---------------------------------------------------------------------- | --------------------- |
| Auth          | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`                | demo user, no login   |
| Database      | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | in-memory store       |
| AI            | `GEMINI_API_KEY`                                                       | canned sample outputs |
| Payments      | `STRIPE_SECRET_KEY` (+ price ids, webhook secret)                      | simulated checkout    |
| Transcription | `WHISPER_BIN` (+ ffmpeg on PATH)                                       | canned transcript     |

Service health is visible at `/api/health` and in the dev banner.

## Scripts

- `npm run dev`, dev server
- `npm run build`, production build
- `npm run lint`, eslint
