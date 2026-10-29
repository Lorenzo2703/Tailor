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

-- Fixtures: u1 owner-to-be, admin, u3 unrelated (fake data only)

insert into auth.users (id, email) values
  ('11000000-0000-0000-0000-000000000001', 'owner@example.test'),
  ('11000000-0000-0000-0000-000000000002', 'admin@example.test'),
  ('11000000-0000-0000-0000-000000000003', 'other@example.test');
update public.profiles set role = 'admin' where id = '11000000-0000-0000-0000-000000000002';

-- Onboarding

select is(
  tests.err(null, $$select public.create_organization('shelter', 'X Org', 'Lazio', 'Roma', null, null, null, null, null)$$),
  '42501', 'anon cannot create organizations'
);
select is(
  tests.err('11000000-0000-0000-0000-000000000001', $$select public.create_organization('breeder', 'Allevamento', 'Lazio', 'Roma', null, null, null, null, null)$$),
  '42501', 'breeders cannot self-register'
);
select is(
  tests.err('11000000-0000-0000-0000-000000000001', $$select public.create_organization('shelter', 'Rifugio Àlfa', 'Lazio', 'Roma', 'Descrizione', 'Alfa APS', 'RM-0001', 'alfa@example.test', '000000')$$),
  'ok', 'user can create a shelter'
);

select set_config('t.org1', (select id::text from public.organizations where slug = 'rifugio-alfa'), false);

select is(
  (select verification_status::text from public.organizations where id = current_setting('t.org1')::uuid),
  'pending', 'new organization starts as pending'
);
select is(
  (select member_role::text from public.organization_members
    where organization_id = current_setting('t.org1')::uuid and profile_id = '11000000-0000-0000-0000-000000000001'),
  'owner', 'creator becomes owner'
);
select is(
  (select role::text from public.profiles where id = '11000000-0000-0000-0000-000000000001'),
  'shelter_member', 'adopter is upgraded to shelter_member'
);
select is(
  (select legal_name from public.organization_private where organization_id = current_setting('t.org1')::uuid),
  'Alfa APS', 'private data is stored separately'
);

select is(
  tests.err('11000000-0000-0000-0000-000000000003', $$select public.create_organization('shelter', 'Rifugio Alfa', 'Lazio', 'Latina', null, null, null, null, null)$$),
  'ok', 'second user can reuse a name'
);
select isnt(
  (select slug from public.organizations where city = 'Latina' and name = 'Rifugio Alfa'),
  'rifugio-alfa', 'slug collisions get a suffix'
);

select is(
  tests.err('11000000-0000-0000-0000-000000000001', $$select public.create_organization('association', 'Seconda', 'Lazio', 'Roma', null, null, null, null, null)$$),
  'ok', 'second organization for the same user'
);
select is(
  tests.err('11000000-0000-0000-0000-000000000001', $$select public.create_organization('association', 'Terza', 'Lazio', 'Roma', null, null, null, null, null)$$),
  'ok', 'third organization for the same user'
);
select is(
  tests.err('11000000-0000-0000-0000-000000000001', $$select public.create_organization('association', 'Quarta', 'Lazio', 'Roma', null, null, null, null, null)$$),
  '54000', 'organization limit per user is enforced'
);

select is(
  tests.err('11000000-0000-0000-0000-000000000001', $$insert into public.organizations (type, name, slug, region, city) values ('shelter', 'Diretta', 'diretta', 'Lazio', 'Roma')$$),
  '42501', 'direct organization inserts stay forbidden'
);
select is(
  tests.err('11000000-0000-0000-0000-000000000001', $$update public.organizations set verification_status = 'verified' where id = current_setting('t.org1')::uuid$$),
  '42501', 'owner cannot self-verify'
);
select is(
  tests.err('11000000-0000-0000-0000-000000000001', $$update public.profiles set role = 'admin' where id = '11000000-0000-0000-0000-000000000001'$$),
  '42501', 'role guard still blocks direct updates'
);

-- Documents

select is(
  tests.err('11000000-0000-0000-0000-000000000001', $$insert into public.organization_documents (organization_id, doc_type, storage_path, original_name, mime_type, size_bytes, uploaded_by) values (current_setting('t.org1')::uuid, 'registration', current_setting('t.org1') || '/a.pdf', 'a.pdf', 'application/pdf', 1000, '11000000-0000-0000-0000-000000000001')$$),
  'ok', 'member can register a pending document'
);
select is(
  tests.err('11000000-0000-0000-0000-000000000001', $$insert into public.organization_documents (organization_id, doc_type, storage_path, original_name, mime_type, size_bytes, uploaded_by, status) values (current_setting('t.org1')::uuid, 'other', current_setting('t.org1') || '/b.pdf', 'b.pdf', 'application/pdf', 1000, '11000000-0000-0000-0000-000000000001', 'accepted')$$),
  '42501', 'member cannot upload an already accepted document'
);
select is(
  tests.err('11000000-0000-0000-0000-000000000003', $$insert into public.organization_documents (organization_id, doc_type, storage_path, original_name, mime_type, size_bytes, uploaded_by) values (current_setting('t.org1')::uuid, 'other', current_setting('t.org1') || '/c.pdf', 'c.pdf', 'application/pdf', 1000, '11000000-0000-0000-0000-000000000003')$$),
  '42501', 'non-member cannot add documents to the organization'
);
select is(
  tests.rows('11000000-0000-0000-0000-000000000003', $$select * from public.organization_documents$$),
  0::bigint, 'non-member cannot read documents'
);
select is(
  tests.rows('11000000-0000-0000-0000-000000000001', $$update public.organization_documents set status = 'accepted'$$),
  0::bigint, 'member cannot review documents'
);
select is(
  tests.rows('11000000-0000-0000-0000-000000000001', $$delete from public.organization_documents where original_name = 'a.pdf'$$),
  1::bigint, 'member can delete a pending document'
);

insert into public.organization_documents (organization_id, doc_type, storage_path, original_name, mime_type, size_bytes)
select current_setting('t.org1')::uuid, 'other', current_setting('t.org1') || '/f' || g || '.pdf', 'f' || g || '.pdf', 'application/pdf', 1000
from generate_series(1, 10) as g;

select is(
  tests.err('11000000-0000-0000-0000-000000000001', $$insert into public.organization_documents (organization_id, doc_type, storage_path, original_name, mime_type, size_bytes, uploaded_by) values (current_setting('t.org1')::uuid, 'other', current_setting('t.org1') || '/z.pdf', 'z.pdf', 'application/pdf', 1000, '11000000-0000-0000-0000-000000000001')$$),
  '54000', 'document limit per organization is enforced'
);

-- Private storage bucket

select is(
  tests.err('11000000-0000-0000-0000-000000000001', $$insert into storage.objects (bucket_id, name) values ('org-documents', current_setting('t.org1') || '/a.pdf')$$),
  'ok', 'member can upload into the organization folder'
);
select is(
  tests.err('11000000-0000-0000-0000-000000000003', $$insert into storage.objects (bucket_id, name) values ('org-documents', current_setting('t.org1') || '/evil.pdf')$$),
  '42501', 'non-member cannot upload into another organization folder'
);
select is(
  tests.err('11000000-0000-0000-0000-000000000001', $$insert into storage.objects (bucket_id, name) values ('org-documents', gen_random_uuid()::text || '/x.pdf')$$),
  '42501', 'member cannot upload into an unrelated folder'
);
select is(
  tests.rows('11000000-0000-0000-0000-000000000003', $$select * from storage.objects where bucket_id = 'org-documents'$$),
  0::bigint, 'non-member cannot list documents'
);
select is(
  tests.rows('11000000-0000-0000-0000-000000000002', $$select * from storage.objects where bucket_id = 'org-documents'$$),
  1::bigint, 'admin can read documents'
);
select is(
  tests.rows(null, $$select * from storage.objects where bucket_id = 'org-documents'$$),
  0::bigint, 'anon cannot read documents'
);

-- Verification workflow

select is(
  tests.err('11000000-0000-0000-0000-000000000001', $$select public.admin_set_organization_verification(current_setting('t.org1')::uuid, 'verified', null)$$),
  '42501', 'non-admin cannot verify'
);
select is(
  tests.err('11000000-0000-0000-0000-000000000002', $$select public.admin_set_organization_verification(current_setting('t.org1')::uuid, 'rejected', null)$$),
  '22023', 'rejection requires a reason'
);
select is(
  tests.err('11000000-0000-0000-0000-000000000002', $$select public.admin_set_organization_verification(current_setting('t.org1')::uuid, 'rejected', 'Documento illeggibile')$$),
  'ok', 'admin can reject with a reason'
);
select is(
  (select count(*) from public.organization_documents where organization_id = current_setting('t.org1')::uuid and status = 'rejected'),
  10::bigint, 'pending documents are marked rejected'
);
select is(
  tests.err('11000000-0000-0000-0000-000000000003', $$select public.request_organization_review(current_setting('t.org1')::uuid)$$),
  '42501', 'only an owner can request a new review'
);
select is(
  tests.err('11000000-0000-0000-0000-000000000001', $$select public.request_organization_review(current_setting('t.org1')::uuid)$$),
  '22023', 'resubmitting requires a new pending document'
);

delete from public.organization_documents where original_name = 'f1.pdf';
insert into public.organization_documents (organization_id, doc_type, storage_path, original_name, mime_type, size_bytes)
values (current_setting('t.org1')::uuid, 'registration', current_setting('t.org1') || '/new.pdf', 'new.pdf', 'application/pdf', 1000);

select is(
  tests.err('11000000-0000-0000-0000-000000000001', $$select public.request_organization_review(current_setting('t.org1')::uuid)$$),
  'ok', 'owner can resubmit a rejected organization'
);
select is(
  (select verification_status::text from public.organizations where id = current_setting('t.org1')::uuid),
  'pending', 'resubmitted organization is pending again'
);
select is(
  tests.err('11000000-0000-0000-0000-000000000001', $$select public.request_organization_review(current_setting('t.org1')::uuid)$$),
  '22023', 'a pending organization cannot be resubmitted'
);
select is(
  tests.err('11000000-0000-0000-0000-000000000002', $$select public.admin_set_organization_verification(current_setting('t.org1')::uuid, 'verified', null)$$),
  'ok', 'admin can verify'
);
select is(
  tests.rows(null, $$select * from public.organizations where id = current_setting('t.org1')::uuid$$),
  1::bigint, 'verified organization becomes public'
);

-- Audit log

select is(
  (select count(*) from public.moderation_log where target_id = current_setting('t.org1')::uuid),
  2::bigint, 'every decision is logged'
);
select is(
  tests.rows('11000000-0000-0000-0000-000000000001', $$select * from public.moderation_log$$),
  0::bigint, 'members cannot read the moderation log'
);
select is(
  tests.rows('11000000-0000-0000-0000-000000000002', $$select * from public.moderation_log$$),
  2::bigint, 'admin can read the moderation log'
);
select throws_ok(
  $$update public.moderation_log set reason = 'tampered'$$, '42501', null, 'log entries cannot be updated'
);
select throws_ok(
  $$delete from public.moderation_log$$, '42501', null, 'log entries cannot be deleted'
);

select * from finish();
rollback;
