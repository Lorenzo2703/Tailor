# Graph Report - src  (2026-11-09)

## Corpus Check
- Corpus is ~33,662 words - fits in a single context window. You may not need a graph.

## Summary
- 502 nodes · 1223 edges · 17 communities (15 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_listings.ts  requireUser()  page.tsx|listings.ts / requireUser() / page.tsx]]
- [[_COMMUNITY_public.ts  adopt-page.tsx  page.tsx|public.ts / adopt-page.tsx / page.tsx]]
- [[_COMMUNITY_auth.ts  getSiteUrl()  checkRateLimit()|auth.ts / getSiteUrl() / checkRateLimit()]]
- [[_COMMUNITY_organizations.ts  session.ts  page.tsx|organizations.ts / session.ts / page.tsx]]
- [[_COMMUNITY_inquiries.ts  page.tsx|inquiries.ts / page.tsx]]
- [[_COMMUNITY_favorites.ts  page.tsx  notifications.ts|favorites.ts / page.tsx / notifications.ts]]
- [[_COMMUNITY_server.ts  createClient()  database.types.ts|server.ts / createClient() / database.types.ts]]
- [[_COMMUNITY_public-shell.tsx  plain-shell.tsx  theme-toggle.tsx|public-shell.tsx / plain-shell.tsx / theme-toggle.tsx]]
- [[_COMMUNITY_rules.test.ts  listings.ts  compliance.ts|rules.test.ts / listings.ts / compliance.ts]]
- [[_COMMUNITY_reports.ts  page.tsx|reports.ts / page.tsx]]
- [[_COMMUNITY_layout.tsx  cookie-consent-banner.tsx  legalContent|layout.tsx / cookie-consent-banner.tsx / legalContent]]
- [[_COMMUNITY_types.ts  animals.ts  shelters.ts|types.ts / animals.ts / shelters.ts]]
- [[_COMMUNITY_global-not-found.tsx  GlobalNotFound()  metadata|global-not-found.tsx / GlobalNotFound() / metadata]]
- [[_COMMUNITY_register()  instrumentation-node.ts  instrumentation.ts|register() / instrumentation-node.ts / instrumentation.ts]]

## God Nodes (most connected - your core abstractions)
1. `requireUser()` - 43 edges
2. `createClient()` - 17 edges
3. `getSiteUrl()` - 15 edges
4. `listingContent` - 15 edges
5. `checkRateLimit()` - 15 edges
6. `safeNextPath()` - 11 edges
7. `inquiryContent` - 11 edges
8. `getSupabaseEnv()` - 11 edges
9. `getCityBySlug()` - 11 edges
10. `organizationContent` - 10 edges

## Surprising Connections (you probably didn't know these)
- `NewOrganizationPage()` --calls--> `requireUser()`  [EXTRACTED]
  app/(app)/organizations/new/page.tsx → server/queries/session.ts
- `robots()` --calls--> `getSiteUrl()`  [EXTRACTED]
  app/robots.ts → lib/site.ts
- `AdminReportsPage()` --calls--> `requireAdmin()`  [EXTRACTED]
  app/(admin)/admin/reports/page.tsx → server/queries/session.ts
- `AccountPage()` --calls--> `requireUser()`  [EXTRACTED]
  app/(app)/account/page.tsx → server/queries/session.ts
- `ContactPage()` --calls--> `requireUser()`  [EXTRACTED]
  app/(app)/animals/[slug]/contact/page.tsx → server/queries/session.ts

## Communities (17 total, 2 thin omitted)

### Community 0 - "listings.ts / requireUser() / page.tsx"
Cohesion: 0.07
Nodes (57): basicsKeys, createListingDraft(), databaseMessage(), deleteListingPhoto(), fail(), finishListingPhotoUpload(), formValues(), manageListing() (+49 more)

### Community 1 - "public.ts / adopt-page.tsx / page.tsx"
Cohesion: 0.08
Nodes (46): Content(), metadata, generateMetadata(), generateMetadata(), AdoptCityPage(), generateMetadata(), publicContent, buildQueryString() (+38 more)

### Community 2 - "auth.ts / getSiteUrl() / checkRateLimit()"
Cohesion: 0.08
Nodes (37): emailKey(), fail(), signIn(), signInWithGoogle(), signUp(), text(), robots(), sitemap() (+29 more)

### Community 3 - "organizations.ts / session.ts / page.tsx"
Cohesion: 0.09
Nodes (34): createOrganization(), deleteOrganizationDocument(), fail(), messageForDatabaseError(), orgIdSchema, resubmitOrganization(), reviewOrganization(), text() (+26 more)

### Community 4 - "inquiries.ts / page.tsx"
Cohesion: 0.09
Nodes (35): AccountPage(), metadata, signOut(), createInquiry(), databaseMessage(), fail(), postInquiryMessage(), setInquiryStatus() (+27 more)

### Community 5 - "favorites.ts / page.tsx / notifications.ts"
Cohesion: 0.08
Nodes (26): deleteAccount(), exportUserData(), toggleFavorite(), AccountGdprSection(), FavoriteButton(), FavoriteButtonProps, favoritesContent, buildInquiryEmail() (+18 more)

### Community 6 - "server.ts / createClient() / database.types.ts"
Cohesion: 0.12
Nodes (22): ReportStatus, GET(), image(), NavAuthLink(), config, proxy(), createAnonClient(), createClient() (+14 more)

### Community 7 - "public-shell.tsx / plain-shell.tsx / theme-toggle.tsx"
Cohesion: 0.09
Nodes (15): metadata, metadata, AppNav(), NavItem, navItems, ServiceWorkerRegistration(), metadata, PlainShell() (+7 more)

### Community 8 - "rules.test.ts / listings.ts / compliance.ts"
Cohesion: 0.11
Nodes (23): AllowedDocumentMime, AnimalOrigin, animalOrigins, listingRules, OrganizationDocumentType, ageInDays(), isOldEnough(), isValidMicrochip() (+15 more)

### Community 9 - "reports.ts / page.tsx"
Cohesion: 0.15
Nodes (18): resolveReport(), submitReport(), AdminReportCard(), AdminReportCardProps, reportContent, ReportReason, reportReasons, reportStatuses (+10 more)

### Community 10 - "layout.tsx / cookie-consent-banner.tsx / legalContent"
Cohesion: 0.11
Nodes (11): geistMono, geistSans, metadata, StagingBanner(), legalContent, metadata, initPostHogAfterConsent(), PostHogProvider() (+3 more)

### Community 11 - "types.ts / animals.ts / shelters.ts"
Cohesion: 0.24
Nodes (7): animals, shelters, Animal, Sex, Shelter, Size, Species

## Knowledge Gaps
- **103 isolated node(s):** `config`, `metadata`, `geistSans`, `geistMono`, `metadata` (+98 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `requireUser()` connect `listings.ts / requireUser() / page.tsx` to `auth.ts / getSiteUrl() / checkRateLimit()`, `organizations.ts / session.ts / page.tsx`, `inquiries.ts / page.tsx`, `favorites.ts / page.tsx / notifications.ts`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Why does `createClient()` connect `server.ts / createClient() / database.types.ts` to `listings.ts / requireUser() / page.tsx`, `auth.ts / getSiteUrl() / checkRateLimit()`, `organizations.ts / session.ts / page.tsx`, `inquiries.ts / page.tsx`, `favorites.ts / page.tsx / notifications.ts`, `reports.ts / page.tsx`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `getSiteUrl()` connect `auth.ts / getSiteUrl() / checkRateLimit()` to `public.ts / adopt-page.tsx / page.tsx`, `layout.tsx / cookie-consent-banner.tsx / legalContent`, `favorites.ts / page.tsx / notifications.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **What connects `config`, `metadata`, `geistSans` to the rest of the system?**
  _103 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `listings.ts / requireUser() / page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07245386192754613 - nodes in this community are weakly interconnected._
- **Should `public.ts / adopt-page.tsx / page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `auth.ts / getSiteUrl() / checkRateLimit()` be split into smaller, more focused modules?**
  _Cohesion score 0.08082706766917293 - nodes in this community are weakly interconnected._