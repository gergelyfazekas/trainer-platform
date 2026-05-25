# Backend

Server runtime: Next.js App Router API routes (Node.js on Vercel)  
Database: Supabase (PostgreSQL)  
Auth: Supabase Auth  
Storage: Supabase Storage  
Email: Resend  

---

## API Routes

All routes are in `app/api/`. Each is a Next.js Route Handler (`route.ts`).

### `POST /api/bookings`
**File:** `app/api/bookings/route.ts`  
**Auth:** Public (no auth required — visitors don't have accounts)  
**Flow:**
1. Validate request body (trainer_id, visitor_name, visitor_email, visitor_phone, appointment_at, duration_min, notes)
2. Race-condition check: re-fetch availability for the requested slot; reject if already booked
3. Insert into `bookings` table via service client
4. Send confirmation emails via Resend: one to visitor, one to trainer
5. Return `201` with booking ID

### `POST /api/messages`
**File:** `app/api/messages/route.ts`  
**Auth:** Public  
**Flow:**
1. Validate request body (trainer_id, sender_name, sender_email, body)
2. Honeypot check (hidden field must be empty — rejects bots)
3. Insert into `messages` table via service client
4. Send notification email to trainer via Resend (reply-to = sender_email)
5. Return `201`

### `POST /api/stripe/checkout`
**File:** `app/api/stripe/checkout/route.ts`  
**Auth:** Requires authenticated trainer session  
**Flow:**
1. Verify session via `createClient()` (server)
2. Fetch trainer's `stripe_customer_id` from `subscriptions` table (or create Stripe Customer if first time)
3. Create Stripe Checkout Session: mode=subscription, price_id from request body, customer, success/cancel URLs
4. Return checkout session URL → client redirects trainer to Stripe-hosted page

### `POST /api/stripe/portal`
**File:** `app/api/stripe/portal/route.ts`  
**Auth:** Requires authenticated trainer session  
**Flow:**
1. Verify session
2. Fetch `stripe_customer_id` from `subscriptions`
3. Create Stripe Billing Portal session
4. Return portal URL → client redirects trainer

### `POST /api/certificates/notify`
**File:** `app/api/certificates/notify/route.ts`  
**Auth:** Requires authenticated trainer session  
**Flow:**
1. Verify session — returns 401 if unauthenticated
2. Accept `{ certificate_url }` from request body
3. Use service client to update `profiles.certificate_url` and set `certificate_status = 'pending'`
4. Send HTML notification email to `ADMIN_EMAIL` via Resend — includes a link to view the certificate and one-click **Jóváhagyás / Elutasítás** buttons
5. Return `{ ok: true }` — email delivery is best-effort (failure does not roll back the DB update)

### `GET /api/admin/certificate`
**File:** `app/api/admin/certificate/route.ts`  
**Auth:** Token in query param (`?token=ADMIN_SECRET`) — no session required  
**Query params:** `profileId`, `action` (`approve` | `reject`), `token`  
**Flow:**
1. Validate token matches `ADMIN_SECRET` env var; reject with 401 if wrong
2. Update `profiles.certificate_status` to `approved` or `rejected` via service client
3. Return a plain HTML confirmation page (rendered in browser when admin clicks the email link)

### `POST /api/stripe/webhook`
**File:** `app/api/stripe/webhook/route.ts`  
**Auth:** Stripe signature verification (STRIPE_WEBHOOK_SECRET)  
**Handled events:**

| Event | Action |
|---|---|
| `checkout.session.completed` | Create/update `subscriptions` row; set `profiles.is_active = true`; set `profiles.is_featured` based on plan |
| `customer.subscription.updated` | Update `subscriptions` status + plan (derived from price_id); update `is_featured` |
| `customer.subscription.deleted` | Set subscription status = cancelled; set `profiles.is_active = false`, `is_featured = false` |
| `invoice.payment_failed` | Set subscription status = past_due |

Plan derivation: `planFromPriceId(price_id)` in `lib/stripe.ts` maps Stripe price IDs to 'basic' | 'featured'.  
All DB writes in this route use `createServiceClient()` (bypasses RLS — required because webhook has no user session).

---

## Database Schema

### `profiles`
```sql
id uuid PK (= auth.users.id)
full_name text
bio text
city text
county text
latitude float8
longitude float8
business_name text
tax_id text
phone text                        -- added in migration 002
specialties text[]
languages text[]
hourly_rate integer               -- whole HUF
profile_photo text                -- Supabase Storage URL
gallery_photos text[]
gym_ids uuid[]
is_active boolean                 -- set only by webhook
is_featured boolean               -- set only by webhook
certificate_url text              -- added in migration 005; public Storage URL
certificate_status text           -- added in migration 005; none|pending|approved|rejected (default 'none')
avail_weekdays text[]             -- added in migration 004
avail_weekends text[]             -- added in migration 004
created_at timestamptz
updated_at timestamptz            -- auto-updated by trigger
```

### `availability_slots`
```sql
id uuid PK
trainer_id uuid FK → profiles.id
day_of_week integer (0=Monday … 6=Sunday)
start_time time
end_time time
```

### `bookings`
```sql
id uuid PK
trainer_id uuid FK → profiles.id
visitor_name text
visitor_email text
visitor_phone text
appointment_at timestamptz
duration_min integer
notes text
status text                       -- pending | confirmed | cancelled
created_at timestamptz
```

### `messages`
```sql
id uuid PK
trainer_id uuid FK → profiles.id
sender_name text
sender_email text
body text
is_read boolean
created_at timestamptz
```

### `subscriptions`
```sql
id uuid PK
trainer_id uuid FK → profiles.id UNIQUE
stripe_customer_id text
stripe_subscription_id text
stripe_price_id text
plan text                         -- basic | featured (derived from stripe_price_id)
status text                       -- active | past_due | cancelled | trialing
current_period_end timestamptz
```

### `packages`
```sql
id uuid PK
trainer_id uuid FK → profiles.id
name text
description text
price integer                     -- HUF
sessions integer
duration_min integer
is_popular boolean
sort_order integer
created_at timestamptz
```

### `trainer_gym_locations`
```sql
id uuid PK
trainer_id uuid FK → profiles.id
gym_id uuid FK → gyms.id
created_at timestamptz
```

### `gyms`
```sql
id uuid PK
name text
city text
latitude float8
longitude float8
created_at timestamptz
```

---

## Row Level Security Policies

All policies enforced at the PostgreSQL level — not in application code.

### `profiles`
| Operation | Who | Condition |
|---|---|---|
| SELECT | Public | `is_active = true` |
| SELECT | Trainer (own row) | `auth.uid() = id` (always, even if inactive) |
| INSERT | Service role only | Via DB trigger on auth.users insert |
| UPDATE | Trainer (own row) | `auth.uid() = id`; excludes `is_active`, `is_featured` columns |
| UPDATE `is_active`, `is_featured` | Service role only | Webhook only |

### `availability_slots`
| Operation | Who | Condition |
|---|---|---|
| SELECT | Public | Trainer `is_active = true` |
| INSERT/UPDATE/DELETE | Trainer (own rows) | `auth.uid() = trainer_id` |

### `bookings`
| Operation | Who | Condition |
|---|---|---|
| SELECT/UPDATE | Trainer (own rows) | `auth.uid() = trainer_id` |
| INSERT | Public | No auth required (visitors) |

### `messages`
| Operation | Who | Condition |
|---|---|---|
| SELECT/UPDATE | Trainer (own rows) | `auth.uid() = trainer_id` |
| INSERT | Public | No auth required (visitors) |

### `subscriptions`
| Operation | Who | Condition |
|---|---|---|
| SELECT | Trainer (own row) | `auth.uid() = trainer_id` |
| INSERT/UPDATE | Service role only | Webhook only |

### `packages`
| Operation | Who | Condition |
|---|---|---|
| SELECT | Public | All packages readable |
| INSERT/UPDATE/DELETE | Trainer (own rows) | `auth.uid() = trainer_id` |

### `trainer_gym_locations`
| Operation | Who | Condition |
|---|---|---|
| SELECT | Public | All readable |
| INSERT/UPDATE/DELETE | Trainer (own rows) | `auth.uid() = trainer_id` |

---

## Migrations

| File | What it adds |
|---|---|
| `001_initial_schema.sql` | profiles, availability_slots, bookings, messages, subscriptions tables; RLS policies; `updated_at` trigger; auto-create profile trigger on auth.users insert; Storage bucket `trainer-photos` |
| `002_add_phone_to_profiles.sql` | `phone text` column on profiles |
| `003_packages.sql` | `packages` table with RLS; `trainer_gym_locations` + `gyms` tables |
| `004_add_general_availability.sql` | `avail_weekdays text[]` and `avail_weekends text[]` on profiles |
| `005_certificates.sql` | `certificate_url text` and `certificate_status text` on profiles; bucket + RLS setup instructions in comments |

---

## Supabase Clients

| Client | File | When to use |
|---|---|---|
| Browser client | `lib/supabase/client.ts` | Client Components (`use client`) |
| Server client | `lib/supabase/server.ts → createClient()` | Server Components, API routes that need the caller's session |
| Service-role client | `lib/supabase/server.ts → createServiceClient()` | Webhook handler, public form APIs — bypasses RLS |

**Rule:** Never use `createServiceClient()` in routes accessible to end users. Only webhook + background processes.

---

## Email (Resend)

Resend is instantiated lazily (not at module load) to avoid cold-start issues.  
From address: configured via `RESEND_FROM_EMAIL` env var.

**Emails sent:**
- Booking created → visitor confirmation + trainer notification
- Message received → trainer notification (reply-to = visitor email, so trainer can reply from inbox)
- Certificate uploaded → admin notification with approve/reject links (one-click in email, calls `/api/admin/certificate`)

No email templates yet — plain-text or inline HTML. Template polish is a Phase 6 task.

---

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY         # server-only, never expose to client

# Stripe
STRIPE_SECRET_KEY                 # server-only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_BASIC
STRIPE_PRICE_FEATURED

# Resend
RESEND_API_KEY
RESEND_FROM_EMAIL

# Admin (certificate review)
ADMIN_EMAIL                       # receives certificate notification emails
ADMIN_SECRET                      # token validating approve/reject links in /api/admin/certificate
```

**Storage buckets:**
| Bucket | Access | Path pattern | Purpose |
|---|---|---|---|
| `trainer-photos` | Public | `{userId}/profile.{ext}`, `{userId}/gallery/{n}.{ext}` | Profile and gallery photos |
| `trainer-certificates` | Public | `{userId}/certificate.{ext}` | Trainer certificates for review; RLS restricts upload to own folder |

---

## Session & Auth Middleware

**File:** `proxy.ts` (project root) — Next.js 16.2.4 uses `proxy.ts` instead of `middleware.ts`  
**Calls:** `lib/supabase/middleware.ts → updateSession()`

Flow on every request:
1. Refresh Supabase session cookie
2. If request is for `/dashboard/*` and no valid session → redirect to `/auth/login`
3. If valid session → continue to route handler

Matcher config: all routes except static assets and `/_next/`.
