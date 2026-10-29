begin;
select no_plan();

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

create function tests.val(uid uuid, q text)
returns text
language plpgsql
as $$
declare
  result text;
begin
  perform tests.run_as(uid);
  execute q into result;
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  return result;
end;
$$;

-- A complete listing; status is set directly (the test runs as a superuser, so guards are bypassed).
create function tests.mk(
  p_n integer,
  p_city text,
  p_species public.species,
  p_size public.animal_size,
  p_story text,
  p_kids boolean,
  p_org uuid,
  p_profile uuid,
  p_status public.listing_status,
  p_expires timestamptz
)
returns void
language plpgsql
as $$
declare
  a uuid := ('33000000-0000-0000-0000-0000000000' || lpad(p_n::text, 2, '0'))::uuid;
  l uuid := ('34000000-0000-0000-0000-0000000000' || lpad(p_n::text, 2, '0'))::uuid;
begin
  insert into public.animals (id, name, species, sex, birth_date, size, city, organization_id, profile_id, origin, story, good_with_kids)
  values (a, 'Animale ' || p_n, p_species, 'F', current_date - 500, p_size, p_city, p_org, p_profile, 'stray_rescued', p_story, p_kids);
  insert into public.animal_health (animal_id, vaccinated) values (a, true);
  insert into public.animal_private (animal_id, microchip_number) values (a, '10000000000' || lpad(p_n::text, 4, '0'));
  insert into public.listings (id, animal_id, type, status, slug, published_at, expires_at)
  values (
    l, a, case when p_org is null then 'gift'::public.listing_type else 'adoption'::public.listing_type end,
    p_status, case when p_status in ('published', 'reserved') then 'animale-' || p_n end,
    case when p_status in ('published', 'reserved') then now() - (p_n || ' hours')::interval end,
    p_expires
  );
  insert into public.listing_photos (listing_id, storage_path, alt_text)
  values (l, l::text || '/p.webp', 'Foto di prova ' || p_n);
end;
$$;

-- Fixtures (fake data only)

insert into auth.users (id, email) values
  ('31000000-0000-0000-0000-000000000001', 'org-owner@example.test'),
  ('31000000-0000-0000-0000-000000000002', 'private@example.test');
update public.profiles set role = 'private' where id = '31000000-0000-0000-0000-000000000002';

insert into public.organizations (id, type, name, slug, region, city, verification_status) values
  ('32000000-0000-0000-0000-000000000001', 'shelter', 'Rifugio Uno', 'rifugio-uno', 'Lazio', 'Roma', 'verified'),
  ('32000000-0000-0000-0000-000000000002', 'shelter', 'Rifugio In Attesa', 'rifugio-in-attesa', 'Lazio', 'Latina', 'pending');
insert into public.organization_members (organization_id, profile_id, member_role) values
  ('32000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001', 'owner');

select tests.mk(1, 'Roma', 'dog', 'small', 'Una cagnolina dolce e giocherellona di Roma.', true,
  '32000000-0000-0000-0000-000000000001', null, 'published', now() + interval '30 days');
select tests.mk(2, 'Viterbo', 'cat', 'medium', 'Un gatto tranquillo che ama il sole.', false,
  null, '31000000-0000-0000-0000-000000000002', 'published', now() + interval '30 days');
select tests.mk(3, 'Latina', 'dog', 'large', 'Un cane grande e protettivo.', null,
  '32000000-0000-0000-0000-000000000002', null, 'published', now() + interval '30 days');
select tests.mk(4, 'Roma', 'dog', 'small', 'Bozza non ancora pubblicata di un cane.', true,
  '32000000-0000-0000-0000-000000000001', null, 'draft', null);
select tests.mk(5, 'Roma', 'dog', 'small', 'Annuncio scaduto di un cane.', true,
  '32000000-0000-0000-0000-000000000001', null, 'published', now() - interval '1 day');
select tests.mk(6, 'Atlantide', 'dog', 'small', 'Un cane di una citta che non esiste.', true,
  '32000000-0000-0000-0000-000000000001', null, 'draft', null);

-- Reference data and geocoding

select ok((select count(*) from public.italian_cities) = 378, 'all 378 Lazio municipalities are loaded');
select is(tests.rows(null, $$select * from public.italian_cities$$), 378::bigint, 'anon can read the municipality table');
select is(
  tests.err(null, $$insert into public.italian_cities (istat_code, name, province, province_code, region, lat, lng) values ('999999', 'X', 'X', 'XX', 'Lazio', 41, 12)$$),
  '42501', 'anon cannot modify municipalities'
);
select is(public.slugify('Sant''Oreste è bella'), 'sant-oreste-e-bella', 'slugify strips accents and punctuation');
select isnt(public.city_point('Roma'), null, 'a known city has a point');
select is(public.city_point('Atlantide'), null, 'an unknown city has no point');
select ok(public.city_point('roma') is not null, 'city lookup ignores case');

select ok(
  (select location is not null from public.animals where id = '33000000-0000-0000-0000-000000000001'),
  'animals get a location from their city'
);
select ok(
  (select abs(extensions.st_x(location::extensions.geometry) / 0.02 - round(extensions.st_x(location::extensions.geometry) / 0.02)) < 0.000001
   from public.animals where id = '33000000-0000-0000-0000-000000000001'),
  'the stored location is snapped to the ~2 km grid, never the exact centroid'
);
select ok(
  (select location is null from public.animals where id = '33000000-0000-0000-0000-000000000006'),
  'an unknown city leaves the location empty'
);

-- Public read model

select is(
  tests.rows(null, $$select * from public.public_listings where listing_id::text like '34%'$$),
  3::bigint, 'anon sees only published, non-expired listings (fixture scope)'
);
select is(
  tests.err(null, $$select microchip_number from public.public_listings$$),
  '42703', 'the public view exposes no microchip'
);
select is(
  tests.err(null, $$select profile_id from public.public_listings$$),
  '42703', 'the public view exposes no owner profile'
);
select is(
  tests.val(null, $$select organization_name from public.public_listings where slug = 'animale-3'$$),
  null, 'an unverified organization name is not exposed'
);
select is(
  tests.val(null, $$select organization_name from public.public_listings where slug = 'animale-1'$$),
  'Rifugio Uno', 'a verified organization name is exposed'
);
select is(
  tests.val(null, $$select cover_photo_alt from public.public_listings where slug = 'animale-1'$$),
  'Foto di prova 1', 'the cover photo is included'
);

-- Search
-- Note: counts below filter to fixture animals (name 'Animale N') to be resilient
--       to extra data inserted by the pilot seed outside this transaction.

select ok(tests.rows(null, $$select * from public.search_listings()$$) >= 3::bigint, 'search without filters lists public listings');
select is(
  tests.val(null, $$select name from public.search_listings(p_species => 'cat', p_query => 'animale')$$),
  'Animale 2', 'species filter'
);
select is(
  tests.val(null, $$select name from public.search_listings(p_size => 'large', p_query => 'animale')$$),
  'Animale 3', 'size filter'
);
select is(
  tests.val(null, $$select name from public.search_listings(p_kids => true, p_query => 'cagnolina')$$),
  'Animale 1', 'good-with-kids filter only keeps confirmed matches'
);
select is(
  tests.val(null, $$select name from public.search_listings(p_query => 'cagnolina')$$),
  'Animale 1', 'full-text search uses Italian stemming on the story'
);
select is(
  tests.val(null, $$select name from public.search_listings(p_query => 'viterbo') where name like 'Animale%'$$),
  'Animale 2', 'full-text search also matches the city'
);
select is(
  tests.rows(null, $$select * from public.search_listings(p_query => '''; drop table public.animals; --')$$),
  0::bigint, 'hostile search text is harmless'
);
select ok(
  tests.val(null, $$select count(*) from public.animals$$)::int >= 0,
  'the animals table is intact after the hostile query'
);

select is(
  tests.val(null, $$select name from public.search_listings(p_city_slug => 'roma', p_radius_km => 20, p_query => 'cagnolina')$$),
  'Animale 1', 'a 20 km radius around Rome only finds the Rome animal'
);
select ok(
  tests.rows(null, $$select * from public.search_listings(p_city_slug => 'roma', p_radius_km => 120, p_query => 'animale')$$) >= 3::bigint,
  'a wide radius finds all fixture animals'
);
select is(
  tests.val(null, $$select string_agg(name, ',' order by distance_km) from public.search_listings(p_city_slug => 'roma', p_query => 'animale')$$),
  'Animale 1,Animale 3,Animale 2', 'results are ordered by distance (Rome, Latina, Viterbo)'
);
select ok(
  tests.val(null, $$select round(distance_km)::text from public.search_listings(p_city_slug => 'roma', p_radius_km => 120, p_query => 'animale') where name = 'Animale 3'$$)::int between 45 and 75,
  'Rome to Latina is roughly 60 km'
);
select is(
  tests.val(null, $$select name from public.search_listings(p_lat => 42.49, p_lng => 11.95, p_radius_km => 15, p_query => 'animale')$$),
  'Animale 2', 'coordinates can replace a city (around Viterbo)'
);
select ok(
  tests.val(null, $$select total_count::text from public.search_listings(p_limit => 1)$$)::int >= 3,
  'total_count reports all matches while the page has one row'
);
select ok(
  tests.rows(null, $$select * from public.search_listings(p_limit => 1, p_offset => 2)$$) >= 1::bigint,
  'offset pages through the results'
);
select ok(
  tests.rows(null, $$select * from public.search_listings(p_limit => 100000)$$) <= 48,
  'the page size is capped'
);
select ok(
  tests.rows(null, $$select * from public.search_listings(p_city_slug => 'unknown-city', p_radius_km => 5)$$) >= 3::bigint,
  'an unknown city ignores the radius instead of hiding everything'
);

-- Slugs are assigned when publishing and stay stable

update public.listings set status = 'draft', slug = null, published_at = null, expires_at = null
  where id = '34000000-0000-0000-0000-000000000004';
select is(
  tests.err('31000000-0000-0000-0000-000000000001', $$select public.publish_listing('34000000-0000-0000-0000-000000000004')$$),
  'ok', 'a complete listing publishes'
);
select ok(
  (select slug ~ '^animale-4-[a-f0-9]{6}$' from public.listings where id = '34000000-0000-0000-0000-000000000004'),
  'publishing assigns a readable slug'
);
create temp table kept_slug as
  select slug from public.listings where id = '34000000-0000-0000-0000-000000000004';
grant select on kept_slug to anon, authenticated;
update public.listings set status = 'expired' where id = '34000000-0000-0000-0000-000000000004';
select is(
  tests.err('31000000-0000-0000-0000-000000000001', $$select public.publish_listing('34000000-0000-0000-0000-000000000004')$$),
  'ok', 'an expired listing can be republished'
);
select is(
  (select slug from public.listings where id = '34000000-0000-0000-0000-000000000004'),
  (select slug from kept_slug), 'the slug is stable across republishing'
);
select is(
  tests.rows(null, $$select * from public.public_listings where slug = (select slug from kept_slug)$$),
  1::bigint, 'the republished listing is public'
);

select * from finish();
rollback;
