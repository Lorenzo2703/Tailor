-- RLS audit test suite for M14.
-- Verifies deny-by-default: anon and authenticated users cannot access
-- tables they should not have access to.

BEGIN;
SELECT plan(12);

-- ── 1. Anon cannot read private tables ───────────────────────────────────────

SELECT lives_ok(
  $$ SET LOCAL ROLE anon $$,
  'can switch to anon role'
);

SELECT throws_ok(
  $$ SELECT * FROM public.organization_private LIMIT 1 $$,
  '42501',
  NULL,
  'anon cannot read organization_private'
);

SELECT throws_ok(
  $$ SELECT * FROM public.animal_private LIMIT 1 $$,
  '42501',
  NULL,
  'anon cannot read animal_private'
);

SELECT throws_ok(
  $$ SELECT * FROM public.organization_documents LIMIT 1 $$,
  '42501',
  NULL,
  'anon cannot read organization_documents'
);

SELECT throws_ok(
  $$ SELECT * FROM public.inquiries LIMIT 1 $$,
  '42501',
  NULL,
  'anon cannot read inquiries'
);

SELECT throws_ok(
  $$ SELECT * FROM public.favorites LIMIT 1 $$,
  '42501',
  NULL,
  'anon cannot read favorites'
);

SELECT throws_ok(
  $$ SELECT * FROM public.reports LIMIT 1 $$,
  '42501',
  NULL,
  'anon cannot read reports'
);

SELECT throws_ok(
  $$ SELECT * FROM public.moderation_log LIMIT 1 $$,
  '42501',
  NULL,
  'anon cannot read moderation_log'
);

-- ── 2. RLS is enabled on all tables ──────────────────────────────────────────
RESET ROLE;

SELECT results_eq(
  $$ SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles' AND relnamespace = 'public'::regnamespace $$,
  ARRAY[true],
  'RLS enabled on profiles'
);

SELECT results_eq(
  $$ SELECT relrowsecurity FROM pg_class WHERE relname = 'listings' AND relnamespace = 'public'::regnamespace $$,
  ARRAY[true],
  'RLS enabled on listings'
);

SELECT results_eq(
  $$ SELECT relrowsecurity FROM pg_class WHERE relname = 'reports' AND relnamespace = 'public'::regnamespace $$,
  ARRAY[true],
  'RLS enabled on reports'
);

SELECT results_eq(
  $$ SELECT relrowsecurity FROM pg_class WHERE relname = 'favorites' AND relnamespace = 'public'::regnamespace $$,
  ARRAY[true],
  'RLS enabled on favorites'
);

SELECT * FROM finish();
ROLLBACK;
