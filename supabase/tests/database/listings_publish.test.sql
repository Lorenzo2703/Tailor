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

-- SQLSTATE of a failing statement, or 'ok'.
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

-- Error message of a failing statement, or 'ok'.
create function tests.msg(uid uuid, stmt text)
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
    return sqlerrm;
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

create function tests.mk_listing(
  p_n integer,
  p_org uuid,
  p_profile uuid,
  p_species public.species,
  p_type public.listing_type,
  p_birth date,
  p_complete boolean,
  p_chip text
)
returns void
language plpgsql
as $$
declare
  a uuid := ('23000000-0000-0000-0000-0000000000' || lpad(p_n::text, 2, '0'))::uuid;
  l uuid := ('24000000-0000-0000-0000-0000000000' || lpad(p_n::text, 2, '0'))::uuid;
begin
  insert into public.animals (id, name, species, sex, birth_date, size, city, organization_id, profile_id, origin, story)
  values (
    a, 'Test ' || p_n, p_species, 'M', p_birth, 'small', 'Roma', p_org, p_profile,
    case when p_complete then 'stray_rescued'::public.animal_origin end,
    case when p_complete then 'Una storia di prova abbastanza lunga da essere valida.' end
  );
  insert into public.listings (id, animal_id, type) values (l, a, p_type);
  if p_complete then
    insert into public.animal_health (animal_id) values (a);
    if p_chip is not null then
      insert into public.animal_private (animal_id, microchip_number) values (a, p_chip);
    end if;
    insert into public.listing_photos (listing_id, storage_path, alt_text)
    values (l, l::text || '/p.webp', 'Foto di prova');
  end if;
end;
$$;

-- Fixtures (fake data only)

insert into auth.users (id, email) values
  ('21000000-0000-0000-0000-000000000001', 'org-owner@example.test'),
  ('21000000-0000-0000-0000-000000000002', 'private@example.test'),
  ('21000000-0000-0000-0000-000000000003', 'adopter@example.test'),
  ('21000000-0000-0000-0000-000000000004', 'admin@example.test'),
  ('21000000-0000-0000-0000-000000000005', 'shelter-role@example.test');
update public.profiles set role = 'private' where id = '21000000-0000-0000-0000-000000000002';
update public.profiles set role = 'admin' where id = '21000000-0000-0000-0000-000000000004';
update public.profiles set role = 'shelter_member' where id = '21000000-0000-0000-0000-000000000005';

insert into public.organizations (id, type, name, slug, region, city, verification_status) values
  ('22000000-0000-0000-0000-000000000001', 'shelter', 'Org Verificata', 'org-verificata', 'Lazio', 'Roma', 'verified'),
  ('22000000-0000-0000-0000-000000000002', 'shelter', 'Org In Attesa', 'org-in-attesa', 'Lazio', 'Roma', 'pending');
insert into public.organization_members (organization_id, profile_id, member_role) values
  ('22000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', 'owner'),
  ('22000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000001', 'owner');

select tests.mk_listing(1, '22000000-0000-0000-0000-000000000001', null, 'dog', 'adoption', current_date - 400, false, null);
select tests.mk_listing(2, '22000000-0000-0000-0000-000000000002', null, 'dog', 'adoption', current_date - 400, true, '100000000000002');
select tests.mk_listing(3, '22000000-0000-0000-0000-000000000001', null, 'dog', 'adoption', current_date - 10, true, '100000000000003');
select tests.mk_listing(4, '22000000-0000-0000-0000-000000000001', null, 'cat', 'adoption', current_date - 400, true, null);
select tests.mk_listing(5, '22000000-0000-0000-0000-000000000001', null, 'dog', 'adoption', current_date - 400, true, 'DEMO-0000005');
select tests.mk_listing(6, '22000000-0000-0000-0000-000000000001', null, 'dog', 'adoption', current_date - 400, true, '100000000000006');
select tests.mk_listing(7, null, '21000000-0000-0000-0000-000000000002', 'dog', 'gift', current_date - 400, true, '100000000000007');
select tests.mk_listing(8, null, '21000000-0000-0000-0000-000000000002', 'dog', 'adoption', current_date - 400, true, '100000000000008');
select tests.mk_listing(9, null, '21000000-0000-0000-0000-000000000002', 'dog', 'gift', current_date - 400, true, '100000000000009');
select tests.mk_listing(10, null, '21000000-0000-0000-0000-000000000002', 'dog', 'gift', current_date - 400, true, '100000000000010');
select tests.mk_listing(11, null, '21000000-0000-0000-0000-000000000002', 'dog', 'gift', current_date - 400, true, '100000000000011');
select tests.mk_listing(12, null, '21000000-0000-0000-0000-000000000002', 'dog', 'gift', current_date - 400, true, '100000000000012');
select tests.mk_listing(13, null, '21000000-0000-0000-0000-000000000002', 'dog', 'gift', current_date - 400, true, '100000000000013');
update public.listings set status = 'published', published_at = now(), expires_at = now() + interval '30 days'
  where id in (
    '24000000-0000-0000-0000-000000000009', '24000000-0000-0000-0000-000000000010',
    '24000000-0000-0000-0000-000000000011', '24000000-0000-0000-0000-000000000012',
    '24000000-0000-0000-0000-000000000013'
  );

-- Compliance issues (shown to the owner as a checklist)

select ok(
  tests.val('21000000-0000-0000-0000-000000000001', $$select public.listing_compliance_issues('24000000-0000-0000-0000-000000000001')::text$$)
    ~ 'microchip_required.*origin_required.*health_required.*story_required.*photo_required',
  'an incomplete dog listing lists every missing item'
);
select is(
  tests.val('21000000-0000-0000-0000-000000000001', $$select public.listing_compliance_issues('24000000-0000-0000-0000-000000000006')::text$$),
  '{}', 'a complete listing has no issues'
);
select is(
  tests.err('21000000-0000-0000-0000-000000000003', $$select public.listing_compliance_issues('24000000-0000-0000-0000-000000000006')$$),
  '42501', 'unrelated users cannot inspect issues'
);

-- Publishing rules

select is(
  tests.msg('21000000-0000-0000-0000-000000000001', $$select public.publish_listing('24000000-0000-0000-0000-000000000001')$$) ~ '^compliance:',
  true, 'incomplete listings cannot be published'
);
select ok(
  tests.msg('21000000-0000-0000-0000-000000000001', $$select public.publish_listing('24000000-0000-0000-0000-000000000002')$$) like '%organization_not_verified%',
  'unverified organizations cannot publish'
);
select ok(
  tests.msg('21000000-0000-0000-0000-000000000001', $$select public.publish_listing('24000000-0000-0000-0000-000000000003')$$) like '%animal_too_young%',
  'animals under 60 days cannot be published'
);
select ok(
  tests.msg('21000000-0000-0000-0000-000000000001', $$select public.publish_listing('24000000-0000-0000-0000-000000000005')$$) like '%microchip_invalid%',
  'dogs need a valid 15-digit microchip'
);
select is(
  tests.err('21000000-0000-0000-0000-000000000001', $$select public.publish_listing('24000000-0000-0000-0000-000000000004')$$),
  'ok', 'cats do not require a microchip by default'
);
select is(
  tests.err('21000000-0000-0000-0000-000000000001', $$select public.publish_listing('24000000-0000-0000-0000-000000000006')$$),
  'ok', 'a verified organization publishes a complete listing'
);
select is(
  (select status::text from public.listings where id = '24000000-0000-0000-0000-000000000006'),
  'published', 'listing is published'
);
select ok(
  (select published_at is not null and expires_at > now() + interval '89 days' from public.listings where id = '24000000-0000-0000-0000-000000000006'),
  'publishing sets published_at and a 90-day expiry'
);
select is(
  tests.err('21000000-0000-0000-0000-000000000001', $$select public.publish_listing('24000000-0000-0000-0000-000000000006')$$),
  '22023', 'a published listing cannot be published again'
);
select is(
  tests.err('21000000-0000-0000-0000-000000000003', $$select public.publish_listing('24000000-0000-0000-0000-000000000007')$$),
  '42501', 'unrelated users cannot publish'
);
select is(
  tests.err(null, $$select public.publish_listing('24000000-0000-0000-0000-000000000007')$$),
  '42501', 'anon cannot publish'
);

-- Private individuals

select ok(
  tests.msg('21000000-0000-0000-0000-000000000002', $$select public.publish_listing('24000000-0000-0000-0000-000000000008')$$) like '%private_gift_only%',
  'private individuals can only gift'
);
select ok(
  tests.msg('21000000-0000-0000-0000-000000000002', $$select public.publish_listing('24000000-0000-0000-0000-000000000007')$$) like '%private_limit%',
  'private individuals are capped at 5 active animals'
);
update public.listings set status = 'adopted' where id = '24000000-0000-0000-0000-000000000013';
select is(
  tests.err('21000000-0000-0000-0000-000000000002', $$select public.publish_listing('24000000-0000-0000-0000-000000000007')$$),
  'ok', 'a freed slot allows another listing'
);

-- Lifecycle

select is(
  tests.err('21000000-0000-0000-0000-000000000001', $$update public.listings set status = 'reserved' where id = '24000000-0000-0000-0000-000000000006'$$),
  'ok', 'owner can reserve'
);
select is(
  tests.err('21000000-0000-0000-0000-000000000001', $$update public.listings set expires_at = now() + interval '1000 days' where id = '24000000-0000-0000-0000-000000000006'$$),
  '42501', 'owner cannot set the expiry directly'
);
select is(
  tests.err('21000000-0000-0000-0000-000000000001', $$update public.listings set status = 'removed' where id = '24000000-0000-0000-0000-000000000006'$$),
  '42501', 'owner cannot take a listing down as moderator'
);
update public.listings set expires_at = now() + interval '1 day' where id = '24000000-0000-0000-0000-000000000006';
select is(
  tests.err('21000000-0000-0000-0000-000000000001', $$select public.extend_listing('24000000-0000-0000-0000-000000000006')$$),
  'ok', 'owner can extend a live listing'
);
select ok(
  (select expires_at > now() + interval '89 days' from public.listings where id = '24000000-0000-0000-0000-000000000006'),
  'extending restarts the 90-day window'
);
update public.listings set expires_at = now() - interval '1 minute' where id = '24000000-0000-0000-0000-000000000006';
select is(
  tests.rows(null, $$select * from public.listings where id = '24000000-0000-0000-0000-000000000006'$$),
  0::bigint, 'expired listings are hidden from the public even before the status is aligned'
);
select is(
  tests.err('21000000-0000-0000-0000-000000000001', $$select public.expire_listings()$$),
  '42501', 'users cannot run the expiry job'
);
select is(tests.err(null, $$select public.expire_listings()$$), '42501', 'anon cannot run the expiry job');
select ok(public.expire_listings() >= 1, 'the expiry job aligns statuses');
select is(
  (select status::text from public.listings where id = '24000000-0000-0000-0000-000000000006'),
  'expired', 'expired listing has the expired status'
);
select is(
  tests.err('21000000-0000-0000-0000-000000000001', $$select public.publish_listing('24000000-0000-0000-0000-000000000006')$$),
  'ok', 'an expired listing can be republished after the checks'
);

-- Photos

insert into public.listing_photos (listing_id, storage_path, position, alt_text)
select '24000000-0000-0000-0000-000000000006', '24000000-0000-0000-0000-000000000006/x' || g || '.webp', g, 'Foto ' || g
from generate_series(1, 7) as g;

select is(
  tests.err('21000000-0000-0000-0000-000000000001', $$insert into public.listing_photos (listing_id, storage_path, position, alt_text) values ('24000000-0000-0000-0000-000000000006', '24000000-0000-0000-0000-000000000006/over.webp', 20, 'Troppe')$$),
  '54000', 'photo limit per listing is enforced'
);
select is(
  tests.err('21000000-0000-0000-0000-000000000001', $$insert into public.listing_photos (listing_id, storage_path, position, alt_text) values ('24000000-0000-0000-0000-000000000004', '24000000-0000-0000-0000-000000000099/evil.webp', 5, 'Percorso errato')$$),
  '23514', 'photo path must be inside the listing folder'
);
select is(
  tests.err('21000000-0000-0000-0000-000000000001', $$insert into public.listing_photos (listing_id, storage_path, position, alt_text) values ('24000000-0000-0000-0000-000000000004', '24000000-0000-0000-0000-000000000004/b.webp', 5, '   ')$$),
  '23514', 'alt text is required'
);

-- Storage: private bucket, public read only for public listings

insert into storage.objects (bucket_id, name) values
  ('listing-photos', '24000000-0000-0000-0000-000000000006/x1.webp'),
  ('listing-photos', '24000000-0000-0000-0000-000000000001/draft.webp');
insert into public.listing_photos (listing_id, storage_path, position, alt_text)
values ('24000000-0000-0000-0000-000000000001', '24000000-0000-0000-0000-000000000001/draft.webp', 0, 'Bozza');

select is(
  tests.rows(null, $$select * from storage.objects where bucket_id = 'listing-photos'$$),
  1::bigint, 'anon only reads photos of public listings'
);
select is(
  tests.rows('21000000-0000-0000-0000-000000000003', $$select * from storage.objects where bucket_id = 'listing-photos' and name like '24000000-0000-0000-0000-000000000001/%'$$),
  0::bigint, 'other users cannot read draft photos'
);
select is(
  tests.rows('21000000-0000-0000-0000-000000000001', $$select * from storage.objects where bucket_id = 'listing-photos' and name like '24000000-0000-0000-0000-000000000001/%'$$),
  1::bigint, 'the owner reads own draft photos'
);
select is(
  tests.err('21000000-0000-0000-0000-000000000001', $$insert into storage.objects (bucket_id, name) values ('listing-photos', '24000000-0000-0000-0000-000000000004/new.webp')$$),
  'ok', 'the owner can upload into the listing folder'
);
select is(
  tests.err('21000000-0000-0000-0000-000000000003', $$insert into storage.objects (bucket_id, name) values ('listing-photos', '24000000-0000-0000-0000-000000000004/evil.webp')$$),
  '42501', 'other users cannot upload into the listing folder'
);

-- Switching to a private account

select is(
  tests.err('21000000-0000-0000-0000-000000000003', $$select public.switch_to_private_account()$$),
  'ok', 'an adopter can become a private individual'
);
select is(
  (select role::text from public.profiles where id = '21000000-0000-0000-0000-000000000003'),
  'private', 'the role was updated'
);
select is(
  tests.err('21000000-0000-0000-0000-000000000005', $$select public.switch_to_private_account()$$),
  '22023', 'shelter members cannot switch'
);
select is(tests.err(null, $$select public.switch_to_private_account()$$), '42501', 'anon cannot switch');

select * from finish();
rollback;
