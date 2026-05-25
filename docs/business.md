# Business

## What the Platform Does

A directory and booking platform for personal trainers in Hungary. Trainers pay a monthly subscription to be listed. Potential clients (visitors) browse and book trainers for free.

Modelled after Airbnb: openly searchable, no account required to browse or book.

**Market:** Hungary only (v1). Hungarian UI. HUF currency. Hungarian VAT (ÁFA) applies.

---

## Revenue Model

**Only source of revenue:** Trainer monthly subscriptions.

Visitors pay nothing. Bookings are free. The platform never takes a commission on sessions.

### Subscription Tiers

| Tier | Hungarian name | What trainer gets |
|---|---|---|
| Basic | Alap | Profile listed and searchable. Visitors can book and send messages. |
| Featured | Kiemelt | Everything in Basic + "Kiemelt" badge on cards + sorted first in all search results |

Prices are set in the Stripe Dashboard (in HUF). 27% Hungarian VAT (ÁFA) is added automatically by Stripe Tax.

**Monetization hook for Featured tier:** Featured trainers appear before Basic trainers in every search result. This is enforced at the DB query level (`ORDER BY is_featured DESC`). There is no bidding, no dynamic ranking — the separation is binary (featured vs. not).

### Infrastructure Cost at Launch

$0/month fixed costs:
- Supabase: free tier
- Vercel: free tier
- Resend: free tier (3,000 emails/month)

Variable cost: Stripe processing fees (~1.5% for EU cards + Stripe Tax per-transaction fee), deducted from trainer subscription payments.

---

## Trainer Economics

| Action | Cost to trainer |
|---|---|
| Register and fill out profile | Free |
| Become publicly visible | Requires active Basic or Featured subscription |
| Upgrade to Featured | Pay Featured price instead of Basic (prorated by Stripe) |
| Cancel | Immediate deactivation (profile hidden from search) |
| Get bookings and messages | Unlimited, no commission |

---

## Visitor Economics

| Action | Cost to visitor |
|---|---|
| Browse trainers | Free |
| Send message to trainer | Free |
| Book a session | Free (through the platform) |
| Pay for the actual training session | Arranged directly between visitor and trainer (off-platform) |

The platform is a lead-generation and scheduling tool. It does not process payments between visitors and trainers.

---

## Competitive Positioning

**Differentiation:**
- Hungarian-language platform (international platforms use English or partial translations)
- HUF pricing (no currency conversion friction)
- Simple, clean UX focused on one market

**Risks:**
- Low defensibility if a large international player localizes for Hungary
- Trainer churn if bookings don't materialize (need marketing to drive visitor traffic)
- Platform value is entirely dependent on driving visitors to trainers

---

## Growth Path

**v1 (current):** Launch in Hungary. No admin panel — manage via Supabase Studio + Stripe Dashboard.

**v2 possibilities (not planned):**
- Expand to other Eastern European countries (requires i18n swap — `next-intl` library is the path)
- In-app messaging (replace email-only messaging)
- Visitor accounts (booking history, saved trainers)
- Session payment processing (take commission — requires significant trust infrastructure)
- Mobile app (React Native or PWA)
- Admin dashboard for moderation and analytics

---

## Key Business Rules (Enforced in Code)

| Rule | Where enforced |
|---|---|
| Trainers only visible when subscription is active | RLS on `profiles`: SELECT only where `is_active = true` |
| `is_active` and `is_featured` only set by Stripe webhook | RLS UPDATE policy excludes these columns for trainer role |
| Featured trainers appear first | `ORDER BY is_featured DESC` in trainer directory query |
| Gallery photo limit by plan | Enforced in UI (verify max enforced client-side in `gallery-upload.tsx`) |
| Visitors don't need accounts to book or message | Public INSERT RLS on `bookings` and `messages` |
| Trainers can't see each other's bookings/messages | RLS: `WHERE trainer_id = auth.uid()` |

---

## Operational Notes (for the platform owner)

- **Trainer disputes:** Handled via Stripe Dashboard (refunds, disputes)
- **Spam bookings:** Honeypot on message form; booking form has no honeypot yet — monitor
- **Inactive Supabase project:** Free tier pauses after 1 week of inactivity. Wake up before testing.
- **Tax compliance:** Stripe Tax handles ÁFA calculation and invoice generation. Platform owner does not need custom accounting integration for v1.
- **Stripe Dashboard:** Sole source of truth for subscription state. `subscriptions` table is a mirror — reconcile if discrepancies arise by replaying webhooks via Stripe CLI.
