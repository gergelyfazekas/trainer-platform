# Payments

Payment processor: Stripe  
Currency: HUF (Hungarian Forint)  
Tax: Stripe Tax — 27% ÁFA (Hungarian VAT) auto-applied  
Model: Trainer subscriptions only. Visitors pay nothing. Booking is free.

---

## Subscription Tiers

| Tier | Stripe price env var | What's included |
|---|---|---|
| **Basic** | `STRIPE_PRICE_BASIC` | Profile listed, visitors can book + message |
| **Featured** | `STRIPE_PRICE_FEATURED` | Everything in Basic + "Kiemelt" badge on cards, sorted first in search results |

Both prices are recurring (monthly), denominated in HUF, with Stripe Tax enabled.  
Pricing amounts are set in the Stripe dashboard — not in code.

---

## Stripe Objects

| Object | Where created | Notes |
|---|---|---|
| Product | Stripe Dashboard | One per tier (Basic, Featured) |
| Price | Stripe Dashboard | Monthly HUF, Stripe Tax enabled, linked to product |
| Customer | `/api/stripe/checkout` | Created server-side on first checkout; `stripe_customer_id` stored in `subscriptions` |
| Checkout Session | `/api/stripe/checkout` | Mode = subscription; collects Hungarian billing address + tax ID |
| Subscription | Stripe (after checkout) | Drives all plan state; mirrored in `subscriptions` table via webhook |
| Invoice | Stripe (auto) | PDF with 27% ÁFA line, trainer tax ID, business name |
| Billing Portal | `/api/stripe/portal` | Stripe-hosted UI for plan changes, payment method updates, cancellation |

---

## Key Flows

### Trainer Subscribes (first time)

```
Trainer clicks "Subscribe" on /dashboard/billing
  → POST /api/stripe/checkout { plan: 'basic' | 'featured' }
    → Server verifies trainer session
    → Looks up or creates Stripe Customer (stores stripe_customer_id)
    → Creates Checkout Session (mode=subscription, price_id, customer, success/cancel URLs)
    → Returns session URL
  → Client redirects to Stripe-hosted Checkout page
    → Trainer enters card details, billing address, tax ID (on Stripe's PCI-compliant page)
    → Stripe collects 27% ÁFA via Stripe Tax
  → Stripe calls webhook: checkout.session.completed
    → Webhook upserts subscriptions row
    → Sets profiles.is_active = true
    → Sets profiles.is_featured = (plan === 'featured')
  → Trainer redirected to success URL
```

### Trainer Changes Plan

```
Trainer opens Stripe Customer Portal (Manage billing button)
  → POST /api/stripe/portal
    → Server verifies session, fetches stripe_customer_id
    → Creates Billing Portal session
    → Returns portal URL
  → Client redirects to Stripe-hosted Portal
    → Trainer selects new plan (Basic ↔ Featured)
    → Stripe handles proration
  → Stripe calls webhook: customer.subscription.updated
    → Webhook derives new plan from stripe_price_id
    → Updates subscriptions.plan + subscriptions.stripe_price_id
    → Updates profiles.is_featured accordingly
```

### Trainer Cancels

```
Trainer cancels in Stripe Customer Portal
  → Stripe calls webhook: customer.subscription.deleted
    → Updates subscriptions.status = 'cancelled'
    → Sets profiles.is_active = false
    → Sets profiles.is_featured = false
  → Trainer profile disappears from public search immediately
```

### Payment Fails

```
Stripe fails to charge card on renewal
  → Stripe calls webhook: invoice.payment_failed
    → Updates subscriptions.status = 'past_due'
  → Profile remains active during Stripe's retry window
  → If all retries fail → Stripe sends subscription.deleted → profile deactivated
```

---

## Webhook Handler

**File:** `app/api/stripe/webhook/route.ts`

Security: Every request verified with `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`. Requests with invalid signatures are rejected with 400.

**Events handled:**

| Event | DB action |
|---|---|
| `checkout.session.completed` | Upsert `subscriptions` row; set `profiles.is_active = true`; set `is_featured` |
| `customer.subscription.updated` | Update plan (from price_id), status, period_end; update `is_featured` |
| `customer.subscription.deleted` | Set status = cancelled; `is_active = false`; `is_featured = false` |
| `invoice.payment_failed` | Set status = past_due |

All DB writes use `createServiceClient()` (service role key, bypasses RLS). This is the only place service role is used for profile updates.

---

## Plan Derivation

```typescript
// lib/stripe.ts
export const PLANS = {
  basic: process.env.STRIPE_PRICE_BASIC,
  featured: process.env.STRIPE_PRICE_FEATURED,
}

export function planFromPriceId(priceId: string): 'basic' | 'featured' | null {
  if (priceId === PLANS.basic) return 'basic'
  if (priceId === PLANS.featured) return 'featured'
  return null
}
```

When a webhook arrives with a new `price_id` (e.g. after a plan switch), the handler calls `planFromPriceId()` to re-derive the plan. This means upgrades/downgrades flow through automatically without hardcoding plan logic in multiple places.

---

## Hungarian Tax (ÁFA)

- **Rate:** 27% (standard Hungarian VAT rate)
- **Handled by:** Stripe Tax (enabled on both price objects in Stripe Dashboard)
- **Billing address:** Collected at Stripe Checkout (required for tax calculation)
- **Trainer tax ID:** Collected at Stripe Checkout (`tax_id_collection` enabled)
- **Invoice:** Stripe auto-generates PDF invoice with ÁFA line and trainer's tax ID
- **Reporting:** Accessible in Stripe Dashboard → Tax; no custom VAT logic in the app

---

## Testing Stripe Locally

Use Stripe CLI to forward webhooks to local dev:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Replay a specific event:
```bash
stripe events resend evt_xxx
```

Test card numbers (Stripe test mode):
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

---

## Production Checklist

- [ ] Switch `STRIPE_SECRET_KEY` to live key
- [ ] Switch `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to live key
- [ ] Set `STRIPE_WEBHOOK_SECRET` from live webhook endpoint in Stripe Dashboard
- [ ] Verify `STRIPE_PRICE_BASIC` and `STRIPE_PRICE_FEATURED` point to live price IDs (not test)
- [ ] Verify Stripe Tax is enabled on live prices
- [ ] Register live webhook endpoint in Stripe Dashboard → Webhooks (pointing to Vercel production URL)
- [ ] Test end-to-end with a real card in production (then refund)
