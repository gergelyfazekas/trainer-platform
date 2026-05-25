# Feature Inventory

Status legend: ✅ Done | 🟡 Partial | ❌ Not started

---

## Trainer-Facing Features

### Account & Auth
| Feature | Status | Notes |
|---|---|---|
| Email/password registration | ✅ | `/auth/register` |
| Email/password login | ✅ | `/auth/login` |
| Google OAuth login | ✅ | `/auth/callback` handles redirect |
| Email confirmation on signup | ✅ | Supabase handles |
| Auto-create profile row on signup | ✅ | DB trigger in migration 001 |
| Protected dashboard routes | ✅ | `proxy.ts` redirects unauthenticated users |
| Logout | ✅ | Dashboard sidebar button |
| Password reset | ✅ | `/auth/forgot-password` + `/auth/reset-password`; Supabase sends the email |
| Resend confirmation email | ✅ | Button on registration "check email" screen |

### Profile Management
| Feature | Status | Notes |
|---|---|---|
| Edit name, bio, city, county | ✅ | `/dashboard/profile` |
| Edit specialties (multi-select) | ✅ | Combobox chips |
| Edit hourly rate (HUF) | ✅ | Integer input |
| Edit languages spoken | ✅ | Multi-select |
| Edit phone number | ✅ | Added in migration 002 |
| Upload profile photo | ✅ | Direct to Supabase Storage |
| Upload gallery photos | ✅ | Multi-photo, max depends on plan |
| Add gym locations | ✅ | `trainer_gym_locations` table, map pin display |
| Edit business name + tax ID | 🟡 | Fields exist in schema, verify dashboard exposes them |
| Upload trainer certificate | ✅ | `/dashboard/profile` — JPG/PNG/PDF to `trainer-certificates` bucket; triggers admin review email |
| Certificate status display | ✅ | Shows none / pending / approved / rejected in dashboard |

### Availability & Booking Management
| Feature | Status | Notes |
|---|---|---|
| Set weekly availability slots | ✅ | `/dashboard/availability` — day + time ranges |
| General availability toggles | ✅ | Morning/daytime/evening, weekdays/weekends |
| View incoming booking requests | ✅ | `/dashboard/bookings` list |
| Confirm booking | ✅ | Status → confirmed |
| Cancel booking | ✅ | Status → cancelled |
| Receive booking confirmation email | ✅ | Resend via `/api/bookings` |

### Packages
| Feature | Status | Notes |
|---|---|---|
| Create service package | ✅ | Name, description, price, sessions, duration |
| Edit package | ✅ | Inline edit in `/dashboard/packages` |
| Delete package | ✅ | With confirm dialog |
| Mark package as "popular" | ✅ | Boolean flag |
| Reorder packages | 🟡 | Schema supports it, verify drag-reorder UI |

### Messaging
| Feature | Status | Notes |
|---|---|---|
| View messages from visitors | ✅ | `/dashboard/messages` |
| Mark message as read | ✅ | `is_read` toggle |
| Reply to message via email | ✅ | mailto link (reply-to = visitor email) |
| Receive new message notification email | ✅ | Resend sends to trainer |

### Subscription & Billing
| Feature | Status | Notes |
|---|---|---|
| Subscribe to Basic plan | ✅ | Stripe Checkout in HUF |
| Subscribe to Featured plan | ✅ | Stripe Checkout in HUF |
| Switch plans (Basic ↔ Featured) | ✅ | Stripe Customer Portal |
| Cancel subscription | ✅ | Stripe Customer Portal |
| View current plan + status | ✅ | `/dashboard/billing` |
| Stripe Tax (27% ÁFA) on invoices | ✅ | Enabled on Stripe prices |
| Tax ID captured at checkout | ✅ | Stripe Checkout collects it |
| Invoice PDF with ÁFA line | ✅ | Stripe generates automatically |
| Webhook syncs `is_active` + `is_featured` | ✅ | Service-role only, not editable by trainer |

---

## Visitor-Facing Features

### Discovery
| Feature | Status | Notes |
|---|---|---|
| Browse trainers on home page | ✅ | Featured + recent trainer cards |
| Search by location (city/county) | ✅ | Dropdown with 54 Hungarian cities |
| Filter by price range | ✅ | Slider in filter sidebar |
| Filter by specialties | 🟡 | Verify filter sidebar wires to DB query |
| Filter by languages | ✅ | Multi-select |
| Filter by availability (days/times) | ✅ | Morning/daytime/evening + weekdays/weekends |
| Filter by gym | ✅ | Filter sidebar |
| List view of trainers | ✅ | Default view |
| Map view of trainers | ✅ | Leaflet map with trainer pins |
| Toggle between list and map | ✅ | `view-toggle` component |
| "Kiemelt" (Featured) badge on cards | ✅ | Featured trainers show badge |
| Featured trainers sort first | ✅ | `is_featured DESC` in query |
| "Ellenőrzött" (Verified) badge on cards | ✅ | Shown when `certificate_status = 'approved'`; white pill top-right of photo (full card) or green checkmark icon next to name (compact) |

### Trainer Profile
| Feature | Status | Notes |
|---|---|---|
| View trainer bio, specialties, rate | ✅ | `/trainers/[id]` |
| View gallery photos (carousel) | ✅ | `gallery-carousel` component |
| Fullscreen lightbox on gallery photos | ✅ | Click photo → fullscreen overlay; keyboard ←/→/Escape; photo counter; scroll-locked |
| View trainer languages | ✅ | Profile page |
| View service packages | ✅ | Listed on profile page |
| View gym locations on map | ✅ | Leaflet map on profile |
| Click gym address → Google Maps | ✅ | Address under "Edzés helyszínei" is a link to `google.com/maps/search/` |
| Sticky booking card on scroll | ✅ | `scroll-header` + `booking-card` |
| Mobile sticky action bar | ✅ | `mobile-bar` component |

### Booking
| Feature | Status | Notes |
|---|---|---|
| View available time slots | ✅ | Calendar generated from `availability_slots` - existing `bookings` |
| Select a slot | ✅ | Click to open form modal |
| Submit booking (name/email/phone/notes) | ✅ | POST `/api/bookings` |
| Race-condition guard on slot | ✅ | Re-validates availability before insert |
| Receive booking confirmation email | ✅ | Resend |
| No visitor account required | ✅ | Public insert RLS policy |

### Contact
| Feature | Status | Notes |
|---|---|---|
| Send message to trainer | ✅ | Contact form on trainer profile |
| Honeypot spam check | ✅ | `/api/messages` validates |
| Trainer receives email notification | ✅ | Resend, reply-to = visitor email |
| No visitor account required | ✅ | Public insert RLS policy |

---

## Admin / Platform Features

| Feature | Status | Notes |
|---|---|---|
| Admin dashboard | ❌ | Not planned for v1 — manage via Supabase Studio + Stripe dashboard |
| Certificate review (approve/reject) | ✅ | Email-based: admin receives notification with one-click approve/reject links → `GET /api/admin/certificate` updates `certificate_status` |
| Manual trainer approval | ❌ | Not planned — subscription payment is the gate |
| Trainer deactivation | 🟡 | Only via subscription cancellation (webhook sets `is_active=false`) |
| Abuse reporting | ❌ | Not planned for v1 |
| Analytics | ❌ | Not planned for v1 |

---

## Not-in-Scope for v1

- Multi-language support (Hungarian only)
- Multi-currency (HUF only)
- Multi-timezone (Europe/Budapest hardcoded)
- Visitor accounts
- In-app messaging (email only)
- Payment for bookings (subscriptions only — visitors book for free)
- Mobile app
- Admin panel
