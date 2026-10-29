begin;
select no_plan();

-- Helpers: run a statement as anon (uid null) or as an authenticated user, then restore the role.
create schema tests;

create function tests.run_as(uid uuid)
returns void
language plpgsql
as $$
begin
  execute 'reset role';
  if uid is null then
    perform set_config('request.jwt.claims', '', true);
    perform set_config('role', 'anon', true);
  else
    perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
  end if;
end;
$$;

-- Rows returned/affected by the statement; raises if the statement fails.
create function tests.rows(uid uuid, stmt text)
returns bigint
language plpgsql
as $$
declare
  n bigint;
begin
  perform tests.run_as(uid);
  execute stmt;
  get diagnostics n = row_count;
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  return n;
end;
$$;

-- 'ok' if the statement succeeds, otherwise its SQLSTATE.
create function tests.err(uid uuid, stmt text)
returns text
language plpgsql
as $$
begin
  perform tests.run_as(uid);
  begin
    execute stmt;
  exception when others then
    execute 'reset role';
    perform set_config('request.jwt.claims', '', true);
    return sqlstate;
  end;
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  return 'ok';
end;
$$;

-- Fixtures (fake data only)

insert into auth.users (id, email) values
  ('10000000-0000-0000-0000-000000000001', 'private@example.test'),
  ('10000000-0000-0000-0000-000000000002', 'other@example.test'),
  ('10000000-0000-0000-0000-000000000003', 'owner1@example.test'),
  ('10000000-0000-0000-0000-000000000004', 'owner2@example.test'),
  ('10000000-0000-0000-0000-000000000005', 'admin@example.test');

update public.profiles set role = 'private' where id = '10000000-0000-0000-0000-000000000001';
update public.profiles set role = 'shelter_member'
  where id in ('10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004');
update public.profiles set role = 'admin' where id = '10000000-0000-0000-0000-000000000005';

insert into public.organizations (id, type, name, slug, region, city, verification_status) values
  ('20000000-0000-0000-0000-000000000001', 'shelter', 'Rifugio Test Uno', 'rifugio-test-uno', 'Lazio', 'Roma', 'verified'),
  ('20000000-0000-0000-0000-000000000002', 'shelter', 'Rifugio Test Due', 'rifugio-test-due', 'Lazio', 'Latina', 'pending');

insert into public.organization_private (organization_id, legal_name, contact_email) values
  ('20000000-0000-0000-0000-000000000001', 'Test Uno APS', 'uno@example.test'),
  ('20000000-0000-0000-0000-000000000002', 'Test Due APS', 'due@example.test');

insert into public.organization_members (organization_id, profile_id, member_role) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'owner'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'owner');

insert into public.animals (id, name, species, sex, birth_date, size, city, organization_id, profile_id) values
  ('30000000-0000-0000-0000-000000000001', 'Privato Pubblicato', 'dog', 'M', '2022-01-01', 'medium', 'Roma', null, '10000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', 'Org1 Bozza', 'cat', 'F', '2022-01-01', 'small', 'Roma', '20000000-0000-0000-0000-000000000001', null),
  ('30000000-0000-0000-0000-000000000003', 'Org1 Pubblicato', 'dog', 'F', '2022-01-01', 'large', 'Roma', '20000000-0000-0000-0000-000000000001', null),
  ('30000000-0000-0000-0000-000000000004', 'Org2 Pubblicato', 'cat', 'M', '2022-01-01', 'small', 'Latina', '20000000-0000-0000-0000-000000000002', null),
  ('30000000-0000-0000-0000-000000000005', 'Privato Bozza', 'dog', 'F', '2022-01-01', 'small', 'Roma', null, '10000000-0000-0000-0000-000000000001');

insert into public.animal_private (animal_id, microchip_number) values
  ('30000000-0000-0000-0000-000000000001', 'DEMO-TEST-0001'),
  ('30000000-0000-0000-0000-000000000002', 'DEMO-TEST-0002'),
  ('30000000-0000-0000-0000-000000000003', 'DEMO-TEST-0003'),
  ('30000000-0000-0000-0000-000000000004', 'DEMO-TEST-0004');

insert into public.animal_health (animal_id, vaccinated, sterilized) values
  ('30000000-0000-0000-0000-000000000001', true, true),
  ('30000000-0000-0000-0000-000000000002', true, false);

insert into public.listings (id, animal_id, type, status) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'adoption', 'published'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'adoption', 'draft'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'adoption', 'published'),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'adoption', 'published'),
  ('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000005', 'gift', 'draft');

insert into public.listing_photos (listing_id, storage_path, position, alt_text) values
  ('40000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001/p1.webp', 0, 'Cane seduto'),
  ('40000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002/p2.webp', 0, 'Gatta sul divano');

-- Structure

select ok(
  not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
  ),
  'RLS is enabled on every public table'
);

-- Anonymous

select is(tests.rows(null, 'select * from public.organizations'), 1::bigint, 'anon sees only verified organizations');
select is(tests.rows(null, 'select * from public.animals'), 3::bigint, 'anon sees only animals with a public listing');
select is(tests.rows(null, 'select * from public.listings'), 3::bigint, 'anon sees only published listings');
select is(tests.rows(null, 'select * from public.listing_photos'), 1::bigint, 'anon sees photos of public listings only');
select is(tests.rows(null, 'select * from public.animal_health'), 1::bigint, 'anon sees health facts of public animals only');
select is(tests.err(null, 'select * from public.profiles'), '42501', 'anon cannot read profiles');
select is(tests.err(null, 'select * from public.animal_private'), '42501', 'anon cannot read microchips');
select is(tests.err(null, 'select * from public.organization_private'), '42501', 'anon cannot read organization private data');
select is(tests.err(null, 'select * from public.organization_members'), '42501', 'anon cannot read memberships');
select is(
  tests.err(null, $$insert into public.listings (animal_id, type) values ('30000000-0000-0000-0000-000000000001', 'gift')$$),
  '42501', 'anon cannot create listings'
);

-- Authenticated, unrelated user (adopter)

select is(tests.rows('10000000-0000-0000-0000-000000000002', 'select * from public.profiles'), 1::bigint, 'user sees only own profile');
select is(
  tests.err('10000000-0000-0000-0000-000000000002', $$update public.profiles set role = 'admin' where id = '10000000-0000-0000-0000-000000000002'$$),
  '42501', 'user cannot promote self to admin'
);
select is(
  tests.rows('10000000-0000-0000-0000-000000000002', $$update public.profiles set city = 'Roma' where id = '10000000-0000-0000-0000-000000000001'$$),
  0::bigint, 'user cannot update another profile'
);
select is(tests.rows('10000000-0000-0000-0000-000000000002', 'select * from public.animal_private'), 0::bigint, 'unrelated user cannot read microchips');
select is(tests.rows('10000000-0000-0000-0000-000000000002', 'select * from public.organization_private'), 0::bigint, 'unrelated user cannot read organization private data');
select is(tests.rows('10000000-0000-0000-0000-000000000002', 'select * from public.listings'), 3::bigint, 'unrelated user sees only public listings');
select is(
  tests.err('10000000-0000-0000-0000-000000000002', $$insert into public.animals (name, species, sex, birth_date, size, city, profile_id) values ('X', 'dog', 'M', '2022-01-01', 'small', 'Roma', '10000000-0000-0000-0000-000000000002')$$),
  '42501', 'an adopter cannot create animals'
);
select is(
  tests.rows('10000000-0000-0000-0000-000000000002', $$update public.animals set name = 'Hack' where id = '30000000-0000-0000-0000-000000000001'$$),
  0::bigint, 'unrelated user cannot update an animal'
);
select is(
  tests.rows('10000000-0000-0000-0000-000000000002', $$delete from public.animals where id = '30000000-0000-0000-0000-000000000001'$$),
  0::bigint, 'unrelated user cannot delete an animal'
);
select is(
  tests.err('10000000-0000-0000-0000-000000000002', $$insert into public.listings (animal_id, type) values ('30000000-0000-0000-0000-000000000001', 'gift')$$),
  '42501', 'unrelated user cannot create a listing for someone else''s animal'
);
select is(
  tests.err('10000000-0000-0000-0000-000000000002', $$insert into public.organizations (type, name, slug, region, city) values ('shelter', 'Fake', 'fake', 'Lazio', 'Roma')$$),
  '42501', 'user cannot create organizations directly'
);

-- Private individual owner

select is(tests.rows('10000000-0000-0000-0000-000000000001', 'select * from public.animal_private'), 1::bigint, 'owner reads own microchip only');
select is(
  tests.err('10000000-0000-0000-0000-000000000001', $$insert into public.animals (id, name, species, sex, birth_date, size, city, profile_id, location) values ('30000000-0000-0000-0000-000000000006', 'Nuovo', 'dog', 'M', '2024-01-01', 'small', 'Roma', '10000000-0000-0000-0000-000000000001', extensions.st_point(12.4963655, 41.9027835)::extensions.geography)$$),
  'ok', 'private owner can create an animal'
);
select ok(
  (select extensions.st_x(location::extensions.geometry) <> 12.4963655
     and extensions.st_distance(location, extensions.st_point(12.4963655, 41.9027835)::extensions.geography) < 3000
   from public.animals where id = '30000000-0000-0000-0000-000000000006'),
  'stored location is approximated, not exact'
);
select is(
  tests.err('10000000-0000-0000-0000-000000000001', $$insert into public.listings (id, animal_id, type, status) values ('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000006', 'gift', 'published')$$),
  '42501', 'owner cannot create a listing already published'
);
select is(
  tests.err('10000000-0000-0000-0000-000000000001', $$insert into public.listings (id, animal_id, type) values ('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000006', 'gift')$$),
  'ok', 'owner can create a draft listing'
);
select is(
  tests.err('10000000-0000-0000-0000-000000000001', $$update public.listings set status = 'pending_review' where id = '40000000-0000-0000-0000-000000000007'$$),
  'ok', 'owner can submit a draft for review'
);
select is(
  tests.err('10000000-0000-0000-0000-000000000001', $$update public.listings set status = 'published' where id = '40000000-0000-0000-0000-000000000007'$$),
  '42501', 'owner cannot self-publish'
);
select is(
  tests.err('10000000-0000-0000-0000-000000000001', $$update public.listings set status = 'reserved' where id = '40000000-0000-0000-0000-000000000001'$$),
  'ok', 'owner can mark a published listing as reserved'
);
select is(
  tests.err('10000000-0000-0000-0000-000000000001', $$update public.listings set status = 'removed' where id = '40000000-0000-0000-0000-000000000001'$$),
  '42501', 'owner cannot take down a listing as moderator'
);
select is(
  tests.err('10000000-0000-0000-0000-000000000001', $$update public.animals set profile_id = '10000000-0000-0000-0000-000000000002' where id = '30000000-0000-0000-0000-000000000001'$$),
  '42501', 'owner cannot transfer an animal to another user'
);
select is(
  tests.rows('10000000-0000-0000-0000-000000000001', $$delete from public.listings where id = '40000000-0000-0000-0000-000000000001'$$),
  0::bigint, 'owner cannot delete a non-draft listing'
);
select is(
  tests.rows('10000000-0000-0000-0000-000000000001', $$delete from public.listings where id = '40000000-0000-0000-0000-000000000006'$$),
  1::bigint, 'owner can delete a draft listing'
);

-- Organization members

select is(tests.rows('10000000-0000-0000-0000-000000000003', 'select * from public.organizations'), 1::bigint, 'member sees verified org, not the pending one');
select is(tests.rows('10000000-0000-0000-0000-000000000003', 'select * from public.organization_private'), 1::bigint, 'member reads own organization private data only');
select is(tests.rows('10000000-0000-0000-0000-000000000003', 'select * from public.animal_private'), 2::bigint, 'member reads microchips of own organization animals only');
select is(tests.rows('10000000-0000-0000-0000-000000000003', 'select * from public.organization_members'), 1::bigint, 'member sees only own organization memberships');
select is(
  tests.rows('10000000-0000-0000-0000-000000000003', $$update public.organizations set name = 'Rifugio Test Uno Bis' where id = '20000000-0000-0000-0000-000000000001'$$),
  1::bigint, 'org owner can edit public fields'
);
select is(
  tests.err('10000000-0000-0000-0000-000000000003', $$update public.organizations set verification_status = 'rejected' where id = '20000000-0000-0000-0000-000000000001'$$),
  '42501', 'org owner cannot change verification status'
);
select is(
  tests.rows('10000000-0000-0000-0000-000000000003', $$update public.organizations set name = 'Hack' where id = '20000000-0000-0000-0000-000000000002'$$),
  0::bigint, 'org owner cannot edit another organization'
);
select is(
  tests.err('10000000-0000-0000-0000-000000000003', $$insert into public.animals (name, species, sex, birth_date, size, city, organization_id) values ('Nuovo Org1', 'dog', 'M', '2023-01-01', 'small', 'Roma', '20000000-0000-0000-0000-000000000001')$$),
  'ok', 'member can create an animal for own organization'
);
select is(
  tests.err('10000000-0000-0000-0000-000000000003', $$insert into public.animals (name, species, sex, birth_date, size, city, organization_id) values ('Intruso', 'dog', 'M', '2023-01-01', 'small', 'Latina', '20000000-0000-0000-0000-000000000002')$$),
  '42501', 'member cannot create an animal for another organization'
);
select is(
  tests.err('10000000-0000-0000-0000-000000000003', $$insert into public.organization_members (organization_id, profile_id, member_role) values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'owner')$$),
  '42501', 'user cannot join an organization by themselves'
);
select is(tests.rows('10000000-0000-0000-0000-000000000004', 'select * from public.organizations'), 2::bigint, 'pending org owner sees own pending org plus the verified one');
select is(
  tests.rows('10000000-0000-0000-0000-000000000004', $$update public.organizations set name = 'Hack' where id = '20000000-0000-0000-0000-000000000001'$$),
  0::bigint, 'owner of another org cannot edit this organization'
);

-- Admin

select is(tests.rows('10000000-0000-0000-0000-000000000005', 'select * from public.organizations'), 2::bigint, 'admin sees all organizations');
select is(tests.rows('10000000-0000-0000-0000-000000000005', 'select * from public.profiles'), 5::bigint, 'admin sees all profiles');
select is(tests.rows('10000000-0000-0000-0000-000000000005', 'select * from public.animal_private'), 4::bigint, 'admin reads all microchips');
select is(
  tests.err('10000000-0000-0000-0000-000000000005', $$update public.organizations set verification_status = 'verified' where id = '20000000-0000-0000-0000-000000000002'$$),
  'ok', 'admin can verify an organization'
);
select is(
  tests.err('10000000-0000-0000-0000-000000000005', $$update public.listings set status = 'published' where id = '40000000-0000-0000-0000-000000000002'$$),
  'ok', 'admin can publish a listing'
);
select isnt(
  (select published_at from public.listings where id = '40000000-0000-0000-0000-000000000002'),
  null, 'publishing sets published_at'
);
select is(
  tests.err('10000000-0000-0000-0000-000000000005', $$update public.profiles set role = 'private' where id = '10000000-0000-0000-0000-000000000002'$$),
  'ok', 'admin can change a user role'
);

-- Profile creation ignores role passed in user metadata

insert into auth.users (id, email, raw_user_meta_data) values
  ('10000000-0000-0000-0000-000000000006', 'meta@example.test', '{"role": "admin", "display_name": "Meta"}');
select is(
  (select role::text from public.profiles where id = '10000000-0000-0000-0000-000000000006'),
  'adopter', 'sign-up cannot set the role through metadata'
);

insert into auth.users (id, email, raw_user_meta_data) values
  ('10000000-0000-0000-0000-000000000007', 'acct-admin@example.test', '{"account_type": "admin"}'),
  ('10000000-0000-0000-0000-000000000008', 'acct-shelter@example.test', '{"account_type": "shelter_member"}'),
  ('10000000-0000-0000-0000-000000000009', 'acct-private@example.test', '{"account_type": "private"}');
select is(
  (select role::text from public.profiles where id = '10000000-0000-0000-0000-000000000007'),
  'adopter', 'account_type admin falls back to adopter'
);
select is(
  (select role::text from public.profiles where id = '10000000-0000-0000-0000-000000000008'),
  'adopter', 'account_type shelter_member falls back to adopter'
);
select is(
  (select role::text from public.profiles where id = '10000000-0000-0000-0000-000000000009'),
  'private', 'account_type private is honored'
);

select * from finish();
rollback;
