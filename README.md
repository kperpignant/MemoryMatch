# MemoryMatch

*Less swiping. More story.* — A video-first dating & social-discovery app where people connect through nostalgic **Memory Reels**, **Vibe Pages**, and low-pressure **Charms** instead of swipes.

Built for the **H01 Hackathon** (Vercel & AWS) · Track 1 — Monetizable B2C · Team: Calvin, Karlee, Emily

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript + Tailwind 4 + shadcn/ui — deployed on **Vercel**
- **Auth:** Clerk (sign-in/up pages, route-protecting middleware, user-sync webhook)
- **Database:** Amazon **Aurora PostgreSQL** (Serverless v2) via **RDS Proxy**, SSL enforced — **Drizzle ORM**
- **Rate limiting:** Upstash Redis (`@upstash/ratelimit`) — no-ops locally until keys are set
- **Observability:** `/api/health` (DB-checking); Sentry DSN slot in env

## Getting started

```bash
npm install                 # or pnpm install
cp .env.example .env.local  # then fill in real keys
npm run db:push             # create tables on the database in DATABASE_URL
npm run db:seed             # beats, interests, prompts, 8 demo profiles
npm run dev
```

The app boots **without** keys (auth middleware passes through, DB-backed routes report "not configured") so the UI is workable before infra lands.

## Repo map

| Path | What |
|---|---|
| `app/` | Routes: landing, `/onboarding`, `/reel/build`, `/vibe/[username]`, `/browse`, `/chemistry/[matchId]`, `/me`, sign-in/up, `/api/health`, `/api/webhooks/clerk` |
| `components/` | Y2K window system, reel player/builder, onboarding wizard, browse list, shadcn `ui/` |
| `lib/db/schema.ts` | Full 17-table schema from PRD §19 (users → audit_events) |
| `lib/db/index.ts` | Lazy postgres.js client (small pool; RDS Proxy does real pooling) |
| `lib/actions/` | Server actions: like → match-on-insert + starters, block/unblock, report, delete account |
| `lib/auth.ts` | Session → `users` row resolution (never trust client ids) |
| `lib/ratelimit.ts` | Per-user/per-action limits |
| `scripts/seed.ts` | Idempotent seed |
| `middleware.ts` | Clerk route protection (public: `/`, auth pages, health, webhook) |
| `prototype/` | The original Y2K HTML/JSX design prototype (open `prototype/index.html`) |
| `docs/` | PRD + design screenshots |

## Environment

Copy `.env.example` → `.env.local`. Placeholders to replace: `DATABASE_URL` (RDS Proxy endpoint), Clerk publishable/secret/webhook keys, Upstash, Blob, Sentry. Table names live only in `lib/db/schema.ts` — adjust there before the first `db:push` if needed.

## Database notes

- Match logic is canonical-ordered (`user_a < user_b`) and idempotent; conversation starters are generated deterministically from shared Top 8 interests (no LLM).
- Blocks are bidirectional: they gate likes/reactions/browse and close existing matches.
- Account deletion soft-flags `users.status='deleted'` then cascade-purges profile data.
