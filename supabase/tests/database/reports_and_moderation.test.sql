begin;
select plan(7);

-- Test 1: Anonymous cannot read or insert reports
set local role anon;
select throws_ok(
  'select * from public.reports',
  '42501',
  NULL,
  'anon cannot select from reports'
);

-- Test 2: Authenticated user can query reports
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select lives_ok(
  'select * from public.reports',
  'authenticated user can query reports'
);

-- Check table and RLS existence
select has_table('public', 'reports', 'public.reports exists');
select has_index('public', 'reports', 'reports_status_idx', 'reports_status_idx index exists');
select has_index('public', 'reports', 'reports_listing_idx', 'reports_listing_idx index exists');
select has_function('public', 'admin_resolve_report', ARRAY['uuid', 'public.report_status', 'boolean', 'text'], 'admin_resolve_report exists');
select is_definer('public', 'admin_resolve_report', 'admin_resolve_report is security definer');

select * from finish();
rollback;
