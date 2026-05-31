# OneToMany — Setup & Go-Live Checklist

Everything you need to take the app from "runs fully mocked" to "live in production."

The app is **mock-first**: with an empty `.env.local` it runs end-to-end (fake user, in-memory DB, canned AI, simulated checkout, sample transcript). You bring services live **one at a time** by dropping real keys into `.env.local`. Nothing breaks while a service is still mocked.

Check what's live vs mocked at any time:

```bash
curl http://localhost:3000/api/health
# {"ok":true,"services":{"auth":"mock","db":"mock","ai":"mock","payments":"mock","transcription":"mock"}}
```

> `MOCK_MODE=1` in `.env.local` forces **everything** to mock regardless of keys — handy for demos.

---

## 0. Prerequisites

- **Node 20+** (you have v24) and npm.
- A code editor + terminal.
- Accounts you'll create below: Clerk, Google (Firebase + Gemini), Stripe.

```bash
npm install
cp .env.example .env.local   # then fill sections below
npm run dev                  # http://localhost:3000
```

`.env.local` is git-ignored. **Never commit real keys.**

---

## 1. Auth — Clerk

Gives you real sign-up / sign-in / Google login. Until configured, the app uses a fake "demo" founder and skips login.

**Env vars**

| Var | Where |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API keys |
| `CLERK_SECRET_KEY` | Clerk dashboard → API keys |

**Steps**

1. Create an account at <https://dashboard.clerk.com> → **Create application**.
2. Name it "OneToMany". Enable the sign-in methods you want (**Email** + **Google** recommended).
3. Open **API keys** → copy the **Publishable key** and **Secret key**.
4. Paste into `.env.local`:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
   CLERK_SECRET_KEY=sk_test_xxx
   ```
5. In Clerk → **Paths / URLs**, set (these match the app's routes):
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in / sign-up: `/dashboard`
6. Restart `npm run dev`. `/api/health` should show `"auth":"live"`. Visiting `/sign-in` now shows the real Clerk widget.

**Notes**

- Auth middleware lives in `src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`). It auto-disables when Clerk keys are absent.
- The first real user you create becomes a `starter`-plan user automatically (see Stripe to upgrade).

---

## 2. Database — Firebase / Firestore

Persists users + projects. Until configured, data lives in memory and resets on restart (with one seeded demo project).

**Env vars**

| Var | Where |
| --- | --- |
| `FIREBASE_PROJECT_ID` | service-account JSON → `project_id` |
| `FIREBASE_CLIENT_EMAIL` | service-account JSON → `client_email` |
| `FIREBASE_PRIVATE_KEY` | service-account JSON → `private_key` (keep the `\n`s) |

**Steps**

1. Go to <https://console.firebase.google.com> → **Add project** (or reuse one). Skip Analytics.
2. **Build → Firestore Database → Create database** → **Production mode** → pick a region.
3. **Project settings (gear) → Service accounts → Generate new private key**. A JSON file downloads.
4. Open the JSON and copy three fields into `.env.local`:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
   ```
   - **Keep the surrounding quotes** and the literal `\n` escapes. The app converts `\n` back to newlines.
5. Firestore security rules: the app uses the **Admin SDK** (server-side), which bypasses rules — so you can leave rules locked (`allow read, write: if false;`). No client-side Firestore access is used.
6. Restart. `/api/health` → `"db":"live"`. Collections `users` and `projects` are created on first write.

---

## 3. LLM — Google Gemini

Generates the actual posts. Until configured, you get clearly-labeled canned sample outputs.

**Env vars**

| Var | Where |
| --- | --- |
| `GEMINI_API_KEY` | Google AI Studio |
| `GEMINI_MODEL` | optional, defaults to `gemini-2.0-flash` |

**Steps**

1. Go to <https://aistudio.google.com/apikey> → **Create API key** (free tier is generous).
2. Paste into `.env.local`:
   ```env
   GEMINI_API_KEY=AIzaSyxxx
   GEMINI_MODEL=gemini-2.0-flash
   ```
3. Restart. `/api/health` → `"ai":"live"`.
4. Test real generation without any other service: go to **/upload → Paste transcript**, paste a few paragraphs, Process. Pasted transcript skips transcription, so this exercises Gemini directly.

**Notes**

- The voice/tone prompts (the product's differentiator) live in `src/lib/ai/prompts.ts` — tune them here.
- Swap models via `GEMINI_MODEL` (e.g. `gemini-2.5-flash`).

---

## 4. Payments — Stripe

Real subscriptions + plan upgrades. Until configured, "checkout" simulates an instant upgrade with no charge.

**Env vars**

| Var | Where |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys |
| `STRIPE_PRICE_STARTER` | price id for the $19 plan |
| `STRIPE_PRICE_PRO` | price id for the $39 plan |
| `STRIPE_PRICE_MAX` | price id for the $99 plan |
| `STRIPE_WEBHOOK_SECRET` | from `stripe listen` (dev) or the dashboard webhook (prod) |

**Steps**

1. Create an account at <https://dashboard.stripe.com>. Stay in **Test mode** while developing.
2. **Products** → create three recurring products matching the plans (prices come from `src/lib/plans.ts`):
   - Starter — **$19 / month**
   - Pro — **$39 / month**
   - Max — **$99 / month**
   - (Optional: add a yearly price each for the annual −20% toggle.)
3. For each product, copy its **Price ID** (`price_...`) into `.env.local`:
   ```env
   STRIPE_SECRET_KEY=sk_test_xxx
   STRIPE_PRICE_STARTER=price_xxx
   STRIPE_PRICE_PRO=price_xxx
   STRIPE_PRICE_MAX=price_xxx
   ```
4. **Webhook (local dev)** — install the Stripe CLI (<https://stripe.com/docs/stripe-cli>), then:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copy the `whsec_...` it prints into `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```
5. Restart. `/api/health` → `"payments":"live"`. From **/settings → Billing → Change plan**, "Choose Pro" now opens real Stripe Checkout. Use test card `4242 4242 4242 4242`, any future expiry/CVC.

**How upgrades flow**

- Checkout success → Stripe fires `checkout.session.completed` → `/api/stripe/webhook` updates the user's `plan`.
- `customer.subscription.updated/deleted` keep the plan in sync (downgrade/cancel → back to `starter`).

---

## 5. Transcription — local Whisper (+ ffmpeg, yt-dlp)

Transcribes uploaded audio/video and YouTube links. Until configured, you get a canned transcript. **Pasted transcripts never need this** — they go straight to Gemini.

> Not installed on this machine yet. This is the most optional service; you can ship with paste-transcript + (later) wire a hosted STT instead.

**Env vars**

| Var | Where |
| --- | --- |
| `WHISPER_BIN` | path/command to the whisper CLI |
| `WHISPER_MODEL` | optional, defaults to `base` |

**Steps (Windows)**

1. **ffmpeg** (required by Whisper):
   ```powershell
   winget install Gyan.FFmpeg
   # or: choco install ffmpeg
   ```
   Confirm: `ffmpeg -version`.
2. **Whisper** (Python 3.8+):
   ```powershell
   pip install -U openai-whisper
   ```
   Find the executable path: `(Get-Command whisper).Source`.
3. **yt-dlp** (only for the YouTube tab — downloads audio):
   ```powershell
   pip install -U yt-dlp
   # or: winget install yt-dlp.yt-dlp
   ```
4. Add to `.env.local`:
   ```env
   WHISPER_BIN=C:\Users\you\AppData\Local\Programs\Python\Python312\Scripts\whisper.exe
   WHISPER_MODEL=base
   ```
   (Use the path from step 2. `base` is fast; `small`/`medium` are more accurate but slower.)
5. Restart. `/api/health` → `"transcription":"live"`. Test via **/upload → Upload file** or **YouTube link**.

**Notes**

- Adapter lives in `src/lib/transcription/index.ts`. YouTube path shells out to `yt-dlp` then `whisper`; file path runs `whisper` directly.
- On a server/Vercel, local Whisper isn't available — for production transcription either run a separate worker, a container with ffmpeg+whisper, or swap in a hosted STT API in that adapter.

---

## 6. App URL

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000   # dev
# NEXT_PUBLIC_APP_URL=https://your-domain.com  # prod
```

Used for Stripe success/cancel redirects. Set it to your real domain in production.

---

## 7. Deploy to Vercel

1. Push the repo to GitHub (see "Git" below).
2. <https://vercel.com> → **New Project** → import the repo. Framework auto-detects **Next.js**. No build config needed.
3. **Settings → Environment Variables** — add every var from your `.env.local` (Production scope). Do **not** set `MOCK_MODE`.
   - For `FIREBASE_PRIVATE_KEY`, paste the value **with** `\n` escapes, wrapped in quotes.
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel/production domain.
5. **Stripe production webhook**: in the Stripe dashboard (Live mode) → **Developers → Webhooks → Add endpoint** → URL `https://your-domain.com/api/stripe/webhook` → subscribe to `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy its signing secret into Vercel's `STRIPE_WEBHOOK_SECRET`.
6. Switch Stripe keys + price IDs to **Live mode** values.
7. In Clerk, add your production domain under **Domains**.
8. Redeploy. Hit `/api/health` on the live URL — all services should read `live`.

---

## 8. Verify each step

After each service, confirm:

| Service | Quick check |
| --- | --- |
| Auth | `/sign-in` shows Clerk widget; can log in → lands on `/dashboard` |
| DB | Create a piece, restart server, it's still in **Recent projects** |
| AI | Paste-transcript output is real content (no "Mock output" note) |
| Payments | "Choose Pro" opens Stripe Checkout; test card upgrades the plan |
| Transcription | Upload-file / YouTube produces a real transcript |

`curl /api/health` should end up `{"auth":"live","db":"live","ai":"live","payments":"live","transcription":"live"}` (transcription may stay mock if you skip Whisper).

---

## 9. Go-live checklist

- [ ] `npm install`, `cp .env.example .env.local`
- [ ] Clerk keys + paths → `auth: live`
- [ ] Firebase service account → `db: live`
- [ ] Gemini key → `ai: live` (test with paste-transcript)
- [ ] Stripe keys + 3 price IDs + webhook secret → `payments: live`
- [ ] (Optional) ffmpeg + Whisper + yt-dlp → `transcription: live`
- [ ] `NEXT_PUBLIC_APP_URL` set to prod domain
- [ ] `npm run build` and `npm run lint` pass
- [ ] Vercel project created, all env vars added (no `MOCK_MODE`)
- [ ] Stripe **live** webhook endpoint + secret configured
- [ ] Clerk production domain added
- [ ] `/api/health` on prod shows the services you intend live

---

## Git (repo not yet committed)

```bash
git add -A
git commit -m "OneToMany MVP"
git branch -M main
git remote add origin https://github.com/you/one-to-many.git
git push -u origin main
```

`.env.local`, `.next`, and `node_modules` are already git-ignored. Double-check no real key is staged before pushing: `git diff --cached | grep -iE "sk_|pk_|whsec_|AIza|PRIVATE KEY"` should return nothing.
