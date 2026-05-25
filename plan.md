# Personal Trainer Advertising Platform

## Context
Build a new website where personal trainers (based in Hungary) pay a monthly subscription to advertise their profiles. End users (potential clients) browse and book trainers for free. The platform is Airbnb-style: searchable but not search-gated. The owner is non-technical, so security must be handled by the tools themselves, not custom code.

**Market:** Hungary only for v1. All UI copy is in Hungarian. Currency is HUF. Time zone is `Europe/Budapest` (hardcoded, no multi-TZ logic). Hungarian VAT (ÁFA, 27%) applies to trainer subscriptions — handled automatically via Stripe Tax.

**Subscription tiers:** two plans — **Basic** (listed, bookable, messageable) and **Featured** (everything in Basic + boosted placement in search, "Kiemelt" badge, larger photo gallery).

---

## Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Framework | **Next.js 14** (App Router, TypeScript) | One framework for frontend + backend API; no separate server |
| UI | **Tailwind CSS + shadcn/ui** | Full pixel-level customization; you own every component |
| Database + Auth + Storage | **Supabase** | Handles all security: RLS, password hashing, sessions, file access |
| Payments | **Stripe** | Handles PCI compliance; you never touch card numbers |
| Calendar | **FullCalendar** (React wrapper) | Drag-to-create availability, time zone support, booking display |
| Email | **Resend** | Booking confirmations + message notifications; free tier |
| Hosting | **Vercel** | Zero-config Next.js deployment; free tier at launch |
| i18n | **Hardcoded Hungarian strings** in a `messages/hu.ts` module | No i18n library needed for v1; swap in `next-intl` later if expanding to other languages |
| Tax | **Stripe Tax** (enabled on subscription prices) | Calculates and collects Hungarian ÁFA (27%) automatically; generates compliant invoices |

**Infrastructure cost at launch: $0** (pay only Stripe fees on trainer subscriptions — ~1.5% for EU cards via Stripe, plus Stripe Tax's per-transaction fee).

---

## Database Schema

### Tables

**`profiles`** — One per trainer
```
id uuid PK (= auth.users.id)
full_name, bio, city, county, latitude, longitude
business_name text, tax_id text            ← required for VAT invoicing
specialties text[]
hourly_rate integer (whole HUF forints — HUF has no minor unit in practice)
profile_photo text (Storage URL)
gallery_photos text[]                      ← max length depends on plan (see `is_featured`)
is_active boolean    ← controlled only by Stripe webhook
is_featured boolean  ← true when active subscription.plan = 'featured'; controlled only by webhook
created_at, updated_at
```

**`availability_slots`** — Recurring weekly template
```
id uuid PK
trainer_id FK → profiles.id
day_of_week integer (0–6)
start_time time, end_time time
```

**`bookings`** — Visitor appointment requests
```
id uuid PK
trainer_id FK → profiles.id
visitor_name, visitor_email, visitor_phone
appointment_at timestamptz
duration_min integer
notes text
status text (pending | confirmed | cancelled)
```

**`messages`** — Visitor-to-trainer contact
```
id uuid PK
trainer_id FK → profiles.id
sender_name, sender_email, body
is_read boolean
created_at
```

**`subscriptions`** — Mirror of Stripe state
```
id uuid PK
trainer_id FK → profiles.id UNIQUE
stripe_customer_id, stripe_subscription_id, stripe_price_id
plan text (basic | featured)                     ← derived from stripe_price_id by webhook
status text (active | past_due | cancelled | trialing)
current_period_end timestamptz
```

### Row Level Security (enforced at DB level — not in app code)
- `profiles` SELECT: anyone reads `is_active=true` rows; trainers always read own row
- `profiles` UPDATE: trainers update only their own row; `is_active` and `is_featured` only changeable via service role (webhook)
- `availability_slots`, `bookings`, `messages`: trainers read/write only their own rows
- `bookings` + `messages` INSERT: public (no auth needed — visitors don't have accounts)
- `subscriptions`: read own row only; INSERT/UPDATE via service role (Stripe webhook) only

---

## Route Structure

### Public
| Route | Purpose |
|---|---|
| `/` | Landing: hero + search bar + browseable trainer cards |
| `/trainers` | Search results with filters |
| `/trainers/[id]` | Trainer profile: photos, bio, contact form, book button |
| `/book/[trainerId]` | Booking calendar + booking form |
| `/auth/login`, `/auth/register` | Trainer auth pages |

### Protected (trainers only — middleware enforces)
| Route | Purpose |
|---|---|
| `/dashboard` | Overview: bookings, messages, subscription status |
| `/dashboard/profile` | Edit bio, photos, specialties, rates |
| `/dashboard/availability` | Set recurring weekly available slots |
| `/dashboard/bookings` | View/manage booking requests |
| `/dashboard/messages` | Inbox of visitor messages |
| `/dashboard/billing` | Stripe subscription management |

### API Routes (server-side only)
| Route | Trigger |
|---|---|
| `/api/stripe/checkout` | Trainer subscribes |
| `/api/stripe/portal` | Trainer manages billing |
| `/api/stripe/webhook` | Stripe events → sync DB state |
| `/api/bookings` | Public booking form submit |
| `/api/messages` | Public contact form submit |

---

## Key Flows

### Auth Flow (Supabase handles everything)
1. Trainer registers → Supabase hashes password, sends confirmation email
2. DB trigger auto-creates empty `profiles` row
3. Login → JWT in httpOnly cookie (not JS-accessible → XSS protection)
4. `middleware.ts` refreshes session on every request + redirects unauthenticated users away from `/dashboard/*`

### Stripe Subscription Flow
1. In Stripe dashboard, create two recurring Prices in HUF (e.g. `price_basic_huf`, `price_featured_huf`) with Stripe Tax enabled
2. Trainer picks a tier → `/api/stripe/checkout` creates a Stripe Checkout session with the chosen `price_id` (server-side, secret key never exposed)
3. Trainer pays on Stripe's hosted page (you never see card data). Checkout collects Hungarian billing address + tax ID (for ÁFA-compliant invoice)
4. Stripe calls `/api/stripe/webhook` → handler verifies signature, updates `subscriptions` table (including `plan` derived from `price_id`), sets `profiles.is_active` and `profiles.is_featured` accordingly
5. Trainer manages billing + plan changes via Stripe Customer Portal (Stripe provides the UI, including plan switching between Basic ↔ Featured)

Key webhook events: `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_failed/succeeded`. On `subscription.updated`, re-derive `plan` from the new `price_id` so upgrades/downgrades flow through automatically.

### Booking Flow
1. Public booking page fetches `availability_slots` + existing `bookings` → generates available time slots
2. Visitor clicks slot → modal with name/email/phone/notes
3. POST to `/api/bookings` → re-validates slot availability (race condition check) → inserts booking → sends emails via Resend
4. Trainer confirms/cancels from dashboard

### Messaging Flow
1. Contact form on trainer profile → POST to `/api/messages`
2. API validates input + honeypot check → inserts message + emails trainer via Resend (reply-to = visitor email)
3. Trainer replies directly from email; dashboard inbox shows message history

---

## Project Folder Structure

```
trainer-platform/
├── app/
│   ├── coming-soon/page.tsx          # Placeholder page shown until launch
│   ├── page.tsx                      # Landing page (built in Phase 3)
│   ├── trainers/[id]/page.tsx        # Trainer profile
│   ├── book/[trainerId]/page.tsx     # Booking calendar
│   ├── auth/{login,register}/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx                # ← Auth guard lives here
│   │   ├── profile, availability, bookings, messages, billing
│   └── api/stripe/{checkout,portal,webhook}, bookings, messages
├── components/
│   ├── ui/                           # shadcn/ui components
│   ├── trainer-card.tsx
│   ├── search-bar.tsx
│   ├── booking-calendar.tsx          # Public FullCalendar
│   ├── availability-editor.tsx       # Dashboard FullCalendar
│   ├── message-form.tsx
│   └── photo-upload.tsx              # Direct-to-Supabase-Storage
├── lib/supabase/{client,server,middleware}.ts
├── lib/stripe.ts
├── middleware.ts                      # ← Session refresh + route protection
├── supabase/migrations/001_initial_schema.sql
└── types/database.ts                  # Generated from Supabase schema
```

---

## Localization (Hungary)

| Concern | Approach |
|---|---|
| UI language | All strings in `messages/hu.ts`; rendered with `<html lang="hu">` |
| Currency display | HUF, formatted as `12 000 Ft` (space thousands separator, "Ft" suffix) via `Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF' })` |
| Dates/times | Rendered via `Intl.DateTimeFormat('hu-HU', { timeZone: 'Europe/Budapest' })` |
| Time zone | Stored as `timestamptz` in DB; always displayed in `Europe/Budapest`. DST handled by `Intl` |
| Search/location | Trainer profiles filter by Hungarian counties (megye) and major cities |
| Tax | Stripe Tax enabled → 27% ÁFA auto-applied to subscription invoices; trainer tax ID captured at Checkout |
| Featured tier UI | "Kiemelt" badge on cards; featured trainers sort first in search results |

---

## Search Ranking (Featured vs. Basic)

Search results are ordered by:
1. `is_featured DESC` (featured trainers first)
2. Then by relevance (distance, specialty match, etc.)

This is the core monetization hook for the Featured tier. Keep it simple — no bidding or dynamic pricing.

---

## Security — What You Never Have to Build

| Concern | Handled By |
|---|---|
| Password hashing | Supabase Auth (bcrypt) |
| Brute force protection | Supabase Auth (built-in rate limiting) |
| Session tokens | `@supabase/ssr` (httpOnly cookies) |
| Cross-trainer data access | Supabase RLS (SQL policies in DB) |
| Photo access control | Supabase Storage policies |
| Credit card data / PCI | Stripe (Level 1 certified) |
| Fake webhook events | Stripe SDK signature verification |
| SQL injection | Supabase SDK (parameterized queries) |

---

## Phased Implementation

| Phase | Weeks | Deliverable | Status |
|---|---|---|---|
| 1 — Foundation | 1–2 | Accounts set up, Next.js + Supabase + Vercel connected, DB schema + RLS live, coming soon page deployed | ✅ Done |
| 2 — Trainer Auth & Profile | 3–4 | Trainers can register, log in, build profile, upload photos | ✅ Done |
| 3 — Public Pages | 5–6 | Visitors browse/search trainers, send messages, trainers get email alerts | ✅ Done |
| 4 — Availability & Booking | 7–8 | Full calendar booking flow, email confirmations | ✅ Done |
| 5 — Stripe Subscriptions | 9–10 | Both tiers (Basic + Featured) live in Stripe, HUF pricing, Stripe Tax on, webhook updates `is_active` + `is_featured`, featured trainers sort first | ✅ Done |
| 6 — Polish & Launch | 11–12 | Mobile responsive, SEO, error states, Hungarian copy review, production mode on all services | 🔜 In progress |

**Current status (as of 2026-05-25):** Phases 1–5 complete. Phase 6 (Polish & Launch) in progress. Security fixes (HTML injection, rate limiting, PostgREST injection), full SEO layer (metadata, robots, sitemap, JSON-LD), `<Image>` migration, mobile filter sidebar, ÁSZF page, gallery cap, and booking status emails all done. Remaining blockers: `/rolunk` page, live Stripe/Resend config, mobile audit, accessibility audit, E2E test run. See `docs/status.md` for full log.

---

## Services to Create Accounts On (before writing code)
1. [GitHub](https://github.com) — code storage (free)
2. [Supabase](https://supabase.com) — database/auth/storage (free tier)
3. [Vercel](https://vercel.com) — hosting (free tier)
4. [Stripe](https://stripe.com) — payments (no monthly fee)
5. [Resend](https://resend.com) — email (free tier: 3,000 emails/mo)

---

## Framework Notes (Next.js 16.2.4 differences from plan)

This project uses **Next.js 16.2.4** which has breaking changes vs 14:
- `middleware.ts` is **deprecated** — use `proxy.ts` instead (already in place at project root)
- `proxy.ts` exports a `proxy` function (not `middleware`) with the same `config` matcher shape

## Schema Additions (beyond original plan)

Migrations 003 and 004 added tables/columns not in the original plan:
- `packages` table — trainer can create training packages with pricing (CRUD + reorder in dashboard)
- `trainer_gym_locations` + `gyms` tables — trainers can add gym location pins
- `profiles` extended with: `languages text[]`, `gym_ids uuid[]`, `general_availability_weekdays bool`, `general_availability_weekends bool`, `general_availability_morning/daytime/evening bool`

## Critical Files (must be correct before anything else works)
- `proxy.ts` — session handling + route protection for all `/dashboard` routes (Next.js 16 convention)
- `lib/supabase/middleware.ts` — the actual auth logic called by proxy.ts
- `lib/supabase/server.ts` — server-side Supabase client used by all API routes
- `supabase/migrations/001_initial_schema.sql` — base tables + RLS policies
- `supabase/migrations/003_packages.sql` — packages table
- `supabase/migrations/004_add_general_availability.sql` — general availability fields
- `app/api/stripe/webhook/route.ts` — subscription state sync with DB
- `app/dashboard/layout.tsx` — auth guard wrapper for all dashboard pages

---

## Verification Plan
1. Register as a trainer → confirm email → check `profiles` row auto-created in Supabase
2. Upload photo → verify it appears in Supabase Storage under `trainer-photos/{user_id}/`
3. Set availability → verify rows in `availability_slots` table
4. As a visitor, book a slot → verify booking row created, both parties receive emails
5. Attempt to access another trainer's dashboard data via direct API call → confirm RLS blocks it (returns empty or 403)
6. Subscribe to **Basic** via Stripe test mode → verify `subscriptions` row created with `plan='basic'`, `profiles.is_active = true`, `is_featured = false`
7. Upgrade to **Featured** in Stripe Customer Portal → verify webhook flips `plan='featured'` and `is_featured=true`; confirm profile now sorts first in search and shows "Kiemelt" badge
8. Cancel subscription in Stripe → verify `is_active = false`, profile disappears from public search
9. Verify Stripe invoice PDF shows 27% ÁFA line and trainer's tax ID
10. Use Stripe CLI (`stripe listen`) to replay all webhook event types and confirm DB state updates correctly
