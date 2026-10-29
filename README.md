# Tailor — Verified Adoptions Platform 🐾

> **Verified Adoptions** (working title: *Tailor*) is a trust-first platform designed to facilitate responsible animal adoptions and rehoming (primarily dogs and cats). It connects verified animal shelters/associations and private individuals with prospective adopters, with a core focus on animal welfare, transparency, traceability, and strict compliance with pet rehoming regulations.

---

## 📖 Table of Contents
- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [Architecture & Key Concepts](#-architecture--key-concepts)
- [Prerequisites & Tools](#-prerequisites--tools)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Configuration & Environment Variables](#-configuration--environment-variables)
- [Available Scripts](#-available-scripts)
- [Development Guidelines & Conventions](#-development-guidelines--conventions)
- [Product Roadmap & Current TODOs](#-product-roadmap--current-todos)
- [Contributing & PR Workflow](#-contributing--pr-workflow)

---

## 🎯 Project Overview

Unlike generic classifieds platforms, this project prioritizes **trust, verification, and animal safety**:
- **Target Audience:**
  - **Adopters:** Browse verified listings, use geographical/radius search, submit structured inquiries, and save favorites.
  - **Shelters & Rescue Associations:** Onboard with official registration credentials, manage animal profiles, track adoption requests (free of charge).
  - **Private Individuals:** Occasional rehoming (gift/adoption only; no sales allowed at launch).
  - **Administrators / Moderators:** Verify organizations, review flagged listings/reports, moderate user-submitted content.
- **Pilot Scope:** Lazio, Italy (with Italian UI copy).
- **Core Principles:**
  - Mandatory microchip validation for dogs.
  - Minimum animal age check (60+ days) before publication.
  - No direct animal sales or in-platform payments at launch (guarded by feature flags).
  - EXIF/GPS metadata stripped from all uploaded pictures.
  - Privacy by design: public coordinates are fuzzed; sensitive medical and owner details are strictly guarded by Row-Level Security (RLS).

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js](https://nextjs.org/) (App Router, Server Components, Server Actions) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict mode) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL + PostGIS + RLS + Auth + Storage) |
| **Validation** | [Zod](https://zod.dev/) |
| **Rate Limiting** | [Upstash Redis](https://upstash.com/) (`@upstash/ratelimit`) |
| **Bot Protection** | [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) |
| **Emails** | [Resend](https://resend.com/) |
| **Testing** | [Vitest](https://vitest.dev/) (unit & domain logic tests) |
| **Package Manager** | [Bun](https://bun.sh/) (or `npm` / `pnpm`) |

---

## 🏗 Architecture & Key Concepts

```
src/
├── app/
│   ├── (admin)/             # Moderation and shelter verification back-office (role-gated)
│   ├── (app)/               # Authenticated user dashboard (favorites, inquiries, my-animals)
│   ├── (auth)/              # Authentication flows (login, register, callbacks)
│   ├── (marketing)/         # Landing page, About, FAQ, Legal pages (Terms, Privacy)
│   ├── (public)/            # SEO-indexable pages: /animals/[slug], /shelters/[slug], /adopt/[city]
│   └── api/                 # Webhooks / background cron jobs only (no generic API routes)
├── components/              # Modular UI components (admin, app, forms, listings, organizations, ui)
├── lib/
│   ├── compliance.ts        # Centralized legal & animal welfare checks (microchip, age >= 60d)
│   ├── flags.ts             # Feature flags (ENABLE_BREEDERS, ENABLE_SALE, ENABLE_PAYMENTS)
│   ├── supabase/            # Client, server, middleware Supabase helpers & database types
│   └── validation/          # Shared Zod schemas (auth, inquiries, listings, organizations)
├── server/
│   ├── actions/             # Server Actions (Mutations: auth check + permission + Zod validation)
│   └── queries/             # Data fetchers (Reads)
supabase/
├── migrations/              # Incremental SQL migrations with RLS policies
├── seed.sql                 # Sample test data for local development
└── config.toml              # Local Supabase CLI configuration
```

### 🔒 Non-Negotiable Security Rules
1. **Row-Level Security (RLS):** Enabled on *every* database table with default deny.
2. **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to the client or `NEXT_PUBLIC_*` variables.
3. **Data Segregation:** Public tables/columns vs. private records (microchip ID, full address, identity documents) have segregated access policies.
4. **Server Action Checklist:** Always verify authentication -> verify authorization/roles -> validate input via Zod schema -> execute database operation.

---

## 🛠 Prerequisites & Tools

To run and contribute to this project, install the following tools:

1. **Node.js** (v20+ or v22+) & **Bun** (`bun@1.3.10` is used by the lockfile, or `npm` / `pnpm`).
2. **Docker Desktop** (Required to run the local Supabase stack via the Supabase CLI).
3. **Supabase CLI**:
   - macOS / Linux: `brew install supabase/tap/supabase`
   - Windows (via Scoop): `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git && scoop install supabase`
   - Or run with npx: `bunx supabase ...`
4. **Git** configured with your user details.

---

## 🚀 Getting Started & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/<your-username-or-org>/Tailor.git
cd Tailor
```

### 2. Install dependencies
```bash
bun install
# or
npm install
```

### 3. Start local Supabase services
Make sure Docker is running, then initialize and start Supabase:
```bash
bun run db:start
# or: bunx supabase start
```
*Tip: Once started, run `bun run db:status` to see local API keys, Supabase Studio URL (`http://127.0.0.1:54323`), and connection strings.*

### 4. Configure environment variables
Copy the template to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the values using the credentials output from `bun run db:status`. For development:
- `NEXT_PUBLIC_SUPABASE_URL`: e.g. `http://127.0.0.1:54321`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Local anon key from `bun run db:status`
- `SUPABASE_SERVICE_ROLE_KEY`: Local service_role key from `bun run db:status`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` & `TURNSTILE_SECRET_KEY`: Use [Cloudflare Turnstile test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) (`1x00000000000000000000AA` / `1x0000000000000000000000000000000000000000AA`).

### 5. Start the Next.js development server
```bash
bun run dev
# or
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Available Scripts

| Command | Description |
|---|---|
| `bun run dev` / `bun run dev` | Starts the Next.js development server (Turbopack enabled) |
| `bun run build` | Compiles the production build |
| `bun run start` | Starts production server |
| `bun run lint` | Runs ESLint check across all files |
| `bun run test` | Runs unit and validation tests via Vitest |
| `bun run env:local` | Switches `.env.local` to point to local WSL/Docker Supabase |
| `bun run env:remote` | Switches `.env.local` to point to online Supabase project |
| `bun run db:start` | Boots local Supabase Docker containers (Postgres, Studio, Storage, Inbucket) |
| `bun run db:stop` | Stops local Supabase containers |
| `bun run db:status` | Displays connection details and keys for local Supabase |
| `bun run db:types` | Regenerates `src/lib/supabase/database.types.ts` from local database schema |
| `bun run db:types:remote` | Regenerates TypeScript types from linked remote Supabase project |
| `bun run db:link` | Links Supabase CLI to your remote project (`supabase link --project-ref <id>`) |
| `bun run db:push` | Pushes local migrations to remote Supabase database |
| `bun run db:pull` | Pulls remote schema changes into local migrations |

---

## 🔄 Switching Between Local (WSL / Docker) and Remote (Cloud) Supabase

You can easily toggle between your local Dockerized Supabase running in WSL and an online Supabase project:

### 1. Initial Setup
Create two environment profile files (both are git-ignored):
- **`.env.local.local`**: Copy from `.env.local.example` and insert keys from `bun run db:status` (WSL / Docker).
- **`.env.local.remote`**: Copy from `.env.remote.example` and insert keys from your Supabase Cloud Dashboard (**Settings -> API**).

### 2. Switch with one command
```bash
# Switch to Local WSL/Docker Supabase:
bun run env:local

# Switch to Online Supabase:
bun run env:remote
```

### 3. Syncing Migrations to Remote Supabase
When you want to deploy local migrations to your online Supabase instance:
```bash
# 1. Login to Supabase CLI (if not already logged in)
bunx supabase login

# 2. Link your remote project
bunx supabase link --project-ref <your-project-ref>

# 3. Push your migrations
bun run db:push

# 4. Generate types from remote
bun run db:types:remote
```

---

## 📐 Development Guidelines & Conventions

### 1. Database Migrations
- Never edit an existing migration file once applied. Always create a new migration:
  ```bash
  bunx supabase migration new <descriptive_name>
  ```
- Ensure any new table includes `id uuid primary key default gen_random_uuid()`, `created_at`, `updated_at`, and an explicit `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
- Update TypeScript types after migrations with `bun run db:types`.

### 2. Code Organization
- **Server Components:** Default choice for pages and layouts. Only add `"use client"` when component requires React state, event listeners, or browser APIs.
- **Server Actions:** Place write operations in `src/server/actions/`. Validate all input with schemas from `src/lib/validation/`.
- **Compliance Rules:** All legal, statutory, or animal protection constraints reside in `src/lib/compliance.ts`. Do not hardcode validation rules elsewhere.
- **UI Copy:** All user-facing texts must be in Italian.

---

## 📋 Product Roadmap & Current TODOs

The project follows sequential milestone delivery:

- [x] **Milestone 1 — Setup & Tooling**: Base configuration, Next.js, Tailwind v4, linting, tests.
- [x] **Milestone 2 — Mock Data & Seeds**: Initial animal & shelter data structures.
- [x] **Milestone 3 — PWA Shell & Layouts**: Responsive navigation, mobile bottom bar, manifest, theme setup.
- [x] **Milestone 4 — Supabase Foundation**: Local stack, RLS configurations, server/client Supabase helpers, DB types.
- [x] **Milestone 5 — Core Schemas & Validation**: Profiles, organizations, animals, listings, photos, and compliance Zod rules.
- [x] **Milestone 6 — Auth & Account Management**: Email & OAuth login, profile registration, Turnstile bot checks, rate limiting.
- [x] **Milestone 7 — Organization & Shelter Onboarding**: Shelter verification flow, document submission, admin moderation dashboard.
- [x] **Milestone 8 — Listing Creation**: Multi-step animal listing form, photo upload, draft saving, compliance checks.
- [x] **Milestone 9 — Public Discovery & Search**: Listing grid, filters, PostGIS location radius search, animal & shelter detail pages, SEO metadata.
- [x] **Milestone 10 — Inquiries & Messaging**: Contact forms, in-app inquiry threads, Resend email notifications, anti-spam safeguards.
- [x] **Milestone 11 — Favorites & User Portal**: Saved listings, "My Animals" management dashboard, GDPR data export & deletion.
- [x] **Milestone 12 — Moderation & Reporting**: Report flows, takedown capabilities, append-only `moderation_log`.
- [x] **Milestone 13 — Legal, Privacy & Compliance**: Finalize Terms of Service, Privacy Policy, Cookie banner, scam prevention guides.
- [x] **Milestone 14 — Hardening & Production Readiness**: Full RLS audit, end-to-end tests (Playwright), Sentry & PostHog telemetry.
- [x] **Milestone 15 — Staging Pilot**: Pilot onboarding with 3–5 partner shelters in Lazio (see [Pilot Onboarding Guide](docs/PILOT_ONBOARDING.md) and [Deployment Guide](docs/DEPLOYMENT.md)).

---

## 🤝 Contributing & PR Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Commit your changes with conventional commit syntax (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).
3. Ensure all tests and linting pass before pushing:
   ```bash
   bun run lint
   bun run test
   ```
4. Push your branch and open a Pull Request with a clear description of the problem solved, testing steps, and relevant screenshots.

