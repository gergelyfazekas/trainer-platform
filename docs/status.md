# Project Status

**Last updated:** 2026-05-17 (brand rename, lightbox, Maps links, UX cleanup)  
**Project:** Hungarian personal trainer advertising platform (Airbnb-style)  
**Current phase:** Phase 6 — Polish & Launch  

---

## Phase Summary

| Phase | Scope | Status |
|---|---|---|
| 1 — Foundation | Accounts, Next.js + Supabase + Vercel connected, DB schema + RLS, coming-soon page | ✅ Done |
| 2 — Trainer Auth & Profile | Register, login, profile editor, photo upload | ✅ Done |
| 3 — Public Pages | Trainer directory, search/filter, trainer profile page, contact form, message emails | ✅ Done |
| 4 — Availability & Booking | Calendar booking flow, email confirmations | ✅ Done |
| 5 — Stripe Subscriptions | Basic + Featured tiers in HUF, Stripe Tax, webhook → DB sync, featured sort | ✅ Done |
| 6 — Polish & Launch | Mobile responsiveness, SEO, error states, Hungarian copy review, production config | 🔜 In progress |

---

## What's Live and Working (as of 2026-05-17)

### Infrastructure
- Next.js 16.2.4 app running locally (dev server confirmed working)
- Supabase project connected (DB + Auth + Storage)
- Vercel deployment configured
- All environment variables set in `.env.local`

### Auth
- Email/password registration and login
- Google OAuth (callback handler at `/auth/callback`)
- Session management via `proxy.ts` + `lib/supabase/middleware.ts`
- Auto-profile creation trigger on user signup
- Dashboard routes protected (redirect to `/auth/login` if unauthenticated)
- **Forgot password flow** — `/auth/forgot-password` (request email) + `/auth/reset-password` (set new password via Supabase recovery link)
- **Resend confirmation email** button on registration "check email" screen

### Trainer Dashboard (7 pages)
- **Overview** — pending bookings count, unread messages count, subscription status
- **Profile editor** — full_name, bio, city, county, specialties, hourly_rate, languages, phone, profile photo, gallery photos, gym locations; shows "Sikeresen mentve." on save
- **Availability** — weekly slot manager (day + time ranges) + general availability toggles (morning/daytime/evening, weekdays/weekends); shows "Sikeresen mentve." on save
- **Packages** — CRUD service packages (name, description, price, sessions, duration, popular flag); shows "Sikeresen mentve." on save
- **Bookings** — view list, confirm/cancel booking requests
- **Messages** — inbox with is_read toggle, mailto reply links
- **Billing** — current plan/status display, Stripe checkout + portal buttons
- **Mobile responsive** — hamburger menu + overlay drawer on screens < 768px; active nav link highlighted

### Public Pages (5 pages + error handling)
- **Home (`/`)** — hero section, featured trainers, recent trainers
- **Trainer directory (`/trainers`)** — search bar, filter sidebar, list/map toggle, county/city/price/language/availability filters
- **Trainer profile (`/trainers/[id]`)** — full profile view: photos carousel, bio, specialties, packages, gym map, contact card (book/message/phone tabs); dynamic `<title>` + OG metadata per trainer
- **Booking page (`/book/[trainerId]`)** — calendar slot picker, visitor form (name/email/phone/notes), booking submission
- **Coming soon (`/coming-soon`)** — placeholder (no longer primary)
- **404 page (`app/not-found.tsx`)** — branded, links home + trainer directory
- **Error page (`app/error.tsx`)** — branded error boundary with retry button

### API
- `POST /api/bookings` — creates booking, race-condition guard, sends emails via Resend
- `POST /api/messages` — creates message, honeypot spam check, sends trainer notification
- `POST /api/stripe/checkout` — creates Stripe Checkout session; uses `NEXT_PUBLIC_SITE_URL` as fallback if Origin header is absent
- `POST /api/stripe/portal` — creates Stripe Customer Portal session; same origin fallback
- `POST /api/stripe/webhook` — handles subscription lifecycle, syncs `profiles.is_active` + `profiles.is_featured`; returns 500 on DB errors so Stripe retries

### Payments
- Two Stripe prices created in HUF (Basic + Featured)
- Stripe Tax enabled (27% ÁFA auto-applied)
- Webhook handles: `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_failed`
- `profiles.is_active` and `profiles.is_featured` set only by service-role webhook (not editable by trainer)

### Database
- 8 tables: `profiles`, `availability_slots`, `bookings`, `messages`, `subscriptions`, `packages`, `trainer_gym_locations`, `gyms`
- 4 migration files applied
- RLS policies on all tables
- Storage bucket `trainer-photos` with per-trainer folder policies

---

## What Was Implemented in Phase 6 (2026-05-17)

- ✅ Stripe webhook: try/catch around all DB writes → returns 500 on failure so Stripe retries
- ✅ `next.config.ts`: Supabase Storage image domains added (`remotePatterns`)
- ✅ Stripe checkout/portal: `NEXT_PUBLIC_SITE_URL` env var fallback when Origin header missing
- ✅ Forgot password: `/auth/forgot-password` + `/auth/reset-password` pages
- ✅ Resend confirmation email button on registration screen
- ✅ Dashboard mobile: hamburger menu + overlay drawer; sidebar hidden on mobile
- ✅ Dashboard saves: "Sikeresen mentve." success message on profile, availability, packages
- ✅ 404 page (`app/not-found.tsx`) — branded Hungarian page
- ✅ Error boundary (`app/error.tsx`) — retry button, links home
- ✅ `generateMetadata()` on `/trainers/[id]` — dynamic title, description, OG image per trainer

---

## What Was Implemented (2026-05-25) — Pre-launch fixes

### Security
- ✅ **HTML injection fixed** — `escapeHtml()` applied to all user-supplied strings in Resend email bodies (`/api/bookings`, `/api/messages`, `/dashboard/bookings` server action)
- ✅ **Rate limiting** on public API endpoints — `lib/rate-limit.ts` (5 req/min/IP, module-level Map); applied to `POST /api/bookings` and `POST /api/messages`
- ✅ **PostgREST filter injection fixed** — search `q` param stripped of injection chars (`(){}"'\`` etc.); `availDays`/`availTimes` validated against whitelist set before being used in raw filter strings

### SEO
- ✅ `generateMetadata` + Open Graph tags added to home page (`/`)
- ✅ `generateMetadata` + Open Graph tags added to trainer directory (`/trainers`)
- ✅ `app/robots.ts` — allows all crawlers, points to sitemap
- ✅ `app/sitemap.ts` — dynamic, includes `/`, `/trainers`, `/aszf`, all active trainer profile pages
- ✅ JSON-LD `Person` structured data injected on `/trainers/[id]` (name, description, jobTitle, address, knowsAbout)

### Performance
- ✅ All `<img>` tags replaced with Next.js `<Image>` throughout: `trainer-card.tsx` (both variants), `/trainers/[id]` profile photo, `/dashboard/profile` preview + gallery thumbnails
- ✅ `fill` + correct `sizes` props set on all card/gallery images

### Legal & UX
- ✅ **ÁSZF page** created at `app/aszf/page.tsx` — Hungarian placeholder with 7 sections (service description, subscription terms, cancellation, visitor rights, GDPR, liability, contact)
- ✅ **Footer links fixed** — ÁSZF → `/aszf`, Kapcsolat → `mailto:info@foglaljedzot.hu`, Rólunk → `/rolunk` (all now real links, not dead text)
- ✅ **Mobile filter sidebar** — `components/mobile-filter-toggle.tsx` wraps FilterSidebar; toggle button shown on mobile (hidden on `md:`); trainers page layout changed to `flex-col md:flex-row`
- ✅ **Gallery photo cap enforced** — Basic: 5 photos, Featured: 15 photos; enforced silently at save, limit shown in edit UI ("Max. X fotó")
- ✅ **Booking status notification email** — trainer confirm/cancel server action now sends Resend email to visitor

---

## What Was Implemented After Phase 6 (2026-05-17, continued)

### Hero & Visual Design
- ✅ Hero redesigned: warm cream `#FAF8F3` background, radial amber glow + coral blob, eyebrow pill, social proof row
- ✅ Primary accent color changed from blue `#3B82F6` to terracotta `#D05A2E` site-wide (`--th-accent`)
- ✅ Navbar: `variant` prop added (`light` | `dark`); light variant adds soft shadow to separate from hero
- ✅ Hero vertically compacted (reduced padding + font sizes) so first row of trainer cards is visible on landing

### Certificate Verification Feature
- ✅ DB: `certificate_url` and `certificate_status` columns added to `profiles` (migration 005)
- ✅ `types/database.ts` updated with new columns
- ✅ `CertificateUpload` component: JPG/PNG/PDF upload to `trainer-certificates` Storage bucket
- ✅ `POST /api/certificates/notify`: sets status to `pending`, emails admin with approve/reject links
- ✅ `GET /api/admin/certificate`: token-validated approve/reject endpoint (one-click from email)
- ✅ "Ellenőrzött" badge on `TrainerCard` (white pill top-right of photo on full card; green checkmark on compact)
- ✅ "Ellenőrzött edző" emerald badge on trainer profile page (conditional on `certificate_status = 'approved'`)
- ✅ `ADMIN_EMAIL` + `ADMIN_SECRET` env vars added to `.env.local.example`

**Setup still required before using:** run migration 005 on Supabase, create `trainer-certificates` storage bucket (public), add upload/update RLS policies per migration comments, set `ADMIN_EMAIL` and `ADMIN_SECRET` in `.env.local`.

---

## What Was Fixed (2026-05-25) — Vercel deployment

### Hosting
- ✅ **Site live at `https://foglaljedzot.hu`** — full Next.js app serving all 28 routes
- ✅ **Framework Preset fixed** — was `null` (Vercel used `@vercel/static-build` → no server functions → all routes 404); changed to **Next.js** in Vercel dashboard → now uses `@vercel/next` correctly
- ✅ **Env vars updated** — all 13 vars had been stored as empty strings in Vercel; re-added with correct values via CLI (`vercel env rm` + `vercel env add` for each)
- ✅ **Trailing newlines stripped** — `STRIPE_PRICE_BASIC` and `STRIPE_WEBHOOK_SECRET` had trailing newlines in `.env.local`; Vercel CLI strips them on add (`> Removed trailing newline from stdin input`)
- ✅ **SSL cert auto-provisioned** by Vercel (Let's Encrypt, issued 2026-05-25)
- ✅ **Custom domain aliased** — `project-ys29k.vercel.app` redirects to `foglaljedzot.hu` (Vercel canonical domain behavior)
- ✅ **Deployment Protection** — direct `.vercel.app` URLs require Vercel SSO (401); custom domain `foglaljedzot.hu` is public — this is expected Vercel behavior

### Deployment notes
- `proxy.ts` (Next.js 16 middleware) compiles correctly with Turbopack; the Webpack-only rename (`proxy.js` → `middleware.js`) is skipped but Turbopack outputs `middleware.js` directly — no action needed
- `functions-config-manifest.json` correctly registers `/_middleware` with Node.js runtime
- When `framework: null` in Vercel project settings, `@vercel/static-build` is used and produces no `functions/` directory → every route returns `x-vercel-error: NOT_FOUND`

---

## What Was Implemented (2026-05-17, continued — brand + UX)

### Brand Identity
- ✅ Platform renamed from "TrainerHub" to **"foglalj edzőt"** — domain is `foglaljedzot.hu`
- ✅ New `BrandLogo` component (`components/brand-logo.tsx`): typographic logo, "foglalj" medium weight + "edzőt" bold terracotta, used site-wide (navbar, dashboard, auth pages, booking view, error pages)
- ✅ `app/layout.tsx` title updated to "foglalj edzőt – Személyi edzők Magyarországon"
- ✅ User-Agent strings in map components updated to `foglaljedzot/1.0`

### Trainer Profile UX
- ✅ **Gallery lightbox** — clicking any photo in `GalleryCarousel` opens fullscreen lightbox overlay: `bg-black/92`, keyboard navigation (←/→/Escape), photo counter, close button, scroll-locked body; implemented without external libraries
- ✅ **Gym address → Google Maps** — addresses under "Edzés helyszínei" are `<a>` tags linking to `https://www.google.com/maps/search/?api=1&query={address}` (opens in new tab)
- ✅ Removed "Jelents, ha valami nem stimmel ezzel a profillal" report link from trainer profile sidebar

---

## What's Still Needed (Phase 6 remainder)

See `launch-checklist.md` for task-level detail.

- [ ] `/rolunk` (About us) page — footer link exists, page not yet created
- [ ] Mobile responsiveness audit: public pages (home, directory, profile, booking, auth)
- [ ] Loading states / skeletons
- [ ] Hungarian copy review (all `messages/hu.ts` strings with native speaker)
- [ ] Production config: live Stripe keys, Resend domain verification
- [ ] End-to-end testing in Stripe test mode (all webhook events)
- [ ] Accessibility audit (keyboard nav, ARIA labels, contrast)
- [x] Domain setup on Vercel ✅ — `foglaljedzot.hu` live, SSL cert provisioned, all env vars set
- [x] Run Supabase migration 005 (`certificate_url`, `certificate_status` columns on profiles) ✅ — still need to create `trainer-certificates` storage bucket manually in Supabase dashboard with RLS policies (see migration file comments)

---

## Known Issues / Notes

- Supabase project pauses after 1 week of inactivity on free tier — wake it up before testing
- Next.js 16.2.4 uses `proxy.ts` instead of `middleware.ts` (breaking change from Next.js 14)
- `avail_weekdays` / `avail_weekends` columns in migration 004 are arrays, not booleans — verify filter logic matches schema
- **Vercel Framework Preset must be set to "Next.js"** — if left as null/Other, Vercel uses `@vercel/static-build` which produces no server functions and every route returns 404
- **Vercel env vars via CLI store correctly but pull as empty** — `vercel env pull` shows values as `""` even when set; `vercel env ls` shows them as "Encrypted" (non-empty); use `vercel env rm` + `vercel env add` (piping value to stdin) to update
- **Direct `.vercel.app` URLs require Vercel SSO** (return 401) — this is Deployment Protection on preview URLs; the custom domain `foglaljedzot.hu` is publicly accessible
