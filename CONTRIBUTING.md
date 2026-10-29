# Contributing to Tailor (Verified Adoptions)

Welcome to the team! Before contributing, please take a moment to review these guidelines. They ensure our codebase stays secure, maintainable, and aligned with legal and welfare requirements.

---

## 🛠️ Environment Prerequisites

Make sure you have the following installed on your machine:
- **Node.js** (v20+ or v22+) & **Bun** (`bun@1.3.10` or npm)
- **Docker Desktop** (running, for Supabase local stack)
- **Supabase CLI** (can also be run via `npx supabase`)
- **Git**

---

## 🏗️ Development Lifecycle

1. **Local Setup:**
   - Clone repo and run `bun install` or `npm install`.
   - Copy `.env.example` to `.env.local`.
   - Run `npm run db:start` to spin up local Supabase containers.
   - Run `npm run dev` to start the Next.js server on `http://localhost:3000`.

2. **Branching Strategy:**
   - Branch off `main` with descriptive prefixes:
     - `feat/<feature-name>`: New feature or user story
     - `fix/<bug-name>`: Bug fixes
     - `refactor/<name>`: Code improvements without functional change
     - `test/<name>`: New tests or test improvements
     - `docs/<name>`: Documentation updates

3. **Commit Messages:**
   - Use [Conventional Commits](https://www.conventionalcommits.org/):
     - `feat(listings): add photo reordering`
     - `fix(auth): redirect to dashboard after verification`
     - `test(compliance): add test for 60-day minimum age rule`

---

## 🔐 Core Security & Architectural Rules

1. **Row-Level Security (RLS) is Non-Negotiable:**
   - Every single PostgreSQL table MUST have RLS enabled with default deny.
   - Never write policies that unintentionally expose private information (e.g. microchip numbers, exact coordinates, identity documents).
   - Test RLS policies for: unauthenticated / anonymous users, regular users, resource owners, and admin users.

2. **Never Expose Sensitive Keys:**
   - The `SUPABASE_SERVICE_ROLE_KEY` must **never** be exposed in client code or prefixed with `NEXT_PUBLIC_`.
   - Only use the service role key inside server-only scripts where RLS cannot express the permission model.

3. **Validation & Server Actions:**
   - Never trust input from the client.
   - All mutations must be implemented as Server Actions in `src/server/actions/`.
   - Each Server Action must:
     1. Authenticate user session.
     2. Authorize permissions / check roles.
     3. Validate payloads using Zod schemas from `src/lib/validation/`.
     4. Execute database operations safely.

4. **Compliance & Legal Centralization:**
   - Statutory pet welfare constraints (microchip rules, minimum age >= 60 days, limits on private rehoming) must reside exclusively in `src/lib/compliance.ts`.
   - Do not scatter custom compliance logic in random components.

5. **Exif & Image Safety:**
   - Any uploaded user image must be stripped of EXIF and GPS coordinates before being saved to public storage.

---

## 🧪 Testing & Quality Checklist

Before submitting a Pull Request, run the following commands and ensure all pass:

```bash
# 1. Run Linting
npm run lint

# 2. Run Unit & Validation Tests
npm run test

# 3. Check Production Build
npm run build
```

---

## 📬 Submitting a Pull Request (PR)

When opening a PR on GitHub:
- Include a concise summary of the changes.
- Reference relevant milestones or issue tickets.
- List any database migrations added (`supabase/migrations/`).
- Provide manual testing steps or screenshots of UI changes.
- Ensure that CI checks pass and there are no merge conflicts.
