# Security

Design principle: security is handled by tools (Supabase, Stripe), not custom code. The application never builds its own auth, hashing, or access control logic.

---

## What Each Service Handles

| Concern | Handled by | How |
|---|---|---|
| Password hashing | Supabase Auth | bcrypt, never exposed to app code |
| Brute force / rate limiting | Supabase Auth | Built-in, no config needed |
| Session tokens | `@supabase/ssr` | httpOnly cookies (not JS-accessible → XSS protection) |
| Cross-trainer data access | Supabase RLS | SQL policies enforced at DB level |
| Photo access control | Supabase Storage policies | Per-trainer folder policies |
| Credit card data / PCI | Stripe | Level 1 PCI certified; app never sees card numbers |
| Fake webhook events | Stripe SDK | `stripe.webhooks.constructEvent()` verifies HMAC signature |
| SQL injection | Supabase SDK | Parameterized queries; no raw SQL in app code |
| CSRF | Next.js + Supabase | SameSite cookie policy |
| Session refresh | `proxy.ts` + `lib/supabase/middleware.ts` | Refreshes JWT on every request |

---

## Row Level Security (RLS)

RLS is enforced at the PostgreSQL layer — bypassing it requires the service role key, which is only used in the webhook handler. Application code (including malicious requests with a valid user token) cannot access another trainer's data.

### `profiles`
- **Public SELECT:** Only rows where `is_active = true`
- **Own row SELECT:** Trainer always reads own row (even if inactive)
- **UPDATE:** Trainer can update own row; `is_active` and `is_featured` are excluded — only changeable via service role
- **INSERT:** Only via DB trigger (auto-create on auth.users signup)

### `availability_slots`
- **SELECT:** Public — but only for trainers with `is_active = true`
- **INSERT/UPDATE/DELETE:** Trainer owns only their own rows (`auth.uid() = trainer_id`)

### `bookings`
- **SELECT/UPDATE:** Trainer owns only their rows
- **INSERT:** Public (no auth — visitors book without accounts)

### `messages`
- **SELECT/UPDATE:** Trainer owns only their rows
- **INSERT:** Public (no auth — visitors message without accounts)

### `subscriptions`
- **SELECT:** Trainer reads own row only
- **INSERT/UPDATE:** Service role only (webhook handler)

### `packages`
- **SELECT:** Public (all packages readable — shown on trainer profile)
- **INSERT/UPDATE/DELETE:** Trainer owns only their rows

### `trainer_gym_locations`
- **SELECT:** Public
- **INSERT/UPDATE/DELETE:** Trainer owns only their rows

---

## Authentication

### Session Management
- **Cookie:** Supabase session stored in httpOnly cookie via `@supabase/ssr`
- **JS access:** Session token not accessible from JavaScript (XSS protection)
- **Refresh:** `proxy.ts` calls `updateSession()` on every request to keep session alive

### Route Protection
- **File:** `proxy.ts` (project root)
- **Scope:** All `/dashboard/*` routes
- **Behavior:** If no valid session → redirect to `/auth/login`
- **Implementation:** Next.js 16.2.4 convention (`proxy.ts` exports `proxy` function, not `middleware`)

### Dashboard Layout Guard
- `app/dashboard/layout.tsx` also checks for authenticated session server-side
- Double protection: proxy redirects unauthenticated users before page renders

---

## Stripe Webhook Security

Every POST to `/api/stripe/webhook`:
1. Raw request body read (not parsed — required for signature verification)
2. `stripe.webhooks.constructEvent(rawBody, stripeSignatureHeader, STRIPE_WEBHOOK_SECRET)` called
3. If signature invalid → 400 returned immediately, no DB action
4. If valid → event type checked against allowlist of handled events

The `STRIPE_WEBHOOK_SECRET` is rotated automatically when a new webhook endpoint is registered in Stripe Dashboard. Never logged or exposed in responses.

---

## Service Role Key Usage

`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS entirely. It is used in exactly two places:
1. **`app/api/stripe/webhook/route.ts`** — updates `profiles.is_active`, `profiles.is_featured`, and `subscriptions` rows
2. **`app/api/bookings/route.ts`** — inserts bookings on behalf of unauthenticated visitors
3. **`app/api/messages/route.ts`** — inserts messages on behalf of unauthenticated visitors

It is **never** exposed to the client. Never referenced in `lib/supabase/client.ts`. Marked server-only via env var naming convention (`SUPABASE_SERVICE_ROLE_KEY`, not `NEXT_PUBLIC_*`).

---

## Input Validation

### Booking form (`/api/bookings`)
- Required fields: trainer_id, visitor_name, visitor_email, appointment_at, duration_min
- Race-condition check: availability re-validated at insert time
- No rate limiting currently — Phase 6 consideration

### Message form (`/api/messages`)
- Required fields: trainer_id, sender_name, sender_email, body
- **Honeypot field:** Hidden form field must be empty; bots typically fill all fields
- No rate limiting currently — Phase 6 consideration

### Profile editor (`/dashboard/profile`)
- Server-side: Supabase validates types (integer for hourly_rate, text[] for arrays)
- Client-side validation: basic required field checks in form components

---

## What Is NOT Implemented (and why it's OK for v1)

| Item | Status | Reason |
|---|---|---|
| Rate limiting on public APIs | Not done | Low abuse risk at launch scale; add if needed |
| CAPTCHA on booking/message forms | Not done | Honeypot sufficient for v1 |
| Admin moderation / manual approval | Not done | Subscription payment is the gate; Stripe handles fraud |
| Audit logs | Not done | Supabase logs available in dashboard |
| Penetration testing | Not done | Recommended before major scale |
| Content security policy headers | Not done | Phase 6 / Vercel config task |

---

## Environment Variable Security

| Variable | Exposure | Rule |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Safe — anon key + RLS enforce access |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Safe — RLS limits what anon key can do |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Never in client bundle |
| `STRIPE_SECRET_KEY` | Server only | Never in client bundle |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public | Safe — only used for Stripe.js |
| `STRIPE_WEBHOOK_SECRET` | Server only | Never logged or returned in responses |
| `RESEND_API_KEY` | Server only | Never in client bundle |

All server-only vars are accessed only in `app/api/*` route handlers and `lib/supabase/server.ts`. Never imported by files that could end up in the client bundle.
