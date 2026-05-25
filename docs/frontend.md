# Frontend

Framework: Next.js 16.2.4 (App Router, TypeScript)  
UI: Tailwind CSS + shadcn/ui  
Maps: Leaflet (dynamic import, SSR disabled)  
Fonts: SF Pro Display (local, 8 weights)  
Custom theme variables: `--th-*` CSS variables in `globals.css`

**Design tokens (current values):**
- `--th-bg: #FAF8F3` — warm cream (navbar, footer, page backgrounds)
- `--th-fg: #0F172A` — near-black
- `--th-fg-muted: #64748B` — muted text
- `--th-accent: #D05A2E` — terracotta-orange (buttons, badges, active states)
- `--th-accent-fg: #ffffff`

---

## Route Map

### Public Routes

| Route | File | Description |
|---|---|---|
| `/` | `app/page.tsx` | Home: hero, featured trainers, recent trainers |
| `/trainers` | `app/trainers/page.tsx` | Trainer directory: search, filters, list/map toggle |
| `/trainers/[id]` | `app/trainers/[id]/page.tsx` | Trainer profile: photos, bio, packages, gym map, booking card |
| `/book/[trainerId]` | `app/book/[trainerId]/page.tsx` | Booking page wrapper |
| `/book/[trainerId]` (view) | `app/book/[trainerId]/booking-view.tsx` | Calendar slot picker + visitor form |
| `/auth/login` | `app/auth/login/page.tsx` | Email/password login + Google OAuth + "Elfelejtett jelszó?" link |
| `/auth/register` | `app/auth/register/page.tsx` | Email/password registration + Google OAuth + resend confirmation button |
| `/auth/forgot-password` | `app/auth/forgot-password/page.tsx` | Enter email to receive password reset link |
| `/auth/reset-password` | `app/auth/reset-password/page.tsx` | Set new password (triggered by Supabase recovery email link) |
| `/auth/callback` | `app/auth/callback/route.ts` | OAuth redirect handler |
| `/coming-soon` | `app/coming-soon/page.tsx` | Placeholder page (pre-launch) |

### Global Error Pages

| File | Description |
|---|---|
| `app/not-found.tsx` | Branded 404 — triggered by `notFound()` calls and unmatched URLs. Links to home + trainer directory |
| `app/error.tsx` | Error boundary — shown on unhandled errors. Retry button (`unstable_retry`) + link home. Must be `"use client"` |

### Protected Routes (require auth — enforced by `proxy.ts`)

| Route | File | Description |
|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` | Overview: pending bookings, unread messages, subscription status |
| `/dashboard/profile` | `app/dashboard/profile/page.tsx` | Edit profile info, photos, gym locations |
| `/dashboard/availability` | `app/dashboard/availability/page.tsx` | Weekly slot manager + general availability toggles |
| `/dashboard/packages` | `app/dashboard/packages/page.tsx` | CRUD service packages |
| `/dashboard/bookings` | `app/dashboard/bookings/page.tsx` | Booking list with confirm/cancel actions |
| `/dashboard/messages` | `app/dashboard/messages/page.tsx` | Message inbox with is_read toggle |
| `/dashboard/billing` | `app/dashboard/billing/page.tsx` | Stripe plan management |

Dashboard layout: `app/dashboard/layout.tsx` — thin Server Component: auth check + redirect, passes navItems to `DashboardShell`.  
`app/dashboard/_components/dashboard-shell.tsx` — Client Component: desktop sidebar + mobile hamburger drawer + active link highlight.  
`app/dashboard/_actions/sign-out.ts` — Server Action extracted so it can be called from the Client Component shell.

---

## Component Inventory

### Layout & Navigation
| Component | File | Description |
|---|---|---|
| BrandLogo | `components/brand-logo.tsx` | Typographic logo: "foglalj" (medium, `--th-fg`) + "edzőt" (bold, `--th-accent`). Props: `variant="light" \| "dark"`, `size="sm" \| "md"`. Used in navbar, auth pages, dashboard, booking view, error pages. |
| Navbar | `components/navbar.tsx` | Sticky header: logo, nav links, auth state. Accepts `variant="light" \| "dark"` prop — light (default) uses `--th-bg` with a soft downward shadow; dark used on the home page hero. |
| Dashboard layout | `app/dashboard/layout.tsx` | Server Component: auth check, passes navItems to DashboardShell |
| DashboardShell | `app/dashboard/_components/dashboard-shell.tsx` | Client Component: desktop sidebar (`hidden md:flex`) + mobile overlay drawer (hamburger button) + active link highlight |
| signOut action | `app/dashboard/_actions/sign-out.ts` | Server Action for logout, importable by Client Components |

### Trainer Discovery
| Component | File | Description |
|---|---|---|
| TrainerCard | `components/trainer-card.tsx` | Trainer card (2 variants: normal + compact). Shows photo, name, city, rate, languages, "Kiemelt" badge if featured, "Ellenőrzött" badge if `certificate_status === 'approved'` |
| SearchBar | `components/search-bar.tsx` | Location + specialty search with autocomplete; 54 Hungarian cities hardcoded |
| FilterSidebar | `components/filter-sidebar.tsx` | Price range, county/city, gym, languages, availability day/time filters |
| ViewToggle | `components/view-toggle.tsx` | Switch between list and map views |
| CityBar | `components/city-bar.tsx` | City selector strip |
| TrainerMapWrapper | `components/trainer-map-wrapper.tsx` | SSR-safe wrapper for Leaflet (dynamic import) |
| TrainerMap | `components/trainer-map.tsx` | Leaflet map rendering trainer location pins |

### Trainer Profile
| Component | File | Description |
|---|---|---|
| ScrollHeader | `components/trainer-profile/scroll-header.tsx` | Sticky header that appears on scroll (trainer name + quick actions) |
| BookingCard | `components/trainer-profile/booking-card.tsx` | Tab card: Book / Message / Phone. Primary CTA on trainer profile |
| GalleryCarousel | `components/trainer-profile/gallery-carousel.tsx` | Photo slideshow with fullscreen lightbox: click opens `bg-black/92` overlay, keyboard ←/→/Escape, photo counter, scroll-lock |
| MobileBar | `components/trainer-profile/mobile-bar.tsx` | Sticky bottom action bar for mobile |
| GymMapWrapper | `components/trainer-profile/gym-map-wrapper.tsx` | SSR-safe wrapper for gym location map |
| GymMap | `components/trainer-profile/gym-map.tsx` | Leaflet map showing trainer's gym location pins |

### Forms & Uploads
| Component | File | Description |
|---|---|---|
| MessageForm | `components/message-form.tsx` | Visitor contact form: name, email, message. Posts to `/api/messages` |
| PhotoUpload | `components/photo-upload.tsx` | Single profile photo upload directly to Supabase Storage |
| GalleryUpload | `components/gallery-upload.tsx` | Multi-photo gallery upload to Supabase Storage |
| CertificateUpload | `components/certificate-upload.tsx` | Upload trainer certificate (JPG/PNG/PDF) to `trainer-certificates` bucket, then calls `/api/certificates/notify`. Shows live status: none / pending / approved / rejected. Always visible at the bottom of `/dashboard/profile`, outside the edit-mode toggle. |

### Shared UI
| Component | File | Description |
|---|---|---|
| ConfirmDialog | `components/confirm-dialog.tsx` | Reusable confirmation modal |
| Button | `components/ui/button.tsx` | shadcn/ui base button |
| ComboboxChips | `components/ui/combobox-chips.tsx` | Multi-select dropdown with chip display |

---

## Page Details

### Home (`/`)
- **Hero section** — warm cream `#FAF8F3` background with radial amber glow (`rgba(234,162,88,0.22)`) and secondary coral blob. Eyebrow pill badge, large headline, subtitle, SearchBar, social proof row ("Ingyenes böngészés · Azonnali foglalás · Ellenőrzött edzők"). Bottom gradient fades to white to flow into the trainer grid. Navbar uses the default light variant, visually separated by a soft shadow.
- Hero is vertically compact so the first row of trainer cards is visible without scrolling on a standard 1080p screen
- Featured trainer cards (is_featured = true, is_active = true)
- Recent/all trainer cards
- Search bar linking to `/trainers`

### Trainer Directory (`/trainers`)
- URL params drive filter state (county, city, price_min/max, languages, availability_days, availability_times, gym_ids)
- Left: FilterSidebar
- Right: ViewToggle → either TrainerCard list or TrainerMap
- Search bar at top
- Featured trainers appear first (`is_featured DESC`)
- Only active trainers shown (`is_active = true`)

### Trainer Profile (`/trainers/[id]`)
- **`generateMetadata()`** — dynamic `<title>` (`{name} – személyi edző, {city} | foglalj edzőt`), `<meta description>` (bio excerpt), OG title + description + trainer profile photo
- Fetches trainer by ID (must be `is_active = true` — 404 otherwise)
- GalleryCarousel (profile photo + gallery) — click to open fullscreen lightbox
- Bio, specialties, languages, hourly rate
- Service packages list
- Gym locations on GymMap; addresses link to Google Maps (`maps/search/?api=1&query=...`)
- ScrollHeader appears on scroll
- BookingCard (sticky right column on desktop)
- MobileBar (sticky bottom on mobile)
- MessageForm (tab inside BookingCard)

### Booking Page (`/book/[trainerId]`)
- `booking-view.tsx`: fetches `availability_slots` and existing `bookings` for the trainer
- Generates open slots (availability minus booked times)
- Visitor clicks slot → form modal (name, email, phone, notes, duration)
- Submits to `POST /api/bookings`
- Success state shown after confirmation

### Dashboard Overview (`/dashboard`)
- Count of pending bookings
- Count of unread messages
- Current subscription plan + status
- Quick-link cards to each dashboard section

### Profile Editor (`/dashboard/profile`)
- Form fields: full_name, bio, city, county, specialties, hourly_rate, languages, phone
- PhotoUpload for profile photo
- GalleryUpload for gallery photos
- Gym location editor (add/remove gym pins)
- Green "Sikeresen mentve." message shown for 4 seconds after save

### Availability (`/dashboard/availability`)
- Weekly slot editor: add slots by day + time range
- General availability section: checkboxes for morning/daytime/evening × weekday/weekend
- Green "Sikeresen mentve." message shown for 4 seconds after slot add or general save

### Packages (`/dashboard/packages`)
- List of existing packages with edit/delete
- Add new package form: name, description, price (HUF), sessions, duration (min), is_popular
- ConfirmDialog on delete
- Green "Sikeresen mentve." message shown for 4 seconds after save

### Bookings (`/dashboard/bookings`)
- Table of all bookings for this trainer
- Columns: visitor name, email, phone, appointment time, duration, notes, status
- Confirm / Cancel buttons (updates status, re-fetches)

### Messages (`/dashboard/messages`)
- List of messages: sender name, email, message body, timestamp, is_read
- Toggle read/unread
- mailto: link to reply (opens email client, reply-to = visitor email)

### Billing (`/dashboard/billing`)
- Shows current plan (Basic / Featured / None)
- Shows subscription status (active / past_due / cancelled)
- Shows `current_period_end`
- "Subscribe" → `POST /api/stripe/checkout` → redirect to Stripe Checkout
- "Manage billing" → `POST /api/stripe/portal` → redirect to Stripe Customer Portal

---

## Localization

All UI copy lives in `messages/hu.ts`. Keys cover:
- `nav`, `hero`, `search`, `trainerCard`, `profile`, `booking`, `contact`, `auth`, `dashboard`, `subscription`

Currency: `Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF' })` → `12 000 Ft`  
Dates: `Intl.DateTimeFormat('hu-HU', { timeZone: 'Europe/Budapest' })`  
HTML lang: `<html lang="hu">` in root layout

---

## Phase 6 Frontend Tasks

- [ ] Mobile responsiveness audit: test all pages at 375px, 414px, 768px
- [ ] Loading skeletons on TrainerCard list, TrainerMap, BookingView
- [ ] Error states: 404 for inactive/missing trainer, form submission errors
- [ ] SEO metadata: title + description per page in `generateMetadata()`
- [ ] Open Graph tags for trainer profile pages (photo, name, bio)
- [ ] Accessibility: keyboard nav, ARIA labels on interactive elements, color contrast check
- [ ] Performance: verify Next.js `<Image>` used for all trainer photos (not `<img>`)
