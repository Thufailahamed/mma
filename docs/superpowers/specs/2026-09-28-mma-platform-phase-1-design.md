# MMA Platform — Phase 1 Design (Foundation)

- **Date:** 2026-09-28
- **Status:** Approved design, awaiting spec review
- **Scope:** Phase 1 only (foundation). Phases 2–8 are named but not designed here.

---

## 1. Purpose

Build a premium interactive MMA platform spanning media, data, prediction, live scoring,
trivia, and gamification. The product loop is:

```
READ → ANALYZE → PREDICT → WATCH → SCORE → EARN → COMPETE → RETURN
```

This document specifies **Phase 1 only**: monorepo, Cloudflare infrastructure, the complete
D1 schema, the design system, authentication, and a homepage shell that renders honest
empty states. Later phases build features *on* this foundation. Nothing in Phase 2–8 is
specced, stubbed, or faked here.

### 1.1 Non-negotiable development rules

Carried from the project brief and binding on every phase:

1. No fake functionality presented as complete.
2. No broken buttons.
3. No hard-coded data that belongs in D1.
4. No business logic in React components.
5. API, business, and database layers stay separated.
6. All API input validated.
7. TypeScript strict.
8. Minimal dependencies.
9. Reuse components.
10. Responsive at every breakpoint.
11. Loading, error, and empty states always handled.
12. Migrations for every schema change.
13. Realistic development seed data.
14. External MMA data providers stay abstract behind an interface.
15. Predictions are immutable after their deadline.
16. Admin endpoints are never reachable by normal users.
17. Realtime state is never stored in D1.

---

## 2. Decisions and their rationale

Decisions were made with the user during brainstorming. Alternatives were considered and
rejected; the reasoning is recorded so Phase 2+ does not relitigate them.

| # | Decision | Rejected alternatives | Rationale |
|---|---|---|---|
| D1 | Real Cloudflare account; remote D1 and R2 provisioned and verified in Phase 1 | Local emulation only | Verified migrations against the real engine from day one. No "works on miniflare, differs on D1" surprises. |
| D2 | Next.js and the API both deploy to Cloudflare Workers via `@opennextjs/cloudflare` | Next.js on Vercel | Single vendor, D1 binding reachable from both, and a Next rewrite keeps everything same-origin so cookie auth never needs CORS. |
| D3 | Drizzle ORM + drizzle-kit for schema, types, and queries | Raw prepared statements; Prisma | Type inference, composable joins for rankings/leaderboards, no runtime overhead on D1. `drizzle-kit generate` emits real `.sql` migration files applied by `wrangler d1 migrations apply`, so migrations stay portable SQL. Prisma's D1 support is preview-grade. |
| D4 | Email + password, PBKDF2-SHA256 via WebCrypto, opaque server-side sessions | bcrypt; JWT cookies | bcrypt has no Workers build. PBKDF2 is native, dependency-free, and OWASP-compliant at 310k iterations. Opaque sessions are revocable and a DB leak yields no usable credentials. |
| D5 | Complete schema for all 8 phases in migration `0001` | Phase 1 tables only, append later | D1 migrations are append-only. Retrofitting ~15 cross-referencing FKs after real data exists is a risky, painful retrofit. Seed *reference data only* in Phase 1. |
| D6 | Homepage = real components + designed empty states | Full MMA seed data in Phase 1 | Honours rule 1. Empty states are genuinely useful UI that Phase 2 retires. Section order is fixed now so Phase 2 only changes section *contents*. |
| D7 | pnpm workspaces, three deployable units (web, api, realtime) | Single Worker serving both; Turborepo | Independent API/web deploy cycles. Turborepo is YAGNI until CI build times actually hurt. |
| D8 | Visual direction "Carbon & Blood" — near-black, hot red accent, condensed display type | "Chalk & Gold" (print editorial); "Slate & Cyan" (terminal/analytics) | PPV broadcast energy. Makes the red `LIVE` indicator and prediction bars read instantly. Dark-first suits fight night on a phone. |
| D9 | Mobile reflow by density: `feature` / `standard` / `dense` | Single column everywhere; scrollers throughout | Satisfies "no desktop-only tables" without turning the mobile homepage into ten stacked full-bleed cards. Dense blocks become snap-scrolling rows under `sm`. |
| D10 | Packages are source-only, no build step | Compiled workspace packages with a build graph | Bundled into each app by Next and Wrangler. Removes an entire class of monorepo build-ordering pain. |

---

## 3. Repository architecture

```
mma/
├── apps/
│   ├── web/                     Next.js 15 App Router → Worker via OpenNext
│   │   ├── app/                 routes, layouts, metadata
│   │   ├── components/
│   │   │   ├── ui/              shadcn/ui primitives (owned code)
│   │   │   ├── mma/             domain components
│   │   │   └── layout/          nav, footer, shell
│   │   ├── lib/                 api client, hooks-free helpers
│   │   ├── hooks/
│   │   └── styles/globals.css   Tailwind v4 @theme tokens
│   └── api/                     Hono → Cloudflare Worker "mma-api"
│       ├── src/
│       │   ├── routes/          thin HTTP layer
│       │   ├── services/        business logic, no HTTP concepts
│       │   ├── middleware/      auth, role, csrf, rate limit, security headers
│       │   ├── db/              drizzle client factory
│       │   ├── errors.ts        AppError + envelope
│       │   └── index.ts         Worker entry
│       └── test/
├── packages/
│   ├── shared/                  zod schemas, domain types, response envelope, scoring rules
│   ├── db/                      drizzle schema + client (server-only)
│   └── validation/              re-exported zod schemas (see §3.3)
├── database/
│   ├── migrations/              generated .sql, applied by wrangler
│   └── seed/                    reference-data seed SQL
├── workers/
│   └── realtime/                Durable Object class (Phase 6) + rate limiter (Phase 1)
└── docs/superpowers/specs/
```

### 3.1 Layer separation

The rule the whole codebase is judged against: **a request flows in one direction only.**

```
HTTP (routes)  →  business logic (services)  →  data access (db/repositories)
```

- **Routes** parse and validate input, call exactly one service, format the response. No
  SQL, no business rules, no multi-service orchestration.
- **Services** hold all business logic and own their authorization decisions. They receive
  validated, typed input and never touch `c.req` or `c.json`.
- **Repositories** (inside `packages/db`) hold every query. SQL appears nowhere else.
- **React components** render props and call the API client. No business logic, no data
  fetching outside Server Components or dedicated hooks.

### 3.2 `packages/shared` — source-only

Exports raw TypeScript. No `tsup`, no `dist`, no `main`/`exports` build config. Next and
Wrangler each bundle what they import.

A Cloudflare-specific ESLint rule bans importing `@mma/db` (or any module that transitively
resolves `D1Database` from `@cloudflare/workers-types`) from any file under
`apps/web/components` or `apps/web/hooks`. The database binding must never reach the browser
bundle.

### 3.3 `packages/validation` — why it exists separately

Zod schemas are imported by **both** the client (to type and validate forms) and the API
(to parse and validate requests). If a schema lived in `apps/api`, the web app could not
import it without reaching across the app boundary. `packages/validation` is that shared
boundary. Schemas are therefore one definition with no drift — the same object the client
uses to build a form is the one the server parses against.

`packages/shared` holds what is *not* a schema: domain types, the response envelope, and
versioned scoring-rule constants (prediction points, XP awards, level curve). Scoring rules
are code, not data, so they are versioned in source and stamped onto rows at write time —
this is what makes the "never re-score historical predictions" rule enforceable.

---

## 4. Cloudflare configuration

### 4.1 Resources

| Binding | Type | Used by |
|---|---|---|
| `DB` | D1 database | api, web (server-side reads) |
| `MEDIA` | R2 bucket | api |
| `REALTIME` | Durable Object namespace | api (rate limiting in Phase 1; live state in Phase 6) |
| `IMAGES` | Worker Images binding | api, for `cf.image` resizing. Requires a paid Cloudflare plan; when absent, `/img/:key` streams the R2 object unmodified. |

### 4.2 Environment matrix

`wrangler.jsonc` is the single source of truth, with three named environments
(`development`, `staging`, `production`). Each environment binds the same binding *names*
to different resource IDs. No code branches on environment to pick a database.

`wrangler dev` uses local emulation (local D1, local R2, local Durable Objects) so the
inner loop needs no network. Remote commands require `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID`:

```bash
pnpm db:migrate:remote    # wrangler d1 migrations apply DB --remote --env <env>
pnpm db:seed:remote
```

### 4.3 Image delivery

R2 objects are **never** exposed as raw URLs. All media is served through
`GET /img/:key` on the API Worker, which:

1. Looks up `media_assets` by key to confirm the object is a known, published asset.
2. Streams the object from R2.
3. Applies Cloudflare Image Resizing (`cf.image`) when width/format params are supplied,
   honouring an allow-list of widths.

`apps/web` registers a custom Next `images.loader` that emits `/img/<key>?w=<width>&f=<format>`.
`next.config.ts` therefore sets `images.loader = 'custom'` and disables the default optimizer,
which does not exist on Workers.

---

## 5. D1 schema

### 5.1 Conventions

Applied to every table without exception.

| Concern | Choice | Rationale |
|---|---|---|
| Primary key | `TEXT` holding `crypto.randomUUID()` | SQLite has no UUID type. Public identity is the slug, not the id. |
| Timestamps | `INTEGER` unix epoch **milliseconds**, drizzle `mode: 'timestamp_ms'` | Integer comparison is cheap and index-friendly; drizzle hydrates to `Date`. |
| Enums | `TEXT` + `CHECK (col IN (...))` | No native enum. CHECK is enforced by D1 itself, not merely by TypeScript. |
| Booleans | `INTEGER` 0/1, drizzle `mode: 'boolean'` | D1 has no boolean type. |
| Nullable | explicit `NOT NULL` everywhere it can be guaranteed | Implicit nullability is where schema bugs live. |
| Soft delete | only where it carries meaning: `articles.status`, `comments.status`, `reports.status` | Not on reference data. Reference rows are hard-deleted or archived. |
| `updated_at` | `NOT NULL` with a default, set explicitly on every write | D1 has no `ON UPDATE CURRENT_TIMESTAMP`. |
| Foreign keys | `REFERENCES ... ON DELETE` with an explicit action | `CASCADE` for owned children (a poll's options), `RESTRICT` for referenced entities (a fight's event), `SET NULL` for optional links (an article's author being deleted). |
| Computed values | always computed in SQL at query time, never stored | Community percentages and leaderboard positions are derived, per brief §10 and §16. |
| Money/XP | append-only `xp_events` ledger; `users.xp` is a maintained cache | Balances recompute and audit correctly. |

**Foreign key enforcement:** D1 enables foreign keys by default. Any transaction that
defers a constraint uses `PRAGMA defer_foreign_keys = 1` inside the batch.

**Indexes:** D1 does **not** auto-index foreign keys, so every FK column gets one explicitly.
Composite indexes are added for every `status`-filtered hot path. All `slug` columns get a
unique index.

### 5.2 Table inventory

42 tables: the 22 specified in the brief, plus 20 added in §5.4. Columns follow the brief's
field lists exactly unless a refinement in §5.3 applies.

**Identity and access (5)**

`users` · `user_profiles` · `sessions` · `xp_events` · `audit_logs`

**MMA reference and results (8)**

`promotions` · `divisions` · `fighters` · `events` · `fights` · `fight_rounds` ·
`fight_statistics` · `judge_scores`

**Rankings (1)**

`rankings`

**Editorial (7)**

`articles` · `tags` · `article_tags` · `article_fighters` · `article_events` ·
`article_fights` · `article_revisions`

**Predictions (1)**

`predictions`

**Live and polls (5)**

`live_round_scores` · `polls` · `poll_options` · `poll_votes` · `live_event_snapshots`

**Trivia (5)**

`trivia_categories` · `trivia_questions` · `trivia_answers` · `trivia_attempts` ·
`trivia_daily_schedules`

**Gamification (2)**

`achievements` · `user_achievements`

**Community, Phase 7 (6)**

`follows` · `comments` · `notifications` · `battles` · `battle_predictions` · `prediction_reactions`

**Platform (2)**

`media_assets` · `reports`

### 5.3 Refinements to the brief's field lists

Four changes to the specified columns, each with a reason:

1. **`rankings.rank` cannot express "Champion".**
   Add `is_champion INTEGER NOT NULL DEFAULT 0`. Champion rows carry `rank = 0`, and all
   `rank` values except the champion are `>= 1`. Unique index on
   `(division_id, ranking_date, fighter_id)`; a separate index on
   `(promotion_id, division_id, ranking_date)` for division-page reads.

2. **`predictions` needs `scoring_version TEXT NOT NULL`.**
   Brief §9 forbids re-scoring historical predictions with current rules. The resolver
   stamps the rule version that paid out; historical rows are never revisited. Also
   `bonus_answers TEXT` (JSON) holds brief §9's optional +3 bonus answers, rather than a
   speculative normalised table for a feature not yet specced.

3. **`articles.content` holds a serialised block document (TipTap/ProseMirror JSON), not
   Markdown.** Brief §22 requires fighter cards, fight cards, and poll widgets *inside*
   editorial content, which Markdown cannot express without a custom extension layer.
   `article_revisions` stores the previous document on each save for undo and audit.

4. **`divisions.weight_limit` is `INTEGER` grams** with no unit column. `UNIQUE (promotion_id, slug)`.

### 5.4 Tables added beyond the brief's list

Each is required by a rule in the brief that the specified table list did not cover.

| Table | Why it is necessary |
|---|---|
| `sessions` | Brief §4 specifies `password_hash` and three roles but no session store. Opaque hashed tokens need a table (§7.2). |
| `xp_events` | Brief §15 gamification needs auditable, recomputable XP. Without a ledger, `users.xp` is an untrustworthy number. |
| `article_fighters` / `article_events` / `article_fights` | Brief §7 requires dynamic related-content sections linking articles to fighters, events, and fights. `article_tags` alone cannot express those relationships. |
| `article_revisions` | Brief §22 requires a professional editorial experience. Save history and undo need the previous document. |
| `trivia_daily_schedules` | Brief §25 promises a "daily trivia" section; nothing defines which questions are in a day's set. `UNIQUE (question_id, scheduled_date)`. |
| `polls` / `poll_options` / `poll_votes` | Brief §18 requires a live poll. Normalised so one poll works for an event, a fight, or an article. |
| `live_event_snapshots` | Brief §19 requires Durable Object state to survive restarts. A recovery checkpoint bridges DO loss to persisted D1 state. |
| `follows` | Brief §7 requires following fighters and events. Polymorphic `target_type` + `target_id`, unique on `(user_id, target_type, target_id)`. |
| `comments` | Brief §7 community phase. Threaded via `parent_id`, polymorphic `entity_type` + `entity_id`, moderated through `status`. |
| `notifications` | Brief §7. `read_at IS NULL` is the unread predicate; index on `(user_id, read_at)`. |
| `battles` / `battle_predictions` | Brief §7 prediction battles. A battle is two users on one event, scored against each other. |
| `prediction_reactions` | Brief §7. Reactions on predictions, unique on `(prediction_id, user_id, kind)`. |
| `media_assets` | Brief §1 assigns R2 for all media. Nothing may reference a bare URL; R2 keys are mapped to published assets here. |
| `reports` | Brief §21 lists Reports as an admin section. Needs a table. |
| `audit_logs` | Brief §16/§21 admin actions need a durable record. |

20 added tables + 22 specified = 42.

### 5.5 Seed data (Phase 1)

**Reference data only** — the rows the schema itself depends on, and no fabricated content:

- `promotions`: UFC, ONE Championship, PFL, Bellator (from the brief)
- `divisions`: for each promotion, its weight classes with limits in grams
- One `ADMIN` user + `user_profiles` row, from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.
  The seed script **refuses to run when `ENVIRONMENT = 'production'`**, so no seed marker
  column is needed on `users`.

No fighters, events, fights, articles, or questions. Those are Phase 2+ and are exactly
what the homepage empty states are waiting for.

### 5.6 Migration policy

`drizzle-kit generate` emits numbered SQL into `database/migrations/`. Applied with
`wrangler d1 migrations apply`. Never edit an applied migration; a change is a new numbered
file. Schema changes ship with the code that reads them in the same commit.

---

## 6. API design

### 6.1 Response envelope

Success:

```json
{ "success": true, "data": {} }
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request body failed validation",
    "details": [{ "path": "email", "message": "Invalid email" }],
    "requestId": "0192f3c1-..."
  }
}
```

`requestId` is returned in the `X-Request-Id` response header and appears in Worker logs, so
a user-reported error is traceable without exposing internals.

### 6.2 Error codes

`VALIDATION_ERROR` (400) · `UNAUTHENTICATED` (401) · `FORBIDDEN` (403) ·
`NOT_FOUND` (404) · `CONFLICT` (409) · `PREDICTION_LOCKED` (409) ·
`SCORING_WINDOW_CLOSED` (409) · `RATE_LIMITED` (429) · `INTERNAL_ERROR` (500)

### 6.3 Endpoints in Phase 1

Only what the foundation needs. The brief's full route list (`/api/fighters`,
`/api/events`, `/api/predictions`, …) is Phase 2+ and is not stubbed here — a stubbed route
that returns empty data is exactly the fake functionality rule 1 prohibits.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | public | Liveness, plus D1 and R2 reachability |
| POST | `/api/auth/register` | public | Create `USER`, start session |
| POST | `/api/auth/login` | public | Verify PBKDF2, start session |
| POST | `/api/auth/logout` | session | Revoke session, clear cookies |
| GET | `/api/auth/me` | session | Current user + profile + role |
| GET | `/api/promotions` | public | Reference data; backs the empty-state nav |
| GET | `/api/promotions/:slug/divisions` | public | Divisions for a promotion |
| GET | `/api/admin/metrics` | `ADMIN` | Dashboard counts; proves the 403 boundary |
| GET | `/img/:key` | public | R2 media with `cf.image` resizing |

Every response is `Cache-Control: private, no-store` except `/img/:key`
(`public, max-age=31536000, immutable` — R2 keys are content-addressed) and `/api/health`
(`no-store`).

### 6.4 Route structure

```ts
const app = new Hono<{ Bindings: Env; Variables: { user: SessionUser } }>()
  .use('*', securityHeaders())
  .use('*', rateLimit())
  .get('/api/health', healthHandler)
  .use('/api/auth/*', csrf())
  .post('/api/auth/login', loginHandler)
  .route('/api/admin', requireRole('ADMIN'), adminRoutes)
```

### 6.5 Frontend API client

`apps/web/lib/api.ts` is the single fetch path. It attaches the `X-CSRF-Token` header on
mutations, throws `ApiError` carrying the envelope's `code` and `details`, and is the only
place cookies or headers are touched. Every `/api/*` request in the app goes through it, so
CSRF, error shape, and cache headers cannot be forgotten at a call site.

---

## 7. Authentication and security

### 7.1 Password hashing

PBKDF2-SHA256 through Workers' native WebCrypto. No dependency, no wasm.

```
pbkdf2_sha256$310000$<salt_base64>$<hash_base64>
```

- 310,000 iterations (OWASP floor for PBKDF2-SHA256)
- 16-byte random salt per password
- 32-byte derived key
- Constant-time comparison via a fixed-length XOR accumulator
- The stored string carries its own parameters, so the iteration count can be raised later
  and existing hashes remain verifiable; a verify path that finds a lower count re-hashes on
  successful login

### 7.2 Sessions

Opaque tokens in D1. On login the API generates 32 random bytes, base64url-encodes them, and
stores **only** `SHA-256(token)` in `sessions.token_hash`. The raw token is delivered to the
client in a cookie. A database dump therefore yields no usable session.

Cookie: `HttpOnly; Secure; SameSite=Lax; Path=/`, 30-day `Max-Age`, with a rotating
`expires_at` refreshed on use. `Secure` is set in every environment so the attribute is
tested locally under `wrangler dev`'s HTTPS emulator.

`sessions` rows carry `user_agent` and `ip` for the admin user-management view, and are
deleted on logout and on password change.

### 7.3 CSRF

Double-submit token, because `SameSite=Lax` permits top-level GET navigation and the auth
layer's safety should not rest on a browser default alone.

The API sets a second, non-`HttpOnly` `csrf_token` cookie alongside the session. Every
mutating request (anything not `GET`/`HEAD`/`OPTIONS`) must echo it in an `X-CSRF-Token`
header. A missing or mismatched header is a 403 `CSRF_TOKEN_INVALID`, checked in middleware
before any route logic runs.

### 7.4 Middleware chain

Applied in this order in `apps/api/src/index.ts`:

1. `securityHeaders` — CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
   `X-Frame-Options: DENY`, HSTS in non-development
2. `rateLimit` — Durable Object backed
3. `csrf` — mutating methods only
4. `requireAuth` — resolves the session, sets `ctx.user`, 401s otherwise
5. `requireRole('EDITOR' | 'ADMIN')` — 403s otherwise

**Rate limiting is Durable Object backed, not an in-memory `Map`.** Worker isolates do not
share memory, so an in-memory limiter is a no-op under scale-out. The `RateLimiter` DO in
`workers/realtime/` is the Phase 1 member of that package; the live-fight DO joins it in
Phase 6. Anonymous routes are keyed by IP, authenticated routes by `user_id`, with
per-route budgets and a `Retry-After` header on 429.

### 7.5 Authorization is two layers

**Capability (middleware).** `requireRole` gates whole route trees. A `USER` token hitting
`/api/admin/*` gets **403, not 404**, so the surface is visible in logs and auditable.

**Row ownership (services).** `requireAuth` alone would let any user reach any
`/api/users/:id`. Ownership checks live in the service layer, next to the query they guard:
a user may only patch their own profile, and only a prediction's `user_id` owner may write
it before the lock. Middleware guards *what a role can do*; services guard *which rows a
role may touch*.

### 7.6 Input validation

Zod at the edge. The schemas in `packages/validation` are imported by both client forms and
the API, so there is one definition and no drift. Every `c.req.json()` passes through
`schema.safeParse`; failure returns 400 `VALIDATION_ERROR` with per-field `details`.

No unvalidated value reaches a query, and Drizzle parameterizes every statement, so the SQL
injection surface is closed by construction rather than by escaping. Additionally:

- D1 has no `exec` for user input anywhere; string interpolation into SQL is banned by lint
- All IDs are validated as UUIDs before lookup
- Pagination uses validated bounded integers with a hard cap

### 7.7 CORS

**No CORS configuration is added.** Same-origin holds in development (Next rewrite proxy) and
production (two Workers, one domain). A permissive cross-origin policy would undermine
cookie-based auth, so it is deliberately absent rather than merely unconfigured.

### 7.8 Boot-time secret validation

`SESSION_SECRET` must be present and at least 32 bytes in `staging` and `production`. A
missing secret fails the Worker boot immediately. A silent development default that ships to
production is a session-forgery vulnerability, so there is no fallback path.

### 7.9 Error handling

A single `AppError` class carrying `code`, `status`, `message`, and optional field-level
`details`. One Hono `onError` handler serializes it into the envelope. Anything unhandled
becomes a 500 with a request ID and no internals in the body. The client's `ApiError` mirrors
the shape so forms can render field errors directly.

---

## 8. Frontend architecture

### 8.1 Stack

- **Next.js 15** App Router, React 19
- **TypeScript `strict`** with `noUncheckedIndexedAccess` enabled. This is what makes rule 7
  real: array access yields `T | undefined`, so an unchecked access is a compile error.
- **Tailwind CSS v4** with `@theme` tokens in `globals.css` — CSS-first config, no
  `tailwind.config.ts` to drift
- **shadcn/ui** installed via the CLI into `apps/web/components/ui`. Owned code, not a
  dependency. `cn()` and `components.json` are generated, never hand-written.
- **Framer Motion** for the motion inventory in §8.6
- **Lucide** for icons

### 8.2 Typography

Loaded with `next/font/google`, which self-hosts at build time so Workers makes no external
font request at runtime.

| Role | Family | Configuration | Usage |
|---|---|---|---|
| Display | **Archivo** | variable, axes `wght` 400–900 **and `wdth` 62–125**, `latin` subset, preloaded | Fighter names, section headers, scoreboard. Expanded 800 for hero names, Condensed 600 for the scoreboard. The `wdth` axis must be declared in `next/font`, or only the default width loads. |
| UI / body | **Inter** | variable, `latin` subset, preloaded | All readable text. `font-variant-numeric: tabular-nums` on every stat, score, and rank. |
| Telemetry | **JetBrains Mono** | variable, dynamically imported | Live round clock, XP deltas, timestamps. Loaded only under `/live/*` so no other page pays for it. |

Two families on every non-live page.

### 8.3 Carbon & Blood tokens

```css
--background:        #0a0a0c   /* page base                    */
--surface:           #111114   /* cards                        */
--surface-raised:    #1c1c21   /* hover / elevated             */
--border:            #212127   /* hairlines                    */
--hairline:          rgb(255 255 255 / 0.06)  /* on dark surfaces */
--accent:            #e11d2e   /* primary action, live, pick-A */
--accent-foreground: #ffffff
--accent-hover:      #f53347
--live:              #e11d2e   /* LIVE indicator ONLY          */
--muted:             #71717a   /* secondary text               */
--muted-foreground:  #52525b   /* tertiary text                */
```

Dark is the default. Light mode ships via `prefers-color-scheme`, since articles are read on
phones in daylight. `--live` is reserved for the LIVE indicator and is never used
decoratively.

### 8.4 Premium surface treatment

The specific techniques, each cheap and each doing real work:

1. **Inset top highlight.** Every raised surface carries
   `inset 0 1px 0 rgb(255 255 255 / 0.05)`. This single 1px light edge is the largest
   perceptual difference between "flat dark theme" and "physical object". Non-negotiable on
   all cards.
2. **Film grain.** A 128×128 inline-SVG `feTurbulence` tile at 2.5% opacity over hero and
   card surfaces. Kills gradient banding on near-black and reads as print texture. Inline, so
   zero network cost.
3. **Two-layer shadow.** Ambient `0 1px 2px rgb(0 0 0 / 0.4)` plus key
   `0 12px 32px -8px rgb(0 0 0 / 0.6)`. Hover raises the key shadow; it does not scale the
   card.
4. **Pointer-tracked spotlight.** `FighterCard` writes `--mx`/`--my` on `pointermove`; a
   `radial-gradient(240px at var(--mx) var(--my), accent / 8%, transparent)` follows the
   cursor, paired with a maximum 2.5° `rotateX`/`rotateY`. Applied to `FighterCard` only —
   across a full card grid it becomes noise and costs frames.
5. **Media scrim.** A `linear-gradient` overlay on every R2 image so overlaid text meets
   measured contrast rather than an assumption about the photography.
6. **Hairline borders** at 6% white, brightening to accent on hover.
7. **Fight-card face-off.** Fighter names split by a diagonal divider, accent applied to the
   user's picked side.

### 8.5 Responsive strategy

Every component declares one of three densities, and the density — not the breakpoint —
decides the mobile layout.

| Density | Behaviour | Examples |
|---|---|---|
| `feature` | full-width at every breakpoint | Hero, main-event card, live fight panel |
| `standard` | 1-up `< sm`, 2-up `sm`→`md`, 3-up `md`+ | Article, fighter, fight, event cards |
| `dense` | 2-up `< md`, snap-scroller under `sm` | Rankings, leaderboard, stat tiles |

**No `<table>` renders below `sm`.** Dense tabular data becomes snap-scrolling rows. All
touch targets are at least 44×44px. The live page respects safe-area insets so browser
chrome cannot cover the scoring controls. Verified at 375, 768, and 1440 with no horizontal
scroll.

### 8.6 Motion inventory

Framer Motion. Every entry is behind `prefers-reduced-motion` and animates only
`transform` and `opacity`.

| Element | Motion |
|---|---|
| Prediction bar | spring width + count-up numeral |
| Skeletons | gradient sweep via `background-position` |
| Live dot | 2s pulse + expanding ring |
| Achievement unlock | scale 0.8→1 with a one-shot glow burst |
| Leaderboard rows | FLIP reordering on rank change |
| Trivia answer | shake on wrong, green flash on correct |
| Route change | fade + 8px rise, via `template.tsx` (never wraps streamed content) |
| Sticky nav | `backdrop-blur`, border fading in past 8px scroll |
| Fighter card | pointer spotlight + 2.5° tilt |

**Performance rules, because premium effects are where frame rates die:**

- No animated `box-shadow` or `filter` across a list
- `backdrop-filter` is limited to the nav and modals, never full-bleed on mobile
- `content-visibility: auto` on lists over 20 rows
- Zero Framer Motion in Server Components; motion enters only at named `"use client"` leaves
- `will-change` applied on interaction start and removed on end, never left permanent
- Motion components are dynamically imported

### 8.7 Component inventory

**Shaping rule: a component is built in the phase that first has a caller for it.** The
brief's §30 list is the eventual target, but building `RoundScoreCard` in Phase 1 — with no
live page, no round data, and no consumer — is dead code, which rule 8 forbids. Each
component below is listed with the phase that builds it.

**Primitives — Phase 1** (shadcn/ui via CLI into `apps/web/components/ui`, owned code, `cn()`
and `components.json` generated):

`Button` · `Card` · `Input` · `Label` · `Select` · `Tabs` · `Dialog` (brief's *Modal*) ·
`Sheet` (brief's *Drawer*) · `DropdownMenu` · `Avatar` · `Badge` · `Skeleton` · `Separator` ·
`Tooltip` · `ScrollArea`

**Domain — Phase 1**, because the homepage empty states and the auth pages are their callers:

`EmptyState` · `ErrorState` · `SectionHeader` · `LiveIndicator` · `StatCard` · `Countdown`

**Domain — Phase 2:** `FighterCard` (with the §8.4 spotlight and tilt) · `FightCard` (with
the §8.4 face-off) · `EventCard` · `RankingTable`

**Domain — Phase 3:** `ArticleCard`

**Domain — Phase 4:** `PredictionCard` · `PredictionBar` · `Leaderboard`

**Domain — Phase 5:** `TriviaCard`

**Domain — Phase 6:** `RoundScoreCard`

**Domain — Phase 7:** `ProfileCard` · `AchievementBadge` · `FighterComparison`

### 8.8 Empty and error states

A component never renders `null` or a bare "No data". It renders `<EmptyState>`, which states
**what is missing**, **why**, and **one action that changes it**. This is why Phase 1 needs no
fabricated data: the empty states are genuinely useful UI that Phase 2 replaces with
content, and the same component then covers a user with zero predictions in Phase 4.

Errors render `<ErrorState>` with a retry affordance and a request ID. A section that fails
never becomes a blank box, and no `try`/`catch` in a React component swallows an error.

### 8.9 The "what next" rule

Brief §32 requires every page to answer "what should the user do next?". This is enforced
structurally, not by discipline: interactive cards accept a `nextAction?: { href, label }`
prop. A completed fight passes `null`. A section cannot render without deciding what the user
does next.

### 8.10 Homepage sections (Phase 1)

Order is fixed now per brief §25; Phase 2+ changes section **contents** only.

| # | Section | Component | Phase |
|---|---|---|---|
| 1 | Hero — next event | `EventCard` (feature) | 2 |
| 2 | Main event | `FightCard` (feature) | 2 |
| 3 | Upcoming fights | `FightCard` ×3 (standard) | 2 |
| 4 | Latest articles | `ArticleCard` ×3 (standard) | 3 |
| 5 | Community predictions | `PredictionBar` (dense) | 4 |
| 6 | Daily trivia | `TriviaCard` ×3 (standard) | 5 |
| 7 | Rankings | `RankingTable` (dense) | 2 |
| 8 | Trending fighters | `FighterCard` ×4 (standard) | 2 |
| 9 | Latest results | `FightCard` ×3 (standard) | 2 |
| 10 | Leaderboard | `Leaderboard` (dense) | 4 |
| 11 | Fight night CTA | `LiveIndicator` (feature) | 6 |

In Phase 1 every section renders its `EmptyState`. Section 11's CTA is visibly disabled and
labelled "Phase 6" — a dimmed, honest control rather than a live-looking button that goes
nowhere (rule 2).

### 8.11 Data fetching

Server Components fetch directly through the API client for initial page data; client
Components fetch through hooks for interactivity. No client-side fetching library — React
server rendering plus targeted hooks is sufficient and avoids a dependency.

### 8.12 SEO foundation

Dynamic `generateMetadata` per route group with title template, description, Open Graph,
Twitter/X, and canonical URL from `NEXT_PUBLIC_SITE_URL`. `sitemap.ts` and `robots.ts` are
wired in Phase 1 and emit an empty-but-valid sitemap until Phase 2 populates it. JSON-LD
structured data helpers land with the entity pages in Phase 2.

---

## 9. Realtime architecture (Phase 6 — boundary only)

Phase 1 creates the package and the boundary; it does not build live functionality.

```
D1          persistent source of truth — never holds transient live state
Durable Object   authoritative live state per event
WebSocket / SSE  client updates
```

Phase 1 delivers `workers/realtime/` containing the `RateLimiter` Durable Object, and the
API exposes realtime-related bindings so the live DO drops in during Phase 6 without a
configuration change. `live_event_snapshots` exists from day one as the recovery checkpoint.
No WebSocket endpoint, no live page, and no live UI ship in Phase 1.

---

## 10. External MMA data provider (Phase 2 — interface only)

Brief §20 requires a replaceable provider. Phase 1 defines the interface and nothing else;
there is no implementation, no mock, and no route, because an unused provider is speculative
abstraction.

```ts
export interface MMADataProvider {
  getEvents(): Promise<MMAEvent[]>
  getEvent(slug: string): Promise<MMAEvent | null>
  getFighter(slug: string): Promise<MMAFighter | null>
  getFighterFights(fighterId: string): Promise<MMAFight[]>
  getFight(id: string): Promise<MMAFight | null>
  getLiveFight(): Promise<MMAFight | null>
  getRankings(divisionId: string): Promise<MMARanking[]>
  getFightStats(fightId: string): Promise<MMAFightStat[]>
}
```

Phase 2 implements the first provider (mock or API-backed) behind this interface. **No
scraping** — the brief forbids it unless explicitly required and legally appropriate.

---

## 11. Testing strategy

| Layer | Tool | Scope in Phase 1 |
|---|---|---|
| Services / logic | Vitest | PBKDF2 hash + verify, constant-time compare, CSRF token check, `requireRole` 401/403 paths, response envelope serialization, `AppError` → status/code mapping, Zod schemas for every Phase 1 endpoint |
| End-to-end | Playwright | Register → login → logout; a `USER` receiving 403 from `/api/admin/*`; homepage load asserting empty states render; 375px viewport with no horizontal scroll |

D1 query correctness is **not** unit tested. Queries are verified against real D1 by the
migration gate and the endpoint smoke tests in §12.2, which is a stronger check than a mock.
Playwright is deliberately narrow: the business logic lives in the API, so that is where the
tests are.

**Lint rules beyond ESLint defaults:**

- `@typescript-eslint/no-floating-promises`, `no-misused-promises`
- `no-restricted-imports` banning `@mma/db` from web components and hooks
- `no-restricted-syntax` banning string-interpolated SQL outside `packages/db`
- `import/no-cycle`

---

## 12. Local development

```bash
pnpm install
pnpm db:migrate:local     # applies 0001 to local D1
pnpm db:seed              # promotions, divisions, admin user
pnpm dev                  # wrangler dev :8787 + next dev :3000, concurrently
```

`http://localhost:3000` is the only origin to visit. The Next rewrite forwards `/api/*` to
`http://localhost:8787`, so the browser never makes a cross-origin request and cookies
behave identically in development and production.

### 12.1 Environment variables

`.dev.vars` for the API, `.env.local` for the web app. Both gitignored; `.dev.vars.example`
is committed.

| Variable | Location | Purpose |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | shell | wrangler remote commands |
| `CLOUDFLARE_ACCOUNT_ID` | shell | wrangler remote commands |
| `DATABASE_NAME` | `.dev.vars` | D1 binding name; must match `wrangler.jsonc` |
| `MEDIA_BUCKET_NAME` | `.dev.vars` | R2 binding name |
| `SESSION_SECRET` | `.dev.vars` | ≥32 random bytes; HMAC key for session token hashing |
| `ENVIRONMENT` | `.dev.vars` | `development` \| `staging` \| `production` |
| `NEXT_PUBLIC_SITE_URL` | `.env.local` | canonical origin for SEO and OpenNext |
| `SEED_ADMIN_EMAIL` | `.dev.vars` | dev/staging only |
| `SEED_ADMIN_PASSWORD` | `.dev.vars` | dev/staging only; the seed refuses to run in production |

`SESSION_SECRET` generation: `openssl rand -base64 32`.

### 12.2 Verification gates

Phase 1 is complete only when all of these have been **run and passed**, not asserted:

1. `pnpm typecheck` — `tsc --noEmit`, every workspace, strict
2. `pnpm lint` — ESLint flat config plus the four custom rules in §11
3. `pnpm test` — Vitest suite green
4. `pnpm build` — Next production build through the OpenNext adapter
5. `wrangler d1 migrations list DB` — `0001` applied, remote and local
6. Endpoint smoke tests, **including failure paths**: bad CSRF → 403, no session → 401,
   `USER` on `/api/admin/*` → 403, malformed body → 400 with field details
7. Responsive pass at 375 / 768 / 1440 with no horizontal scroll

---

## 13. Phase 1 scope boundary

### Delivered

Monorepo structure · Cloudflare Workers + D1 + R2 configuration across three environments ·
complete 42-table schema with migration `0001` and indexes · reference-data seed ·
Drizzle schema and repositories · response envelope and error taxonomy · authentication
(register, login, logout, me) with PBKDF2 and opaque sessions · CSRF, rate limiting,
security headers, role authorization · design tokens, fonts, and premium surface treatment ·
the Phase 1 primitive and domain components · motion inventory · homepage shell with all 11
sections in designed empty states · `/api/img` R2 delivery with `cf.image` resizing · SEO
foundations · Vitest and Playwright suites · all §12.2 gates passing.

### Explicitly not delivered

Fighter, event, and fight pages and seed data (Phase 2) · articles, tags, and the editor
(Phase 3) · prediction UI, API, locking, and scoring (Phase 4) · trivia, XP, streaks, and
achievements (Phase 5) · the live page, Durable Object live state, and SSE/WebSocket
transport (Phase 6) · profiles, comments, follows, notifications, battles (Phase 7) ·
performance, accessibility, and SEO refinement passes (Phase 8).

**No route, button, or component in Phase 1 pretends to do Phase 2+ work.** Stubs are not
scaffolding here; they are the fake functionality rule 1 prohibits.

---

## 14. Open questions

None blocking. Two items are deliberately deferred to their own phase's design:

1. **Conflict rules for a fight's `division_id` versus its event's promotion.** A fight's
   division must belong to the event's promotion. This is a `CHECK`-adjacent cross-table
   invariant that D1 cannot express; it will be enforced in the Phase 2 service layer, and
   the decision on whether to duplicate `promotion_id` onto `fights` for index performance
   is deferred until query shapes are known.
2. **Whether `article_revisions` retains full documents or diffs.** Full documents are
   specified. Storage cost is acceptable at expected article volume; revisit only if revision
   counts grow unexpectedly.

## 15. Phase 2 preview

Phase 2 delivers promotions, divisions, fighters, events, fights, rankings, and results,
plus `/fighters/[slug]`, `/events/[slug]`, and `/fights/[slug]` pages with full metadata, plus
the first `MMADataProvider` implementation, plus realistic seed data. It retires homepage
empty-state sections 1, 2, 3, 7, 8, and 9. Its design will be brainstormed and specced
separately; nothing in this document pre-approves it.
