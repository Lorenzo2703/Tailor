# CLAUDE.md — "Verified Adoptions" (working title) — FULL IMPLEMENTATION

> Status: the demo phase is over. Milestones 1-3 of the demo (setup, fake data, PWA shell) are done and carried over. From now on we build the **real product**, starting with a pilot in Lazio, Italy.

## 1. Product

A trust-first platform to find and give animals (mainly dogs and cats) a home: structured, verifiable animal profiles, verified shelters, qualified adoption requests.

**Positioning:** responsible adoption and rehoming, not a generic classifieds site. Trust, verification and traceability come before growth.

**Who uses it**
- **Adopters:** browse, filter, save, contact.
- **Shelters / associations:** publish and manage animals and requests (free, our growth engine).
- **Private individuals:** rehome an animal (gift only at launch).
- **Breeders:** later phase, behind a feature flag, with strict verification.
- **Admins/moderators (us):** verify organizations, review reports, remove content.

### Launch scope (pilot)
IN: shelters + private rehoming (free), search with geo filters, favorites, contact requests, reports, moderation back-office, SEO pages, legal pages.
OUT (behind feature flags, default OFF): sale of animals, breeders, in-platform payments/escrow, shipping of any kind, native apps.

Feature flags live in `src/lib/flags.ts`: `ENABLE_BREEDERS`, `ENABLE_SALE`, `ENABLE_PAYMENTS`. Never ship code paths for a disabled flag that can be reached by users.

## 2. Stack

- **Next.js** (App Router) + **TypeScript strict**, deployed on **Vercel**
- **Supabase** (Postgres, Auth, Storage, RLS), project region **EU (Frankfurt)**
- **PostGIS** for distance search; Postgres full-text for text search
- **Tailwind CSS + shadcn/ui**, `lucide-react`
- **Zod** for all input validation; **React Hook Form** for forms
- **Resend** for email; **Cloudflare Turnstile** on public forms; **Upstash Redis** for rate limiting
- **MapLibre + OpenStreetMap** for maps
- **Sentry** (errors) and **PostHog, EU host** (product analytics, cookieless/consent-aware)
- **Testing:** Vitest (unit + RLS tests), Playwright (end-to-end)
- **Package manager:** `bun`

**Dependency rule:** no new library without a clear reason. Prefer platform features (Postgres, RLS, Supabase) over new services.

## 3. Project structure

```
src/
  app/
    (marketing)/             # Landing, about, FAQ, privacy, terms
    (public)/                # SEO pages: listings, animal detail, shelter, city pages
      animals/[slug]/
      shelters/[slug]/
      adopt/[city]/
    (app)/                   # Authenticated area
      account/ favorites/ inquiries/ my-animals/ new/
    (admin)/                 # Moderation back-office (role-gated)
    api/                     # Only webhooks/cron; business logic lives in server actions
    manifest.ts
  components/ (landing/ app/ admin/ ui/)
  lib/
    supabase/                # server.ts, client.ts, middleware helpers (no business logic)
    validation/              # Zod schemas shared by client and server
    compliance.ts            # Legal rules in ONE place (see §6)
    flags.ts
    types.ts                 # + generated DB types
  server/
    actions/                 # Server actions, each checks auth + permissions + validates input
    queries/                 # Read queries
supabase/
  migrations/                # SQL migrations, never edited once applied
  seed.sql                   # Fake seed data for dev/staging only
  tests/                     # RLS and SQL tests
public/ (images/, icons/)
```

**Refactor from the demo:** the demo lived under `/app/*` with static data. Move public pages (listing, animal, shelter) to the `(public)` group so they are server-rendered and indexable; keep authenticated features in `(app)`. Replace `src/data/*` imports with Supabase queries; keep the old data only as `seed.sql` input for dev/staging.

## 4. Data model (v1)

All tables have `id uuid pk default gen_random_uuid()`, `created_at`, `updated_at`. **RLS is enabled on every table, no exceptions.**

- `profiles` (1:1 with `auth.users`): display name, role (`adopter` | `shelter_member` | `private` | `admin`), city, notification prefs
- `organizations`: type (`shelter` | `association` | `breeder`), legal name, region/city, registration data, `verification_status` (`pending` | `verified` | `rejected`), `slug`
- `organization_members`: profile ↔ organization, member role
- `animals`: species, breed, sex, `birth_date`, size, description/story, traits (kids/dogs/cats/apartment), owner (`organization_id` or `profile_id`), location (geography point, **approximate/public**), status
- `animal_health`: vaccinated, sterilized, notes, **microchip number (private)**, document references
- `animal_documents`: files in a **private** bucket, `verified_by`, `verified_at`
- `listings`: animal, type (`adoption` | `gift`; `sale` only if flag), status (`draft` | `pending_review` | `published` | `reserved` | `adopted` | `expired` | `removed`), `published_at`, `expires_at`
- `listing_photos`: storage path, order, alt text
- `inquiries`: listing, from-profile, message, status; `inquiry_messages` for the thread
- `favorites`: profile ↔ listing
- `reports`: listing/profile reported, reason, details, status, handled-by
- `moderation_log`: actor, action, target, reason (append-only)

Rules:
- Public data and private data are **separate tables/columns with separate policies**. Never expose microchip numbers, documents, exact addresses, emails or phone numbers publicly.
- Public coordinates are **fuzzed/approximated** (city or ~1-2 km), never the owner's exact location.
- Types are generated with `supabase gen types`; do not hand-write DB types.

## 5. Security rules (non-negotiable)

1. **RLS on every table**, deny by default. Each policy is covered by a test in `supabase/tests/` that checks who can and cannot read/write (anonymous, other user, owner, org member, admin).
2. **Service-role key never reaches the client** or any `NEXT_PUBLIC_*` variable. Use it only in server-only code, and only when RLS cannot express the need.
3. **Every server action**: authenticate, authorize (ownership/role), validate input with Zod, then act. Never trust client-sent IDs or roles.
4. **Uploads:** validate type and size server-side, **strip EXIF/GPS metadata**, store documents in a private bucket with signed, short-lived URLs, store photos in a public bucket only after moderation rules pass.
5. **Rate limiting + Turnstile** on sign-up, login, inquiries and reports.
6. **No secrets in the repo.** Use `.env.local` (git-ignored) and Vercel/Supabase environment settings. Keep `.env.example` up to date with names only.
7. **Sanitize and escape** all user-generated text; never use `dangerouslySetInnerHTML` with user content.
8. Log moderation and admin actions in `moderation_log`. Admin routes are role-gated on the server, not just hidden in the UI.
9. Before any public launch: security review of auth, RLS, uploads and privacy (external audit recommended).

## 6. Compliance (centralized, to be legally reviewed)

All legal rules live in **`src/lib/compliance.ts`** and are enforced both in Zod schemas and in database constraints/triggers where possible. Do not scatter these rules across components. **Mark every rule as "TO BE REVIEWED BY A LAWYER"**; the EU pet welfare regulation and Italian/regional rules are evolving.

Starting rules to implement (verify before launch):
- **Microchip required** for dogs in a listing (validated format); treat cats per current rules, configurable.
- **Minimum age for rehoming/sale: 60 days.** Block publication of animals younger than that.
- **Seller profile rules:** shelters/associations need verification; private individuals can rehome occasionally with limits (e.g. max litters/animals per period, configurable); breeders only if `ENABLE_BREEDERS` and verified.
- **Listings must show origin and key health information.**
- **No payment before in-person meeting inside the platform**; show scam-prevention guidance on every contact flow.
- **Notice-and-takedown:** a visible "Report" action on every listing and profile, with a documented handling flow and response targets (platform liability under the Digital Services Act).
- **GDPR:** privacy policy, cookie/consent management (analytics only after consent or cookieless), data export and account deletion, data minimization, retention policy for inquiries and documents.
- **Terms of Service** that define the platform as an intermediary and set rules of conduct.

Do not write legal text as if it were final. Produce drafts marked `DRAFT — requires legal review`.

## 7. Design and UX

- **Mobile-first**; the app must also look excellent on desktop. Keep the warm, trustworthy visual identity established in the demo.
- **UI copy in Italian**, easy to find and edit (constants/content files), ready to be moved to an i18n library later if needed.
- **Accessibility:** contrast, focus states, `alt` text (required on uploaded photos), 44px touch targets, `prefers-reduced-motion`, light/dark via CSS variables.
- Curated empty, loading and error states. Clear trust signals (verified badge, document status) and clear scam-prevention messaging.
- Forms: inline validation, helpful errors, save-as-draft for multi-step listing creation.

## 8. SEO

- Server-render public pages with proper `<title>`, meta description, Open Graph, canonical URLs and structured data where appropriate.
- Programmatic pages for city and species (`/adopt/roma/cani`), generated from real data only. **Never index empty or thin pages**: set `noindex` until a minimum number of listings exists.
- Sitemap and robots generated dynamically; exclude drafts, removed listings and authenticated pages.

## 9. Code conventions

- TypeScript `strict`, no `any` without a comment explaining why
- Server Components by default; `"use client"` only for interactivity
- Business logic in `src/server/`, not in components
- Small components, pure functions for filtering and rules
- Small commits with clear messages (e.g. `feat(listings): create listing flow`)
- Every DB change is a **new migration** in `supabase/migrations/` (timestamped). **Never edit an applied migration.** Each migration includes RLS policies for any new table.
- Handle errors explicitly; user-facing errors are friendly and in Italian; technical details go to Sentry, not to the UI.

## 10. Environments and commands

- **Local:** Supabase local stack (`supabase start`)
- **Staging:** separate Supabase project + Vercel preview, seeded with fake data and a visible "staging" banner
- **Production:** separate Supabase project, no fake data


Environment variable names are documented in `.env.example`. **Never run destructive commands against staging or production** (reset, drop, truncate) without explicit confirmation.

## 11. Milestones (continuing from the demo)

Done: **M1** setup, **M2** data (becomes seed), **M3** PWA shell.

4. **Supabase foundation:** local stack, env handling, client/server helpers, middleware, generated types
5. **Schema + RLS v1:** profiles, organizations, animals, listings, photos, with policies and RLS tests
6. **Auth:** sign-up/login (email + Google), profile creation, protected routes, Turnstile + rate limiting
7. **Organizations & verification:** shelter onboarding, document upload (private), admin verification queue
8. **Listing creation & management:** multi-step form, drafts, photo upload (EXIF stripped), compliance validation, publish/reserve/adopted/expire
9. **Public discovery:** listing page, filters, geo search (PostGIS), animal and shelter pages, SEO, sitemap
10. **Inquiries:** contact requests, message threads, notifications by email (Resend), anti-spam
11. **Favorites + account area:** favorites, my animals, my inquiries, data export/deletion
12. **Reports & moderation back-office:** report flow, review queue, takedown, moderation log
13. **Legal & privacy:** terms, privacy, cookie consent, scam-prevention content (drafts for legal review)
14. **Hardening:** security review, RLS audit, e2e tests of critical flows, performance, accessibility, Sentry/PostHog
15. **Staging pilot:** invite 3-5 shelters in Lazio, collect feedback, fix, then launch

Work on **one milestone at a time**. At the end of each, summarize what changed, list the migrations added, and wait for confirmation before continuing.

## 12. Definition of Done (per feature)

- Types, lint and build pass; unit/RLS tests added for new logic and policies
- Critical flows covered by an e2e test
- RLS verified from at least three roles (anonymous, other user, owner)
- No personal data exposed publicly; no secrets in code
- Responsive from 360px to desktop; keyboard and screen-reader basics checked
- Error, empty and loading states handled; copy in Italian
- Lighthouse (mobile) above 90 on public pages

## 13. Behavior rules for Claude

- Follow the milestone order. Do not jump ahead or add features not listed, unless asked.
- **Security and privacy come before speed.** If a shortcut weakens RLS, auth or data protection, do not take it: propose a safe alternative.
- **Ask before:** adding dependencies, changing the data model in a way that breaks existing migrations, any destructive DB operation, or any decision with legal implications.
- Do not invent legal requirements or statistics. Mark uncertain legal rules and claims as **to be reviewed/verified**.
- Never use real personal data in tests, seeds or screenshots.
- When a product decision is ambiguous, propose 2 short options and ask.
- At the end of each task, state what was done, what was tested, and what remains.