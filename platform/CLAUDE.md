@AGENTS.md

# TrainerHub — Personal Trainer Advertising Platform

## What This Is

A Hungarian personal trainer directory (Airbnb-style). Trainers pay a monthly Stripe subscription to be listed; visitors browse and book for free. Two subscription tiers: **Basic** (listed + bookable) and **Featured** ("Kiemelt" badge, boosted placement).

Hungary-only v1: all UI copy is Hungarian, currency is HUF, timezone is `Europe/Budapest`, VAT is 27% ÁFA (handled by Stripe Tax).

## Tech Stack

- **Framework:** Next.js 16.2.4 (App Router, TypeScript) — note: uses `proxy.ts` not `middleware.ts`
- **DB / Auth / Storage:** Supabase (RLS enforced at DB level — don't reimplement security in app code)
- **Payments:** Stripe (subscriptions, Checkout, Customer Portal, webhooks)
- **Email:** Resend (booking confirmations, message notifications)
- **UI:** Tailwind CSS + shadcn/ui (`components/ui/`)
- **Maps:** Leaflet (trainer locations, gym pins)
- **Hosting:** Vercel

## Project Status (as of 2026-05-25)

**Phases 1–6 complete. Live at https://foglaljedzot.hu in preprod (coming-soon) mode.**

Built and working:
- Auth: email + Google OAuth, onboarding flow, session management via `proxy.ts` → `lib/supabase/middleware.ts`
- Dashboard (7 pages + preview link): profile, availability, packages, bookings, messages, billing, overview
- Public pages: home (`/`), trainer search (`/trainers`), trainer profile (`/trainers/[id]`), booking (`/book/[trainerId]`)
- Stripe: checkout, customer portal, webhook (handles `checkout.session.completed`, `subscription.updated/deleted`, `invoice.payment_failed`)
- Public APIs: `/api/bookings` (race-condition safe), `/api/messages` (honeypot spam check), both send Resend emails
- 126-key Hungarian translation file at `messages/hu.ts`
- Preprod/coming-soon mode (see `PREPROD` env var below)

Remaining before full launch:
- `/rolunk` page (About us) — dead link in footer
- Run Supabase migration 005 + create `trainer-certificates` storage bucket manually
- Switch to live Stripe keys + register live webhook on Vercel
- Resend domain verification for `foglaljedzot.hu`
- Remove `PREPROD=true` from Vercel env vars when 5–10 trainers are onboarded

## Key Conventions

**Route protection:** `proxy.ts` (project root) calls `updateSession` from `lib/supabase/middleware.ts`, which redirects unauthenticated users from `/dashboard/*` to `/auth/login`. Don't add separate auth checks in page components — the proxy + `app/dashboard/layout.tsx` guard covers it.

**Preprod mode:** When `PREPROD=true`, the middleware also blocks `/trainers`, `/book/*`, and all other public routes. Unauthenticated visitors see the coming-soon page at `/`; logged-in trainers are redirected to `/preview` (but can still access `/trainers/[id]` to inspect their own profile). Remove `PREPROD` from Vercel env vars to go live — no code changes needed.

**Supabase clients:**
- `lib/supabase/client.ts` — browser (Client Components)
- `lib/supabase/server.ts` — server (Server Components, API routes) — also exports a service-role client for operations that bypass RLS (webhook, public form APIs)

**Stripe + Resend:** Must be instantiated lazily (inside request handlers), not at module top-level — avoids build failures when env vars aren't set.

**Currency:** Store as whole HUF integers. Display with `Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF' })`.

**Dates:** Store as `timestamptz`. Always render in `Europe/Budapest` via `Intl.DateTimeFormat`.

**`is_active` / `is_featured` on profiles:** Only the Stripe webhook (service role) may write these. App code never sets them directly. The `/trainers/[id]` page does NOT filter by `is_active` at the app level — RLS handles visibility (anon users only see active profiles; trainers can always read their own row).

## Database Schema (8 tables)

`profiles`, `availability_slots`, `bookings`, `messages`, `subscriptions`, `packages`, `trainer_gym_locations`, `gyms`

Full typed schema in `types/database.ts`. Migrations in `supabase/migrations/` (001–005).

RLS is the security layer — all policies are in the migration SQL files. Never disable RLS to work around a permission issue; fix the policy instead.

## Environment Variables

See `.env.local.example` for the full list. Key vars:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, bypasses RLS (webhook + public APIs)
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_BASIC_PRICE_ID` / `STRIPE_FEATURED_PRICE_ID` — created in Stripe dashboard (HUF, Stripe Tax enabled)
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL`
- `PREPROD` — set to `"true"` for coming-soon mode; remove or set to `"false"` to go live

## Supabase Project

Project URL hostname: `dlvzrjnosgqcrulstwun.supabase.co`
Free tier — **will pause after ~1 week of inactivity**. If the site hangs on load, go to supabase.com/dashboard and restore the project first.
