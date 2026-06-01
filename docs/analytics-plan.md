# Analytics + Google Ads Setup Plan

## Overview
Wire up Google Tag Manager (GTM) + Google Analytics 4 (GA4) with a GDPR-compliant cookie consent banner. Everything is free — you only pay when you run actual Google Ads campaigns.

## Why GTM instead of direct GA4?
GTM is a container that manages both the GA4 tag and the Google Ads conversion tag in one place. When you start a Google Ads campaign later, you add the Ads tag inside GTM — no code deploy needed.

---

## Step 1: Manual setup on Google's side (do this first)

1. Go to [tagmanager.google.com](https://tagmanager.google.com) → create account + container → copy your `GTM-XXXXXXX` container ID
2. Go to [analytics.google.com](https://analytics.google.com) → create GA4 property → copy your `G-XXXXXXXXXX` measurement ID
3. Inside GTM: add a **GA4 Configuration tag** (trigger: All Pages) with your measurement ID → publish
4. Later, when starting Google Ads: add a **Google Ads Conversion Tracking tag** inside GTM — no code change needed

---

## Step 2: Code changes

### Install package
```bash
npm install @next/third-parties
```

### New file: `platform/lib/gtag.ts`
Utility functions:
- `grantConsent()` — pushes Consent Mode v2 "granted" update to dataLayer when user accepts cookies
- `pushEvent(name, params)` — wrapper for custom dataLayer events

### New file: `platform/components/CookieBanner.tsx`
Client component, fixed bottom bar:
- Shows on first visit (checks `localStorage.cookie_consent`)
- Buttons: "Elfogadom" (Accept) and "Elutasítom" (Decline)
- Accept → calls `grantConsent()`, saves to localStorage, hides banner
- Decline → saves to localStorage, hides banner (GA4 stays silent)

### Edit: `platform/app/layout.tsx`
Three additions:
1. **Consent Mode v2 default** — `<Script id="consent-default" strategy="beforeInteractive">` in `<head>` that sets all consent to `denied` before GTM loads
2. **GTM snippet** — `<GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID!} />` at top of `<body>`
3. **Cookie banner** — `<CookieBanner />` inside `<body>`

### Environment variable
Add to `.env.local` and to Vercel (production + preview):
```
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

---

## Step 3: Optional custom events (add after base setup works)

| Event | Where to add | GA4 / Ads purpose |
|---|---|---|
| Booking form submit | booking form handler | `generate_lead` conversion |
| Trainer registration | signup success | `sign_up` conversion |
| Trainer card click | trainer card component | engagement signal |

---

## GDPR note
Hungary is EU → GDPR applies. GA4 must not load without user consent. The Consent Mode v2 default-denied approach satisfies this: GA4 is loaded but fires no data until the user accepts. Google Ads conversion modeling still works even for users who decline (via anonymized signals).

---

## Verification after implementation
1. **GTM Preview mode**: GTM dashboard → Preview → confirm "Page View" tag fires on each page
2. **GA4 DebugView**: GA4 dashboard → Admin → DebugView → browse site → see real-time events
3. **Consent test**: Clear localStorage → visit site → banner appears → accept → check Network tab for `collect` requests → reload → banner gone
4. **Decline test**: Clear localStorage → decline → no `collect` requests in Network tab
