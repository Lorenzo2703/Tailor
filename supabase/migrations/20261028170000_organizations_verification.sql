-- M7: organization onboarding, private verification documents, admin verification + audit log

-- Guards must still let SECURITY DEFINER functions (current_user = owner) change protected columns.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    if new.role is distinct from old.role or new.id is distinct from old.id then
      raise exception 'Modifica del ruolo non consentita' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.guard_organization_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    if new.type is distinct from old.type
      or new.slug is distinct from old.slug
      or new.verification_status is distinct from old.verification_status then
      raise exception 'Modifica non consentita' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

-- Audit log (append-only)

create table public.moderation_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (char_length(action) <= 80),
  target_type text not null check (char_length(target_type) <= 40),
  target_id uuid not null,
  reason text check (char_length(reason) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index moderation_log_target_idx on public.moderation_log (target_type, target_id);

create function public.moderation_log_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'moderation_log is append-only' using errcode = '42501';
end;
$$;

create trigger moderation_log_append_only before update or delete on public.moderation_log
  for each row execute function public.moderation_log_append_only();

alter table public.moderation_log enable row level security;
grant select on public.moderation_log to authenticated;

create policy moderation_log_select_admin on public.moderation_log for select to authenticated
  using (public.is_admin());

-- Verification documents (files live in the private `org-documents` bucket)

create type public.org_document_type as enum ('registration', 'statute', 'other');
create type public.document_status as enum ('pending', 'accepted', 'rejected');

create table public.organization_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  doc_type public.org_document_type not null,
  storage_path text not null unique check (char_length(storage_path) <= 300),
  original_name text not null check (char_length(original_name) between 1 and 200),
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes integer not null check (size_bytes between 1 and 10485760),
  uploaded_by uuid references public.profiles (id) on delete set null,
  status public.document_status not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  review_note text check (char_length(review_note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organization_documents_org_idx on public.organization_documents (organization_id);

create function public.limit_organization_documents()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.organization_documents where organization_id = new.organization_id) >= 10 then
    raise exception 'Limite documenti raggiunto' using errcode = '54000';
  end if;
  return new;
end;
$$;

create trigger limit_organization_documents before insert on public.organization_documents
  for each row execute function public.limit_organization_documents();
create trigger set_updated_at before update on public.organization_documents
  for each row execute function public.set_updated_at();

alter table public.organization_documents enable row level security;
grant select, insert, update, delete on public.organization_documents to authenticated;

create policy organization_documents_select on public.organization_documents for select to authenticated
  using (public.is_org_member(organization_id) or public.is_admin());
create policy organization_documents_insert on public.organization_documents for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and uploaded_by = (select auth.uid())
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
  );
create policy organization_documents_update_admin on public.organization_documents for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy organization_documents_delete on public.organization_documents for delete to authenticated
  using ((public.is_org_member(organization_id) and status = 'pending') or public.is_admin());

-- Private storage bucket: objects are stored as `<organization_id>/<file>`

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('org-documents', 'org-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create function public.storage_org_id(object_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return split_part(object_name, '/', 1)::uuid;
exception when others then
  return null;
end;
$$;

grant execute on function public.storage_org_id(text) to authenticated;

create policy org_documents_storage_select on storage.objects for select to authenticated
  using (
    bucket_id = 'org-documents'
    and (public.is_org_member(public.storage_org_id(name)) or public.is_admin())
  );
create policy org_documents_storage_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'org-documents'
    and public.is_org_member(public.storage_org_id(name))
  );
create policy org_documents_storage_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'org-documents'
    and (public.is_org_member(public.storage_org_id(name)) or public.is_admin())
  );

-- Onboarding: the only way for end users to create an organization

create function public.create_organization(
  p_type public.organization_type,
  p_name text,
  p_region text,
  p_city text,
  p_description text,
  p_legal_name text,
  p_registration_number text,
  p_contact_email text,
  p_contact_phone text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  base_slug text;
  candidate text;
  new_id uuid;
begin
  if uid is null then
    raise exception 'Autenticazione richiesta' using errcode = '42501';
  end if;
  -- Breeders are not self-service (feature flag ENABLE_BREEDERS, later phase).
  if p_type not in ('shelter', 'association') then
    raise exception 'Tipo di organizzazione non consentito' using errcode = '42501';
  end if;
  if (select count(*) from public.organization_members where profile_id = uid and member_role = 'owner') >= 3 then
    raise exception 'org_limit_reached' using errcode = '54000';
  end if;

  base_slug := left(trim(both '-' from regexp_replace(
    translate(lower(p_name), 'àáâèéêìíîòóôùúûç', 'aaaeeeiiiooouuuc'), '[^a-z0-9]+', '-', 'g')), 60);
  if base_slug = '' then
    base_slug := 'organizzazione';
  end if;
  candidate := base_slug;
  while exists (select 1 from public.organizations where slug = candidate) loop
    candidate := base_slug || '-' || substr(md5(random()::text), 1, 4);
  end loop;

  insert into public.organizations (type, name, slug, region, city, description)
  values (p_type, p_name, candidate, p_region, p_city, nullif(p_description, ''))
  returning id into new_id;

  insert into public.organization_private (organization_id, legal_name, registration_number, contact_email, contact_phone)
  values (new_id, nullif(p_legal_name, ''), nullif(p_registration_number, ''), nullif(p_contact_email, ''), nullif(p_contact_phone, ''));

  insert into public.organization_members (organization_id, profile_id, member_role)
  values (new_id, uid, 'owner');

  update public.profiles set role = 'shelter_member' where id = uid and role = 'adopter';

  return new_id;
end;
$$;

-- A rejected organization can go back to review after fixing its documents.
create function public.request_organization_review(p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_org_owner(p_org_id) then
    raise exception 'Operazione non consentita' using errcode = '42501';
  end if;
  update public.organizations
  set verification_status = 'pending'
  where id = p_org_id and verification_status = 'rejected';
  if not found then
    raise exception 'Stato non valido' using errcode = '22023';
  end if;
end;
$$;

create function public.admin_set_organization_verification(
  p_org_id uuid,
  p_status public.verification_status,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  doc_status public.document_status;
begin
  if not public.is_admin() then
    raise exception 'Operazione non consentita' using errcode = '42501';
  end if;
  if p_status = 'rejected' and char_length(btrim(coalesce(p_reason, ''))) < 5 then
    raise exception 'Motivazione obbligatoria' using errcode = '22023';
  end if;

  update public.organizations set verification_status = p_status where id = p_org_id;
  if not found then
    raise exception 'Organizzazione non trovata' using errcode = '22023';
  end if;

  if p_status in ('verified', 'rejected') then
    doc_status := case when p_status = 'verified' then 'accepted' else 'rejected' end;
    update public.organization_documents
    set status = doc_status, reviewed_by = uid, reviewed_at = now(), review_note = nullif(btrim(p_reason), '')
    where organization_id = p_org_id and status = 'pending';
  end if;

  insert into public.moderation_log (actor_id, action, target_type, target_id, reason)
  values (uid, 'organization.' || p_status::text, 'organization', p_org_id, nullif(btrim(p_reason), ''));
end;
$$;

revoke all on function
  public.create_organization(public.organization_type, text, text, text, text, text, text, text, text),
  public.request_organization_review(uuid),
  public.admin_set_organization_verification(uuid, public.verification_status, text)
from public, anon;

grant execute on function
  public.create_organization(public.organization_type, text, text, text, text, text, text, text, text),
  public.request_organization_review(uuid),
  public.admin_set_organization_verification(uuid, public.verification_status, text)
to authenticated;
