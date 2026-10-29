begin;
select plan(7);

-- Test 1: Anonymous cannot read or insert favorites
set local role anon;
select throws_ok(
  'select * from public.favorites',
  '42501',
  NULL,
  'anon cannot select from favorites'
);

-- Test 2: Authenticated user can select own favorites
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select lives_ok(
  'select * from public.favorites',
  'authenticated user can query favorites'
);

-- Check table and RLS existence
select has_table('public', 'favorites', 'public.favorites exists');
select table_has_index('public', 'favorites', 'favorites_profile_idx', 'favorites_profile_idx index exists');
select table_has_index('public', 'favorites', 'favorites_listing_idx', 'favorites_listing_idx index exists');
select has_function('public', 'export_user_data', ARRAY['uuid'], 'export_user_data function exists');
select function_is_security_definer('public', 'export_user_data', ARRAY['uuid'], 'export_user_data is security definer');

select * from finish();
rollback;
