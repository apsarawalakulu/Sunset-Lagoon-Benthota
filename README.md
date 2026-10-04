# Sunset Lagoon Boat House

Premium website and booking management system for **Sunset Lagoon Boat House**, a boat safari operator on the Bentota River, Sri Lanka.

- Public site: https://sunsetlagoon.boats
- Admin panel: https://sunsetlagoon.boats/admin/login
- Contact: sunsetlagoon.boats@gmail.com · +94 767 498 169 · WhatsApp +94 776 838 289

## What this project is

A full-stack TypeScript application with two faces:

1. **Public marketing and booking site** — cinematic homepage, safari experiences, wildlife and gallery sections, verified guest reviews, contact section, and a booking request flow with live availability.
2. **Admin back office** — bookings and guest manifests, safari schedules and time slots, boat fleet, experiences, gallery and media library, review moderation (website + Google), contact inbox, site settings CMS, and traffic analytics.

There is no custom API server to deploy. The React frontend calls TanStack Start server functions, which talk directly to a managed Postgres database (Neon). File uploads go to Cloudinary. Transactional email goes through Resend.

## Tech stack

| Layer      | Technology                                              |
|------------|---------------------------------------------------------|
| UI         | React 19, TanStack Start, TanStack Router, TanStack Query |
| Styling    | Tailwind CSS 4, shadcn/ui (Radix primitives), Framer Motion, GSAP |
| Language   | TypeScript (strict)                                     |
| Database   | Neon Postgres via `@neondatabase/serverless` (SQL over HTTPS, no driver install) |
| Email      | Resend (HTTPS API, no SDK)                              |
| Uploads    | Cloudinary unsigned uploads                             |
| Reviews    | First-party form + Google Places API sync               |
| Analytics  | First-party page-view tracking + Vercel Web Analytics snippet |
| Hosting    | Vercel (Nitro `vercel` preset, prebuilt output)         |
| SEO        | SSR meta/OG/canonical per route, sitemap, JSON-LD with live aggregate rating |

## Project structure

```
src/
  assets/            # Bundled images (hero slides, fleet)
  backend/           # Server functions (never imported by client bundles directly)
    db.ts            # Neon client, schema auto-migration (CREATE TABLE IF NOT EXISTS)
    auth.ts          # Admin auth: scrypt passwords, HMAC session tokens, first-run setup
    seed.ts          # Demo content for first-time setup
    public.ts        # Public API: experiences, gallery, reviews, settings, media,
                     #   availability, booking creation, contact, review submission
    admin.ts         # Admin API: dashboard, bookings, experiences, gallery, reviews,
                     #   messages, settings, boats, schedules, slots, media
    fleet.ts         # Fleet-wide seat model (window-pooled availability)
    email.ts         # Resend email helper + branded templates
    google.ts        # Google Places review fetch/import
    analytics.ts     # First-party page-view tracking + overview stats
  components/
    HomePage.tsx     # Full landing page (all public sections)
    BookingModal.tsx # 10-field booking request flow
    Gallery.tsx      # Homepage gallery grid + lightbox
    ReviewsSection.tsx
    AnimalsSlideshow.tsx
    SiteNavbar.tsx / Reveal.tsx / ContactForm.tsx
    admin/           # AdminLayout, MediaManager, AdminPlaceholder
    ui/              # shadcn/ui primitives + image-scatter
  data/              # Local fallback content (experiences, gallery, siteConfig, countries)
  hooks/             # React Query hooks (useApiData), use-mobile
  lib/               # cn(), SEO constants, media title helper
  routes/
    index.tsx        # / (loader feeds review stats to JSON-LD)
    gallery.tsx      # /gallery
    admin/           # login, dashboard, analytics, bookings, experiences, gallery,
                     #   reviews, messages, settings, boats, schedules, media
  services/          # Client API layer (calls server functions, handles sessions/uploads)
  router.tsx / routeTree.gen.ts / server.ts / start.ts / styles.css
public/
  animals/           # Wildlife slideshow images
  hero/ (+ mobile/)  # Hero images (desktop + portrait mobile variants)
```

## Getting started (local)

Prerequisites: Node.js 18+ and npm 9+.

```sh
npm install
cp .env.example .env   # then fill in the values (see below)
npm run dev
```

The site runs at http://localhost:8080 (or the next free port).

Note: plain `npm install` may fail on some npm 10 versions with an arborist
error in this repo. Regenerating only the lockfile works reliably:

```sh
mkdir /tmp/lockfix && cp package.json package-lock.json /tmp/lockfix/
cd /tmp/lockfix && npm install --package-lock-only
cp package-lock.json <project>/
```

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Neon Postgres pooled connection string |
| `ADMIN_SECRET` | No | Signs admin session tokens (derived from `DATABASE_URL` if omitted) |
| `RESEND_API_KEY` | For email | Resend API key for booking/contact/guest emails |
| `ADMIN_NOTIFICATION_EMAIL` | No | Inbox for booking + contact alerts (default: business Gmail) |
| `EMAIL_FROM` | No | Sender identity (default: `Sunset Lagoon <bookings@sunsetlagoon.boats>`, domain must be verified in Resend) |
| `VITE_CLOUDINARY_CLOUD_NAME` | For uploads | Cloudinary cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | For uploads | Unsigned upload preset |
| `GOOGLE_PLACES_API_KEY` | For auto review sync | Google Cloud key with Places API enabled |
| `GOOGLE_PLACE_ID` | No | Explicit Place ID (auto-resolved from business name if omitted) |

`VITE_*` values are baked in at build time. Never commit `.env` (already git-ignored).

## Database

Managed Postgres on Neon. Tables are created automatically on first use
(`ensureSchema`, idempotent), covering: `users`, `experiences`, `boats`,
`schedules`, `time_slots`, `bookings`, `gallery`, `reviews`, `media`,
`contact_messages`, `site_settings`, `page_views`.

First run: open `/admin/login` with `DATABASE_URL` set. If no admin exists,
the page offers first-time setup (creates the admin + seeds demo content).

### Seat model

Availability is pooled per time window (date + start + end), not per slot row.
Each window opens with the full fleet capacity (sum of in-service boat
capacities; boats with status Active/Available count). Every non-cancelled
booking in that window draws from the same pool; the next window starts fresh
automatically. Booking creation validates against the pool server-side, so
overbooking is impossible even with duplicate slot rows.

## Key flows

- **Booking (website):** date, safari time (sunrise/sunset/preferred), duration,
  guests (capped by settings + live availability), contact details. Creates a
  `pending` booking with a `SL-XXXXXX` reference, emails the admin inbox, and
  opens a WhatsApp handoff with the details prefilled.
- **Booking (admin walk-in):** no experience required; adjustable start/end
  times and optional boat; reuses a matching scheduled slot or creates a
  custom one. Without a backend connection the public form still completes
  with a local reference plus the WhatsApp handoff.
- **Confirmation:** confirming a booking emails the guest (requires a
  verified Resend domain); cancelling emails the reason. Failures only log —
  they never break the booking action.
- **Reviews:** guests submit with booking reference + name (verified against a
  confirmed/completed booking, one per booking, published after approval).
  Google reviews sync hourly and via the admin Sync button (Places API key
  required); manual Google copies get a `via Google` badge via the Source
  selector in Add Review.
- **Media:** uploads go to Cloudinary; items are assigned to homepage sections
  (hero, about, story, wildlife, experiences) or the gallery. Auto-generated
  filenames are hidden behind human labels on display.

## Admin panel (`/admin/*`, all `noindex`)

Login (with first-run setup), Dashboard, Analytics (first-party traffic,
visitors, bounce rate, online now, top pages/referrers/countries),
Bookings (filters, detail, confirm/cancel/complete/no-show/reschedule,
departure manifests, walk-in creation), Safari Schedule (slots, bulk
generation, boat assignment), Experiences (full CRUD — new in this project),
Boats, Reviews (moderation + Google sync), Media & Photos, Contact Messages,
Site Settings (business info, all homepage copy, booking rules, safari times).

## Scripts

| Command        | Purpose                                  |
|----------------|------------------------------------------|
| `npm run dev`  | Local dev server (SSR)                   |
| `npm run build`| Production build (client + SSR + Nitro) |
| `npm run preview` | Preview build (see note below)        |
| `npm run lint` | ESLint (note: repo uses CRLF; prettier line-ending noise is pre-existing) |
| `npm run format` | Prettier write                         |
| `npx tsc --noEmit` | Type check                            |

`npm run preview` (plain Vite preview) cannot serve the Nitro server build;
deploy previews happen on Vercel.

## Deployment (Vercel)

1. Push `main` (this repo). Framework Preset: Other (or Vite). Build command:
   `npm run build`. Install command: `npm ci`.
2. Set `NITRO_PRESET=vercel` plus all env vars above in Project Settings
   (Vercel auto-detects the platform too; the explicit var makes it deterministic).
   The build emits `.vercel/output`, which Vercel picks up automatically.
3. Add the `sunsetlagoon.boats` domain (DNS already on Vercel) and deploy.
4. Post-deploy: log in, submit `sitemap.xml` in Google Search Console.

Notes: `@tanstack/*` must stay on patched versions (Vercel blocks the
GHSA-qx66-fv34-fjm8 range at install time). First visit after deploy warms the
schema check; afterwards it is cached per instance.

## Conventions

- Public components render local fallback content when the database is
  unreachable, so the site never shows a blank page.
- Email failures never fail the triggering action; they log server-side.
- Admin writes require a valid admin session token on every call.
- Keep business facts (fleet size, hours, contact details) in Site Settings /
  `siteConfig.ts`, never hard-coded in components.
