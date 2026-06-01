# UX — User Flows

Two user types: **Trainers** (pay to be listed) and **Visitors** (browse and book for free).

---

## Trainer Flows

### 1. Registration & Onboarding

```
Visitor lands on site → clicks "Regisztráció" (Register)
  → /auth/register
    → Fills email + password (or clicks Google OAuth)
    → Confirms email (Supabase sends confirmation link)
    → Redirected to /dashboard
      → DB trigger auto-created empty profiles row
  → Dashboard overview shows subscription prompt (no active plan yet)
  → Trainer fills out profile (/dashboard/profile)
  → Trainer sets availability (/dashboard/availability)
  → Trainer subscribes to a plan (/dashboard/billing)
    → Profile becomes publicly visible (is_active = true)
```

**Current gap:** No explicit onboarding flow or checklist. Trainer lands in dashboard and must discover the steps themselves.

### 2. Login

```
Trainer visits /auth/login
  → Email/password or Google OAuth
  → Redirected to /dashboard
```

Session persists via Supabase httpOnly cookie. `proxy.ts` refreshes on every request.

### 2a. Forgot Password

```
Trainer clicks "Elfelejtett jelszó?" on /auth/login
  → /auth/forgot-password
    → Enters email address
    → Supabase sends password reset email (regardless of whether email exists — no enumeration)
    → Page shows generic "check your email" confirmation
  → Trainer clicks link in email
    → Lands on /auth/reset-password
      → Page listens for PASSWORD_RECOVERY event from Supabase
      → Once event fires, shows new password form
      → Trainer enters new password → supabase.auth.updateUser({ password })
      → Redirected to /auth/login
```

### 2b. Registration: resend confirmation email

```
After registering → "check your email" screen
  → If email doesn't arrive: click "Nem érkezett meg? Küldés újra"
    → supabase.auth.resend({ type: "signup", email })
    → Button replaced with "Újraküldve! Ellenőrizd a spam mappádat is."
```

### 3. Managing Profile

```
/dashboard/profile
  → Edit text fields (name, bio, city, county, specialties, rate, languages, phone)
  → Upload profile photo (replaces existing in Supabase Storage)
  → Upload gallery photos (appended; max 3 for Basic, more for Featured — enforce in UI)
  → Add/remove gym locations (search gyms, pin on map)
  → Save → updates profiles row
```

### 3a. Certificate Upload & Verification

```
/dashboard/profile (bottom section — always visible, outside edit mode)
  → Trainer sees current certificate status (none / pending / approved / rejected)
  → Clicks "Tanúsítvány feltöltése" → selects JPG, PNG, or PDF
  → File uploads directly to Supabase Storage (trainer-certificates bucket)
  → POST /api/certificates/notify
    → Sets certificate_status = 'pending' in profiles
    → Sends email to admin with link to document + Jóváhagyás / Elutasítás buttons
  → Dashboard immediately shows "Ellenőrzés alatt" status
  
Admin side (email-based):
  → Receives notification email with certificate link
  → Clicks "Jóváhagyás" or "Elutasítás"
    → GET /api/admin/certificate?profileId=...&action=approve|reject&token=...
    → Updates certificate_status to 'approved' or 'rejected'
  → Trainer's badge appears/disappears on public profile automatically
```

**Note:** No email notification is sent back to the trainer on approve/reject (not yet implemented).

### 4. Managing Availability

```
/dashboard/availability
  → Add slot: pick day of week + time range → saves to availability_slots
  → Delete slot: removes row
  → General availability: toggle morning/daytime/evening × weekdays/weekends
    (used as metadata for filtering, not for actual slot generation)
```

### 5. Managing Packages

```
/dashboard/packages
  → Add package: name, description, price (HUF), sessions, duration, is_popular
  → Edit package inline
  → Delete package (with confirm dialog)
  → Mark as popular (shows badge on trainer profile)
```

### 6. Managing Bookings

```
/dashboard/bookings
  → View list of all booking requests (pending/confirmed/cancelled)
  → Confirm: status → confirmed → Resend email sent to visitor
  → Cancel: status → cancelled → Resend email sent to visitor
```

No automated calendar sync (e.g. Google Calendar). Trainer manages everything in dashboard.

### 7. Managing Messages

```
/dashboard/messages
  → View list of messages from visitors
  → Click message → mark as read
  → Click "Reply" → opens mailto: link in email client
    (reply-to is set to visitor email, so reply lands in visitor inbox)
```

### 8. Subscription Management

```
/dashboard/billing
  → See current plan + status + renewal date
  → "Subscribe" → Stripe Checkout (if no active subscription)
  → "Manage billing" → Stripe Customer Portal
    → Change plan (Basic ↔ Featured)
    → Update payment method
    → Download invoices
    → Cancel subscription
```

---

## Visitor Flows

### 1. Browse Trainers (Home → Directory)

```
/ (Home)
  → Sees featured trainers + recent trainers
  → Uses search bar (city or specialty) → /trainers?query=...
  OR
  → Clicks city in city bar → /trainers?city=...
  
/trainers
  → Sees trainer cards sorted: Featured first, then by distance/relevance
  → Cards show "Kiemelt" badge (featured) and/or "Ellenőrzött" badge (verified certificate)
  → Uses filter sidebar (price, county/city, gym, languages, availability)
  → Toggles between list view and map view
  → Clicks trainer card → /trainers/[id]
```

### 2. View Trainer Profile

```
/trainers/[id]
  → Sees gallery carousel, bio, specialties, rate, languages
  → Clicks a gallery photo → fullscreen lightbox (keyboard ←/→/Escape, photo counter, click backdrop to close)
  → "Ellenőrzött edző" emerald badge shown below the name if certificate_status = 'approved'
  → Scrolls down: packages, gym locations on map
    → Gym address is a clickable link → opens Google Maps search in new tab
  → Sticky booking card (right column on desktop, bottom bar on mobile)
    → Tabs: Book | Üzenet (Message) | Telefon (Phone)
  → Clicks "Foglalás" (Book) → scrolls to booking card / opens /book/[trainerId]
  → Clicks "Üzenet" → inline message form
  → Clicks "Telefon" → reveals phone number (click to call on mobile)
```

### 3. Book a Session

```
/book/[trainerId]
  → Sees calendar with available time slots
    (availability_slots minus already-booked appointment_at times)
  → Clicks available slot → form modal appears
    → Fills: name, email, phone, notes, duration (if multiple durations offered)
  → Clicks "Foglalás küldése" (Send booking)
    → POST /api/bookings
      → Race-condition check (re-validates slot before insert)
      → Inserts booking (status: pending)
      → Sends confirmation email to visitor
      → Sends notification email to trainer
  → Success screen shown
  → Trainer receives email + sees booking in /dashboard/bookings
  → Trainer confirms or cancels from dashboard
```

Trainer confirms or cancels from dashboard → visitor receives Resend email with appointment date and outcome (confirmed/cancelled).

### 4. Send a Message

```
Trainer profile page → click "Üzenet" tab in booking card
  → MessageForm: sender_name, sender_email, message body, honeypot field (hidden)
  → Submit → POST /api/messages
    → Honeypot check (reject if filled — bot detection)
    → Inserts message row
    → Sends notification email to trainer (reply-to = visitor email)
  → Success state shown
```

---

## Error & Edge Case Flows

| Scenario | Current handling |
|---|---|
| Inactive trainer URL visited | Should 404 — verify `is_active = true` check on `/trainers/[id]` |
| Booking slot taken (race condition) | `/api/bookings` re-validates and returns error |
| Stripe payment fails | Subscription → past_due; trainer sees status in billing page |
| Subscription cancelled | `is_active = false`; profile disappears from search |
| Network error on form submit | ❌ No error state displayed — Phase 6 task |
| Invalid booking time submitted | ❌ Client validation only — backend re-validates but error UX unclear |

---

## UX Gaps (Phase 6)

**Implemented:**
- [x] "Forgot password" flow — `/auth/forgot-password` + `/auth/reset-password` ✅
- [x] Resend confirmation email button on registration screen ✅
- [x] Dashboard save success feedback ("Sikeresen mentve.") ✅
- [x] Dashboard mobile navigation (hamburger drawer) ✅
- [x] 404 + error boundary pages ✅

**Still needed:**
- [ ] Onboarding checklist for new trainers (complete profile → set availability → subscribe)
- [ ] Loading states / skeletons on trainer list, profile, booking calendar
- [ ] Mobile UX audit: test booking flow, message form, public pages on 375px
- [ ] `/rolunk` (About us) page
