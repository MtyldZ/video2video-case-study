<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project guide for AI agents

Video to Video: upload a short clip, pick a Magic Hour art style, get an AI-restyled video back via an async webhook. Next.js 16 App Router, TypeScript (strict), Ant Design 6, MongoDB, Uploadcare, Cloudinary, Magic Hour, deployed on Vercel.

**Read `README.md` first.** It is the source of truth for the architecture, the webhook/async flow, the API contract, and environment setup. This file covers only what an agent needs on top of it.

## Commands

| Command | Notes |
|---|---|
| `npm run dev` | Dev server on :3000. Needs `.env.local` (see `.env.example`). |
| `npx tsc --noEmit` · `npm run lint` · `npm run build` | Run all three before calling a change done. |
| `npm run check:logic` | Assertion checks for schemas, the clip cap, the credit estimate and webhook signatures. No keys needed; extend it when you touch that logic. |
| `npm run check:services` | Verifies MongoDB, Cloudinary and Magic Hour credentials. Free. |
| `npm run webhook:replay -- <mhJobId> [completed\|errored]` | Sends a signed test webhook to the local app. |

There is no unit-test framework on purpose; `check:logic` is the test suite.

## Where things live

- `src/app/api/*/route.ts`: the API: `upload`, `transform`, `webhook`, `history`, `credits`.
- `src/lib/schemas.ts`: zod schemas, types and constants shared by client **and** server (Magic Hour enums, limits, `estimateCredits`). Change validation here, not in routes or forms.
- `src/lib/jobs.ts`: `applyProjectResult` (the one place a Magic Hour result is written; used by both the webhook and fallback polling) and `refreshStaleJobs`.
- `src/lib/magichour.ts`, `cloudinary.ts`, `db.ts`, `env.ts`, `uid.ts`: server-only clients and helpers.
- `src/lib/api.ts`, `media.ts`, `theme.ts`: client fetch helpers, Cloudinary URL transforms, antd theme tokens.
- `src/components/`: UI. `JobParts.tsx` holds shared pieces (status tag, video player).

## Invariants: don't break these

1. **Insert the DB record before calling Magic Hour** (`/api/transform`), so a paid job always has a record.
2. **Results only go through `applyProjectResult`.** It is idempotent (final states are never overwritten, and the Cloudinary public id is the job id) because Magic Hour retries webhooks for 24 h.
3. **Webhook:** verify the HMAC signature over the **raw** body before parsing. Return non-2xx only when a retry should happen (404 unknown job, 500 transient failure).
4. **`timed_out` is not final.** A late result must still be able to complete the record.
5. **Validation lives in zod schemas** used on both sides. Server routes must never trust the client (upload URL allowlist, own-Cloudinary source check, 5 s clip cap).
6. **Secrets stay server-side.** Only `NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY` reaches the browser. Read env through `env()` (lazy, zod-validated).
7. API errors are `{ error: string }` with a user-facing message; log details server-side with `console.error`.

## Conventions and gotchas

- **antd v6**, not v5: `Alert` uses `title` (not `message`), `Spin` uses `description` (not `tip`), `Drawer` uses `size` (not `width`/`height`), `Steps` items use `content` (not `description`), `Button` uses `iconPlacement`. Check `node_modules/antd/es/<component>/*.d.ts` for `@deprecated` before using a prop.
- Pages using antd's dotted components (`Typography.Title`, `Form.Item`) must be client components (`"use client"`).
- Brand and UI colors come from `theme.useToken()` (the palette lives only in `src/lib/theme.ts`), so light and dark mode both work. Neutral black/white for video backgrounds is the one exception.
- Match the existing style: small files, early returns, comments only for *why*. No new dependencies without a clear need.
- Deliberate shortcuts are marked with a `ponytail:` comment naming the limit and the upgrade path.
- Commits use Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).

## Cost and safety

- **Every `POST /api/transform` spends real Magic Hour credits** on a shared account (about 2 credits per rendered frame, ~30 per second at HALF). Don't run transforms, loops or load tests without the owner's explicit OK. Use `webhook:replay`, stubbed `fetch`, or the existing records instead.
- Don't commit `.env*` (except `.env.example`), and never print secret values.
- Don't delete data in MongoDB or Cloudinary without asking.

## Suggested agent workflows

These work in any agent. The slash commands are Claude Code built-ins.

- **Understand the project:** read `README.md`, then `src/lib/schemas.ts` → `src/app/api/transform/route.ts` → `src/lib/jobs.ts` → `src/app/api/webhook/route.ts`. That is the whole async pipeline.
- **Review a change:** `/code-review` for correctness, `/security-review` for the webhook, input validation and secrets, `/simplify` for reuse and over-engineering.
- **Verify UI changes:** run the app and check it at 375 px and desktop widths, in light and dark mode.
- **Before finishing:** `tsc`, `lint`, `build`, `check:logic`, and update the README if behavior or the API changed.
