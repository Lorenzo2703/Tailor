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

-- Fixtures (fake data only)
-- P: private owner, O1/O2: members of a verified org, A/B: adopters, ADM: admin

insert into auth.users (id, email) values
  ('61000000-0000-0000-0000-000000000001', 'private-owner@example.test'),
  ('61000000-0000-0000-0000-000000000002', 'org-one@example.test'),
  ('61000000-0000-0000-0000-000000000003', 'org-two@example.test'),
  ('61000000-0000-0000-0000-000000000004', 'adopter-a@example.test'),
  ('61000000-0000-0000-0000-000000000005', 'adopter-b@example.test'),
  ('61000000-0000-0000-0000-000000000006', 'admin@example.test');
update public.profiles set role = 'private', display_name = 'Marco Privato' where id = '61000000-0000-0000-0000-000000000001';
update public.profiles set display_name = 'Anna Adottante' where id = '61000000-0000-0000-0000-000000000004';
update public.profiles set role = 'admin' where id = '61000000-0000-0000-0000-000000000006';

insert into public.organizations (id, type, name, slug, region, city, verification_status) values
  ('62000000-0000-0000-0000-000000000001', 'shelter', 'Rifugio Test', 'rifugio-test', 'Lazio', 'Roma', 'verified');
insert into public.organization_members (organization_id, profile_id, member_role) values
  ('62000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000002', 'owner'),
  ('62000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000003', 'member');

create function tests.mk(p_n integer, p_org uuid, p_profile uuid, p_status public.listing_status, p_expires timestamptz)
returns uuid
language plpgsql
as $$
declare
  a uuid := gen_random_uuid();
  l uuid := ('64000000-0000-0000-0000-0000000000' || lpad(p_n::text, 2, '0'))::uuid;
begin
  insert into public.animals (id, name, species, sex, birth_date, size, city, organization_id, profile_id, origin, story)
  values (a, 'Animale ' || p_n, 'cat', 'F', current_date - 500, 'small', 'Roma', p_org, p_profile, 'stray_rescued', 'Storia di prova abbastanza lunga.');
  insert into public.listings (id, animal_id, type, status, slug, published_at, expires_at)
  values (l, a, case when p_org is null then 'gift'::public.listing_type else 'adoption'::public.listing_type end,
    p_status, case when p_status = 'published' then 'animale-' || p_n end,
    case when p_status = 'published' then now() end, p_expires);
  return l;
end;
$$;

select tests.mk(1, null, '61000000-0000-0000-0000-000000000001', 'published', now() + interval '30 days');
select tests.mk(2, '62000000-0000-0000-0000-000000000001', null, 'published', now() + interval '30 days');
select tests.mk(3, null, '61000000-0000-0000-0000-000000000001', 'draft', null);
select tests.mk(4, null, '61000000-0000-0000-0000-000000000001', 'published', now() - interval '1 day');
select tests.mk(5, null, '61000000-0000-0000-0000-000000000001', 'reserved', now() + interval '30 days');
select tests.mk(n, null, '61000000-0000-0000-0000-000000000001', 'published', now() + interval '30 days') from generate_series(10, 21) as n;

-- Access control

select is(tests.err(null, $$select public.create_inquiry('64000000-0000-0000-0000-000000000001', 'Ciao')$$), '42501', 'anon cannot create inquiries');
select is(tests.err(null, $$select * from public.inquiries$$), '42501', 'anon cannot read inquiries');
select is(tests.err(null, $$select * from public.inquiry_messages$$), '42501', 'anon cannot read messages');
select is(
  tests.err('61000000-0000-0000-0000-000000000004', $$insert into public.inquiries (listing_id, from_profile_id) values ('64000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000004')$$),
  '42501', 'users cannot insert inquiries directly'
);
select is(
  tests.err('61000000-0000-0000-0000-000000000004', $$insert into public.inquiry_messages (inquiry_id, sender_id, body) values (gen_random_uuid(), '61000000-0000-0000-0000-000000000004', 'x')$$),
  '42501', 'users cannot insert messages directly'
);
select is(
  tests.err('61000000-0000-0000-0000-000000000004', $$select public._add_inquiry_message(gen_random_uuid(), '61000000-0000-0000-0000-000000000004', 'x')$$),
  '42501', 'the internal message function is not callable by users'
);
select is(
  tests.err('61000000-0000-0000-0000-000000000004', $$select * from public.inquiry_notification_targets(gen_random_uuid(), '61000000-0000-0000-0000-000000000004')$$),
  '42501', 'users cannot read notification email addresses'
);
select is(
  tests.err(null, $$select * from public.inquiry_notification_targets(gen_random_uuid(), null)$$),
  '42501', 'anon cannot read notification email addresses'
);

-- Creating inquiries

select is(
  tests.err('61000000-0000-0000-0000-000000000004', $$select public.create_inquiry('64000000-0000-0000-0000-000000000001', 'Ciao, è ancora disponibile?')$$),
  'ok', 'an adopter can contact a private owner'
);
select is(
  (select count(*) from public.inquiry_messages), 1::bigint, 'the first message is stored'
);
select is(
  tests.err('61000000-0000-0000-0000-000000000004', $$select public.create_inquiry('64000000-0000-0000-0000-000000000001', 'Scrivo ancora')$$),
  'ok', 'writing again to the same listing reuses the thread'
);
select is((select count(*) from public.inquiries), 1::bigint, 'there is still one thread per person and listing');
select is((select count(*) from public.inquiry_messages), 2::bigint, 'the second message was appended');

select is(tests.err('61000000-0000-0000-0000-000000000001', $$select public.create_inquiry('64000000-0000-0000-0000-000000000001', 'Mi scrivo da solo')$$),
  '22023', 'owners cannot contact their own listing');
select is(tests.err('61000000-0000-0000-0000-000000000002', $$select public.create_inquiry('64000000-0000-0000-0000-000000000002', 'Ciao')$$),
  '22023', 'organization members cannot contact their own listing');
select is(tests.err('61000000-0000-0000-0000-000000000004', $$select public.create_inquiry('64000000-0000-0000-0000-000000000003', 'Ciao')$$),
  '22023', 'drafts cannot be contacted');
select is(tests.err('61000000-0000-0000-0000-000000000004', $$select public.create_inquiry('64000000-0000-0000-0000-000000000004', 'Ciao')$$),
  '22023', 'expired listings cannot be contacted');
select is(tests.err('61000000-0000-0000-0000-000000000004', $$select public.create_inquiry('64000000-0000-0000-0000-000000000005', 'Ciao')$$),
  '22023', 'reserved listings cannot receive new inquiries');
select is(tests.err('61000000-0000-0000-0000-000000000004', $$select public.create_inquiry(gen_random_uuid(), 'Ciao')$$),
  '22023', 'unknown listings are rejected');

-- Message validation

select is(tests.msg('61000000-0000-0000-0000-000000000005', $$select public.create_inquiry('64000000-0000-0000-0000-000000000002', '   ')$$),
  'message_invalid', 'empty messages are rejected');
select is(tests.msg('61000000-0000-0000-0000-000000000005', format($$select public.create_inquiry('64000000-0000-0000-0000-000000000002', %L)$$, repeat('a', 2001))),
  'message_invalid', 'oversized messages are rejected');
select is(tests.msg('61000000-0000-0000-0000-000000000005', $$select public.create_inquiry('64000000-0000-0000-0000-000000000002', 'Guarda http://a.test http://b.test https://c.test')$$),
  'too_many_links', 'messages with more than 2 links are rejected');
select is((select count(*) from public.inquiries where from_profile_id = '61000000-0000-0000-0000-000000000005'), 0::bigint,
  'a rejected message leaves no empty thread behind');
select is(tests.err('61000000-0000-0000-0000-000000000005', $$select public.create_inquiry('64000000-0000-0000-0000-000000000002', 'Vedi http://a.test e www.b.test')$$),
  'ok', 'up to 2 links are accepted');

-- Visibility

select is(tests.rows('61000000-0000-0000-0000-000000000004', $$select * from public.inquiries$$), 1::bigint, 'the sender sees own thread');
select is(tests.rows('61000000-0000-0000-0000-000000000001', $$select * from public.inquiries$$), 1::bigint, 'the private owner sees threads on own listings');
select is(tests.rows('61000000-0000-0000-0000-000000000005', $$select * from public.inquiries where listing_id = '64000000-0000-0000-0000-000000000001'$$), 0::bigint,
  'other adopters cannot see the thread');
select is(tests.rows('61000000-0000-0000-0000-000000000002', $$select * from public.inquiries$$), 1::bigint,
  'organization members see threads on their listings (B''s inquiry)');
select is(tests.rows('61000000-0000-0000-0000-000000000002', $$select * from public.inquiries where listing_id = '64000000-0000-0000-0000-000000000001'$$), 0::bigint,
  'organization members cannot see another owner''s threads');
select is(tests.rows('61000000-0000-0000-0000-000000000004', $$select * from public.inquiry_messages$$), 2::bigint, 'the sender sees own messages');
select is(tests.rows('61000000-0000-0000-0000-000000000005', $$select * from public.inquiry_messages where body = 'Ciao, è ancora disponibile?'$$), 0::bigint,
  'other adopters cannot read the messages');
select ok(tests.rows('61000000-0000-0000-0000-000000000006', $$select * from public.inquiries$$) >= 2, 'admins can read threads for moderation');

-- Replying

create temp table thread as
  select id from public.inquiries where from_profile_id = '61000000-0000-0000-0000-000000000004';
grant select on thread to authenticated, anon;

select is(
  tests.err('61000000-0000-0000-0000-000000000001', $$select public.post_inquiry_message((select id from thread), 'Sì, è disponibile.')$$),
  'ok', 'the owner can reply'
);
select is(
  tests.err('61000000-0000-0000-0000-000000000005', $$select public.post_inquiry_message((select id from thread), 'Intruso')$$),
  '42501', 'outsiders cannot write in a thread'
);
select is(
  tests.err('61000000-0000-0000-0000-000000000002', $$select public.post_inquiry_message((select id from thread), 'Altro proprietario')$$),
  '42501', 'members of other owners cannot write in a thread'
);
select is(tests.err(null, $$select public.post_inquiry_message(gen_random_uuid(), 'x')$$), '42501', 'anon cannot reply');

-- Unread tracking and inbox labels

select is(
  tests.val('61000000-0000-0000-0000-000000000004', $$select unread::text from public.inquiry_view() where role = 'sender'$$),
  'true', 'the sender has an unread reply'
);
select is(
  tests.val('61000000-0000-0000-0000-000000000004', $$select counterpart from public.inquiry_view() where role = 'sender'$$),
  'Marco Privato', 'the sender sees the owner''s public display name'
);
select is(
  tests.val('61000000-0000-0000-0000-000000000001', $$select counterpart from public.inquiry_view() where role = 'owner'$$),
  'Anna Adottante', 'the owner sees the sender''s display name'
);
select is(
  tests.val('61000000-0000-0000-0000-000000000005', $$select counterpart from public.inquiry_view() where role = 'sender'$$),
  'Rifugio Test', 'an organization listing shows the organization name, not a person'
);
select is(
  tests.val('61000000-0000-0000-0000-000000000004', $$select count(*)::text from public.inquiry_view() where role = 'owner'$$),
  '0', 'the inbox only contains the caller''s own threads'
);
select is(
  tests.err('61000000-0000-0000-0000-000000000004', $$select public.mark_inquiry_read((select id from thread))$$),
  'ok', 'the sender can mark a thread as read'
);
select is(
  tests.val('61000000-0000-0000-0000-000000000004', $$select unread::text from public.inquiry_view() where role = 'sender'$$),
  'false', 'the thread is no longer unread'
);
select is(
  tests.val('61000000-0000-0000-0000-000000000001', $$select unread::text from public.inquiry_view() where role = 'owner'$$),
  'false', 'a thread whose last message is mine is never unread for me'
);

-- Status: close, reopen on activity, block

select is(tests.err('61000000-0000-0000-0000-000000000001', $$select public.set_inquiry_status((select id from thread), 'closed')$$), 'ok', 'the owner can close a thread');
select is(
  tests.err('61000000-0000-0000-0000-000000000004', $$select public.post_inquiry_message((select id from thread), 'Grazie, e se cambio idea?')$$),
  'ok', 'writing in a closed thread is allowed'
);
select is((select status::text from public.inquiries where id = (select id from thread)), 'open', 'writing reopens a closed thread');
select is(tests.err('61000000-0000-0000-0000-000000000004', $$select public.set_inquiry_status((select id from thread), 'blocked')$$), '42501', 'senders cannot block');
select is(tests.err('61000000-0000-0000-0000-000000000004', $$select public.set_inquiry_status((select id from thread), 'closed')$$), 'ok', 'senders can close');
select is(tests.err('61000000-0000-0000-0000-000000000005', $$select public.set_inquiry_status((select id from thread), 'closed')$$), '42501', 'outsiders cannot change the status');
select is(tests.err('61000000-0000-0000-0000-000000000001', $$select public.set_inquiry_status((select id from thread), 'blocked')$$), 'ok', 'the owner can block a sender');
select is(
  tests.msg('61000000-0000-0000-0000-000000000004', $$select public.post_inquiry_message((select id from thread), 'Posso scrivere?')$$),
  'inquiry_blocked', 'a blocked sender cannot write'
);
select is(
  tests.msg('61000000-0000-0000-0000-000000000004', $$select public.create_inquiry('64000000-0000-0000-0000-000000000001', 'Riprovo da qui')$$),
  'inquiry_blocked', 'a blocked sender cannot bypass the block through create_inquiry'
);
select is(tests.err('61000000-0000-0000-0000-000000000004', $$select public.set_inquiry_status((select id from thread), 'closed')$$), '42501', 'a blocked sender cannot change the status');
select is(tests.err('61000000-0000-0000-0000-000000000001', $$select public.set_inquiry_status((select id from thread), 'open')$$), 'ok', 'the owner can unblock');

-- Notification targets (service role only; run here as the database owner)

select is(
  (select email from public.inquiry_notification_targets((select id from thread), '61000000-0000-0000-0000-000000000004')),
  'private-owner@example.test', 'a sender''s message notifies the private owner'
);
select is(
  (select email from public.inquiry_notification_targets((select id from thread), '61000000-0000-0000-0000-000000000001')),
  'adopter-a@example.test', 'the owner''s reply notifies the sender'
);
select is(
  (select count(*) from public.inquiry_notification_targets(
    (select id from public.inquiries where from_profile_id = '61000000-0000-0000-0000-000000000005'),
    '61000000-0000-0000-0000-000000000005')),
  2::bigint, 'an organization listing notifies every member'
);
update public.profiles set notification_prefs = '{"email_inquiries": false}'
  where id = '61000000-0000-0000-0000-000000000002';
select is(
  (select count(*) from public.inquiry_notification_targets(
    (select id from public.inquiries where from_profile_id = '61000000-0000-0000-0000-000000000005'),
    '61000000-0000-0000-0000-000000000005')),
  1::bigint, 'members who turned notifications off are skipped'
);

-- Anti-spam limits

select is(
  (select count(*) from (
    select tests.err('61000000-0000-0000-0000-000000000004', format($$select public.create_inquiry('64000000-0000-0000-0000-0000000000%s', 'Ciao')$$, lpad(n::text, 2, '0'))) as result
    from generate_series(10, 18) as n
  ) s where result = 'ok'),
  9::bigint, 'nine more inquiries fit in the daily allowance (10 total)'
);
select is(
  tests.err('61000000-0000-0000-0000-000000000004', $$select public.create_inquiry('64000000-0000-0000-0000-000000000019', 'Ciao')$$),
  '54000', 'the daily inquiry limit is enforced'
);

insert into public.inquiry_messages (inquiry_id, sender_id, body)
select (select id from thread), '61000000-0000-0000-0000-000000000005', 'riempimento ' || g from generate_series(1, 30) g;
select is(
  tests.msg('61000000-0000-0000-0000-000000000005', $$select public.create_inquiry('64000000-0000-0000-0000-000000000002', 'Un altro messaggio')$$),
  'message_limit', 'the hourly message limit is enforced'
);

select * from finish();
rollback;
