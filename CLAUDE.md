# CLAUDE.md — DEMO project "Tailor" (working title)

## 1. What we are building (and what we are NOT)

This is a **demonstration prototype**, not the product. Its purpose is to show the idea to animal shelters and rescue organizations and to gauge their interest.

**Two deliverables, one Next.js project:**
1. **Landing page** (`/`) aimed at shelters/associations: explains the problem, the solution and the benefits, and collects interest through a link to an external form.
2. **Installable PWA prototype** (`/app/*`) with **fake** listings, simulating the experience for both adopters and shelters.

**Business goal:** get a shelter to say "I would use this" within a 3-minute demo. Every decision is judged against that.

### Out of scope (do NOT implement, only "for convenience")
- Authentication, sign-up, login, roles
- Database, ORM, backend, API routes that store data
- Payments, KYC, real file uploads, real messaging
- Push notifications, transactional email, invasive analytics or tracking cookies
- Real data about people, animals or organizations

If a request seems to require any of these, **stop and ask** before proceeding. "Product-like" features (e.g. publish listing, request information) are **simulated**: they show the UI and a confirmation message, but save nothing.

## 2. Stack

- **Next.js** (App Router) + **TypeScript strict**
- **Tailwind CSS** + **shadcn/ui** (only the components we actually need)
- **PWA:** `manifest` + minimal service worker for installability and static caching (prefer a simple, maintained solution; no complex offline logic)
- **Data:** local TypeScript/JSON files in `src/data/`. No network calls for data.
- **Client state:** React state; favorites stored in `localStorage` (with try/catch and a fallback)
- **Icons:** `lucide-react`
- **Package manager:** `bun`
- **Deploy:** Vercel (static site, no secrets)

**Dependency rule:** do not add libraries without a clear reason. Before installing a new one, explain why a native solution is not enough.

## 3. Project structure

```
src/
  app/
    page.tsx                 # Landing page
    app/                     # PWA prototype
      layout.tsx             # Mobile shell: header + bottom nav + demo banner
      page.tsx               # Explore: listings + filters
      animals/[id]/page.tsx  # Animal detail
      shelters/[id]/page.tsx # Shelter profile
      favorites/page.tsx     # Favorites (localStorage)
      shelter/page.tsx       # Shelter area (demo): dashboard + simulated "Publish listing"
    manifest.ts
  components/
    landing/                 # Landing sections
    app/                     # PWA components (AnimalCard, Filters, HealthBadge...)
    ui/                      # shadcn
  data/
    animals.ts               # ~14 fake animals
    shelters.ts              # 3-4 fake shelters
  lib/
    types.ts                 # Shared types
    filters.ts               # Pure, testable filter logic
public/
  images/                    # Freely licensed or generated photos, see §6
  icons/                     # PWA icons (192, 512, maskable)
```

## 4. Language

- **User-facing copy (landing + PWA UI): Italian.** The target audience is Italian shelters and adopters.
- **Code, identifiers, comments, commit messages and this file: English.**
- Keep all UI strings easy to find and edit (constants or dedicated content files), so copy can be changed without touching components.

## 5. Landing page content

Target: shelter/association managers: short on time, not tech-savvy. Tone: human, concrete, respectful of their work. No jargon.

Sections, in order:
1. **Hero:** clear promise (finding homes for animals in a simpler, more reliable way) + two CTAs: "Watch the demo" (→ `/app`) and "I want to try it with my shelter" (→ external form)
2. **The problem:** listings scattered across Facebook and WhatsApp, low-quality contacts, scams, time wasted answering the same questions
3. **The solution:** structured, verifiable animal profile; better-qualified requests; shelter profile
4. **How it works** for the shelter (3 steps)
5. **PWA preview:** mockup/screenshots + link to the demo
6. **What we don't do:** no adoption fees/commissions, no commitment, free for shelters during the pilot
7. **Short FAQ**
8. **Final CTA** + privacy note

**Collecting interest:** no internal form. The button opens an **external form** (Tally) configured via the `NEXT_PUBLIC_INTEREST_FORM_URL` environment variable. If it is missing, fall back to a `mailto:` configured via `NEXT_PUBLIC_CONTACT_EMAIL`. No personal data passes through this site.

Footer: note that the site is a **demonstration prototype**, plus a link to a minimal `/privacy` page (placeholder text, to be reviewed before the link is shared publicly).

## 6. PWA features (all simulated)

**Adopter side**
- **Explore:** grid/list of cards (photo, name, breed, age, city, badges). Filters: species (dog/cat), size, age, "good with kids", fake distance/area
- **Animal detail:** photo gallery, key facts, temperament, compatibility (kids, dogs, cats, apartment), **health section** (microchip, vaccinations, sterilization) with a "Verified documents" badge *(demonstration only)*, originating shelter, "Request information" button
- **Request information:** opens a form; on submit shows "Request sent (demo)". It **neither sends nor stores anything**
- **Favorites:** stored in `localStorage`
- **Shelter profile:** description, available animals, completed adoptions (fake figure)

**Shelter side (`/app/shelter`)**
- Demo dashboard with the shelter's animals and incoming requests (fake data)
- "Publish listing": multi-step form with a preview of the resulting profile. On submit it shows the profile and a "Demo: not saved" message

**Phase 2:** adopter compatibility quiz, static "Lost & found" section.

## 7. Fake data and images (important rules)

- **Invented shelters** with clearly fictional names. Never use names of real shelters, associations or people.
- **Invented animals:** plausible names, stories and traits that do not refer to real cases.
- **Microchip numbers:** never realistic. Use an obviously fake format (e.g. `DEMO-000000001`).
- **Demo banner always visible** in the PWA: "Demonstration version — fake data and listings". Never remove or hide it.
- **Images:** only with a license that permits use (e.g. Unsplash/Pexels with compatible license, or generated images). Never copy photos from listings, social media or shelter websites. Record the source of every image in `public/images/CREDITS.md`.
- Optimized formats (WebP/AVIF), descriptive `alt` text, declared dimensions.

## 8. Data types (reference)

```ts
type Species = "dog" | "cat";
type Size = "small" | "medium" | "large";

interface Shelter {
  id: string;
  name: string;            // fictional name
  city: string;
  region: string;          // e.g. "Lazio"
  description: string;
  adoptionsCompleted: number; // fake
  verified: boolean;       // demonstration only
}

interface Animal {
  id: string;
  name: string;
  species: Species;
  breed: string;           // "Mixed breed" is allowed
  sex: "M" | "F";
  birthDate: string;       // ISO
  size: Size;
  shelterId: string;
  photos: string[];
  story: string;
  traits: { kids: boolean; dogs: boolean; cats: boolean; apartment: boolean };
  health: {
    microchip: string;     // DEMO-... format
    vaccinated: boolean;
    sterilized: boolean;
    documentsVerified: boolean; // demonstration only
  };
}
```

## 9. Design and UX

- **Mobile-first.** The PWA is designed for ~375px screens with bottom navigation. The landing page must be flawless on both mobile and desktop.
- **Visual tone:** warm, reassuring, trustworthy. Avoid a generic "SaaS template" look. Warm palette with one primary and one accent color, readable typography.
- **Accessibility:** adequate contrast, visible focus, `alt` on images, touch targets ≥ 44px, respect `prefers-reduced-motion`.
- **Light/dark theme:** colors as CSS variables; support `prefers-color-scheme`.
- Light, purposeful animations, never decorative at the cost of performance.
- Polished empty, loading and "no results" states: they stand out in a demo.

## 10. Code conventions

- TypeScript `strict`, no `any` (if unavoidable, comment why)
- Small, functional components; filter logic in `lib/` as pure functions
- Server Components by default; `"use client"` only where interactivity is needed
- No duplicated copy: landing content in constants or dedicated files
- No `console.log` in final code
- Small commits with clear messages (e.g. `feat: animal detail page`, `fix: size filter`)
- If `localStorage` is unavailable or fails, the app must keep working


## 11. Work order (milestones)

1. **Setup:** Next.js project, Tailwind, shadcn, folder structure, types, ESLint
2. **Data:** `shelters.ts` and `animals.ts` with fake content, images and `CREDITS.md`
3. **PWA shell:** layout, bottom nav, demo banner, manifest and icons
4. **Explore + filters**
5. **Animal detail + simulated information request**
6. **Shelter profile + favorites**
7. **Simulated shelter area** (dashboard and publishing with preview)
8. **Full landing page**, linking to the demo and the external form
9. **Polish:** responsive, accessibility, performance, test on a real phone, PWA install
10. **Deploy** to Vercel

Work on **one milestone at a time**, show the result and wait for confirmation before the next.

## 12. Quality bar (Definition of Done)

- The PWA installs on Android and iOS and opens full screen
- Lighthouse (mobile): Performance, Accessibility, Best Practices and SEO above 90
- No console errors, no broken layout from 360px up to desktop
- Every simulated action clearly signals that it is a demo
- No personal data collected or transmitted by the site
- A non-technical person can complete the full demo walkthrough in under 3 minutes

## 13. Behavior rules for Claude

- Stay within the scope in §1. Do not anticipate "product" features.
- Do not invent real data (shelters, people, microchip numbers, statistics). Statistics on the landing page must be either avoided or marked **to verify** with a source.
- Do not make legal or health claims in landing copy without flagging them as **to be reviewed**.
- When a product or copy decision is ambiguous, propose 2 short options and ask, rather than choosing silently.
- At the end of each task, explain in a few lines what you did and what remains.