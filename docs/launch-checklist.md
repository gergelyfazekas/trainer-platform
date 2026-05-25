# Launch Checklist — Phase 6

Status: 🔜 In progress (as of 2026-05-17) — pre-launch fixes implemented, remaining items below

Mark items with [x] as completed.

---

## Mobile Responsiveness

- [ ] Home page (`/`): hero, trainer cards, search bar at 375px / 414px / 768px
- [x] Trainer directory (`/trainers`): filter sidebar collapses to toggle drawer on mobile (`MobileFilterToggle` component) ✅
- [ ] Trainer profile (`/trainers/[id]`): gallery carousel, booking card → becomes MobileBar, gym map
- [ ] Booking page (`/book/[trainerId]`): calendar slot picker, visitor form modal
- [ ] Auth pages (`/auth/login`, `/auth/register`): form layout
- [x] Dashboard: sidebar → hamburger menu + overlay drawer on mobile ✅
- [ ] Dashboard profile editor: all form fields, photo upload
- [ ] Dashboard availability: slot grid
- [ ] Dashboard packages: CRUD form
- [ ] Dashboard bookings/messages: tables on narrow screens

---

## SEO

- [x] Add `generateMetadata()` to home page (`/`) — title, description, OG image ✅
- [x] Add `generateMetadata()` to trainer directory (`/trainers`) ✅
- [x] Add `generateMetadata()` to trainer profile pages (`/trainers/[id]`) — trainer name, bio, city, OG image ✅
- [ ] OG image for trainer profiles (trainer photo + name overlay, or static fallback)
- [ ] Add `<link rel="canonical">` tags
- [x] Add `robots.txt` (`app/robots.ts`) ✅
- [x] Add `sitemap.xml` (`app/sitemap.ts` — includes all active trainer profiles) ✅
- [x] JSON-LD structured data on trainer profiles (`Person` schema with name, description, address, specialties) ✅
- [x] Verify `<html lang="hu">` is set in root layout ✅
- [x] Add `<meta name="description">` fallback in root layout ✅ (already in `app/layout.tsx` metadata)

---

## Error States & Loading

- [ ] Loading skeleton for trainer card list (`/trainers`)
- [ ] Loading skeleton for trainer profile page
- [ ] Loading state for booking calendar slot generation
- [ ] Error boundary on trainer profile (if trainer not found or inactive → 404)
- [ ] Error boundary on booking page (if trainer not found)
- [ ] Form submission error messages: booking form, message form, profile save
- [x] 404 page (`app/not-found.tsx`) — styled, Hungarian copy, links home + trainer directory ✅
- [x] 500 / error page (`app/error.tsx`) — generic error with retry button + link home ✅

---

## UX Polish

- [ ] Empty state on `/dashboard/bookings` ("Még nincs foglalásod")
- [ ] Empty state on `/dashboard/messages` ("Még nincs üzeneted")
- [ ] Empty state on `/trainers` when no results match filters
- [ ] Onboarding hint for new trainers with no subscription (prompt to subscribe)
- [x] "Forgot password" link on `/auth/login` → `/auth/forgot-password` → `/auth/reset-password` flow ✅
- [x] Booking confirmation: notify visitor when trainer confirms/cancels (email via Resend) ✅
- [x] Trainer profile: gallery photo count enforced by plan (5 for Basic, 15 for Featured) — enforced at save, shown in edit UI ✅
- [x] Success message on dashboard save actions (profile, availability, packages) ✅

---

## Hungarian Copy Review

- [ ] Review all strings in `messages/hu.ts` with a native speaker
- [ ] Check for informal/formal register consistency (te vs. Ön)
- [ ] Verify subscription plan names and feature descriptions are marketing-appropriate
- [ ] Check error messages for naturalness
- [ ] Review email templates (booking confirmation, message notification)
- [ ] Review coming-soon page (if still in use)

---

## Performance

- [x] Replace all `<img>` tags with Next.js `<Image>` component (`trainer-card.tsx`, `/trainers/[id]`, `/dashboard/profile`) ✅
- [x] Verify Supabase Storage images served via CDN (they are by default) ✅
- [ ] Check Lighthouse score on key pages (target: >90 performance on desktop)
- [ ] Lazy-load Leaflet maps (already using `dynamic({ ssr: false })` — verify)
- [ ] Profile photo and gallery: add blur placeholder while loading

---

## Accessibility

- [ ] Keyboard navigation: test tab order on all forms and interactive elements
- [ ] ARIA labels on icon-only buttons (e.g. close, delete, toggle)
- [ ] Color contrast: verify text on primary color meets WCAG AA (4.5:1 ratio)
- [ ] Focus visible styles on all interactive elements
- [ ] Screen reader test on booking form and message form

---

## Production Configuration

### Supabase
- [ ] Confirm project is on a paid plan or will be woken up before launch (free tier pauses after 1 week inactive)
- [ ] Set `auth.email.confirm_email_change = true` in Supabase Auth settings
- [ ] Set custom SMTP for Supabase auth emails (confirm, password reset) — or use Supabase's SMTP
- [ ] Verify storage bucket `trainer-photos` policies are correct in production

### Stripe
- [ ] Switch to live Stripe keys in Vercel env vars (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
- [ ] Register live webhook endpoint in Stripe Dashboard → Webhooks
- [ ] Set `STRIPE_WEBHOOK_SECRET` to live webhook secret
- [ ] Confirm `STRIPE_PRICE_BASIC` and `STRIPE_PRICE_FEATURED` are live price IDs
- [ ] Verify Stripe Tax enabled on live prices
- [ ] Run one real test transaction and confirm invoice has ÁFA + tax ID

### Vercel
- [ ] Set all environment variables in Vercel project settings (not just `.env.local`)
- [ ] Set `NEXT_PUBLIC_SITE_URL` for Stripe success/cancel URLs (fallback when Origin header missing) — added to `.env.local.example`
- [ ] Configure custom domain
- [ ] Enable Vercel Analytics (optional, free tier)

### Resend
- [ ] Verify domain for `RESEND_FROM_EMAIL` sender address (DNS records)
- [ ] Test booking confirmation email end-to-end
- [ ] Test message notification email end-to-end

---

## End-to-End Testing (before go-live)

- [ ] Register as a trainer → confirm email → verify `profiles` row auto-created
- [ ] Upload profile photo → verify in Supabase Storage under `trainer-photos/{user_id}/`
- [ ] Set availability → verify rows in `availability_slots`
- [ ] As a visitor, book a slot → verify booking row created, both parties receive emails
- [ ] Attempt to access another trainer's dashboard data via direct API call → confirm RLS blocks it
- [ ] Subscribe to Basic (Stripe test mode) → verify `is_active = true`, `is_featured = false`
- [ ] Upgrade to Featured in portal → verify `is_featured = true`, badge shows, sorts first
- [ ] Cancel subscription → verify `is_active = false`, profile hidden from search
- [ ] Verify Stripe invoice PDF shows 27% ÁFA and trainer's tax ID
- [ ] Use `stripe listen` to replay all webhook event types → confirm DB state correct
- [ ] Test "forgot password" flow — pages implemented, needs E2E test with real email
- [ ] Test Google OAuth flow

---

## Security

- [x] Rate limiting on public APIs (`/api/bookings`, `/api/messages`) — 5 req/min/IP via `lib/rate-limit.ts` ✅
- [x] HTML injection protection in Resend email bodies — `escapeHtml()` applied to all user-supplied strings ✅
- [x] PostgREST filter injection fix — search `q` sanitized, `availDays`/`availTimes` whitelist-validated ✅
- [ ] CAPTCHA or stronger bot protection (current: honeypot + rate limit)
- [ ] Content Security Policy headers (Vercel config)

---

## Go-Live

- [x] ÁSZF (Terms of Service) page at `/aszf` ✅
- [ ] `/rolunk` (About us) page — footer link exists, page not created yet
- [ ] Remove or redirect `/coming-soon` page
- [ ] Set production environment to `NODE_ENV=production` (Vercel does this automatically)
- [ ] Announce to first batch of trainers
