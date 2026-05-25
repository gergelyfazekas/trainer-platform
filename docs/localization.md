# Localization

Target market: Hungary only (v1). No i18n library — all strings are hardcoded in Hungarian.

---

## Language

- All UI copy is in Hungarian
- HTML root element: `<html lang="hu">` set in `app/layout.tsx`
- String source: `messages/hu.ts` — a single TypeScript module exporting a nested object
- Usage: imported directly in components (`import hu from '@/messages/hu'`) — no i18n runtime

### String Keys in `messages/hu.ts`

| Key group | Coverage |
|---|---|
| `nav` | Navigation labels (Edzők, Bejelentkezés, Regisztráció, etc.) |
| `hero` | Home page headline, subheadline, CTA button |
| `search` | Search bar placeholder, filter labels |
| `trainerCard` | Trainer card labels (rate suffix, languages label, etc.) |
| `profile` | Trainer profile page sections |
| `booking` | Booking form labels, slot selection, success message |
| `contact` | Message form labels, success message |
| `auth` | Login/register page copy, error messages |
| `dashboard` | Dashboard page titles, section headers |
| `subscription` | Plan names (Alap, Kiemelt), status labels, feature lists |

Total: 126+ keys as of last scan.

---

## Currency

- Currency: **HUF (Hungarian Forint)**
- HUF has no minor unit in everyday use — stored and displayed as whole integers
- DB column: `hourly_rate integer`, `packages.price integer`
- Display format: `12 000 Ft` (space as thousands separator, "Ft" suffix)
- Formatter:
  ```typescript
  new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF' })
  ```
  Result: `12 000 Ft` (native Hungarian locale formatting)

---

## Dates & Times

- Stored: `timestamptz` (UTC) in all date columns
- Displayed: always converted to `Europe/Budapest` timezone
- Formatter:
  ```typescript
  new Intl.DateTimeFormat('hu-HU', { timeZone: 'Europe/Budapest', ...options })
  ```
- DST (daylight saving time): handled automatically by the `Intl` API — no manual offset logic
- Hungarian date order: year.month.day (e.g. `2026. május 17.`) — rendered correctly by `hu-HU` locale

---

## Timezone

- **Hardcoded:** `Europe/Budapest` everywhere
- No multi-timezone support — all trainers are assumed to be in Hungary
- Booking `appointment_at` is stored in UTC; displayed in Budapest time to both trainer and visitor
- FullCalendar (if used for booking): configured with `timeZone: 'Europe/Budapest'`

---

## Location Data

- **Counties (megye):** Used for broad location filtering. Hungarian county names (19 counties + Budapest)
- **Cities:** 54 major Hungarian cities hardcoded in `components/search-bar.tsx` autocomplete
- Filter sidebar allows filtering by county or specific city
- Trainer profiles store `city`, `county`, `latitude`, `longitude` — coordinates used for map display

---

## Tax

- **VAT rate:** 27% (Hungarian ÁFA standard rate)
- **Handled by:** Stripe Tax — no custom calculation in app
- **Invoice language:** Stripe generates invoices; language determined by Stripe locale settings (configure in Stripe Dashboard)
- **Tax ID:** Collected from trainer at Stripe Checkout; appears on invoice

---

## Featured Tier Label

- Hungarian: **"Kiemelt"** (literally: "highlighted" or "featured")
- Displayed as a badge on trainer cards in the directory
- Used in billing page plan names and feature lists

---

## Future i18n Path (if expanding beyond Hungary)

The current setup uses direct string imports — no i18n runtime. To add a second language:
1. Install `next-intl`
2. Convert `messages/hu.ts` to `messages/hu.json`
3. Add `messages/[locale].json` for new languages
4. Wrap app in `next-intl` provider
5. Replace direct string imports with `useTranslations()` hook

This is a deliberate deferral — `next-intl` adds complexity for no benefit while the platform is Hungary-only.
