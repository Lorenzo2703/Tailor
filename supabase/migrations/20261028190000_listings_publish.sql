-- M8: listing creation and lifecycle. Compliance rules are enforced here, not only in the UI.
-- TO BE REVIEWED BY A LAWYER: every value in public.compliance_rules().

create type public.animal_origin as enum (
  'stray_rescued', 'surrendered_by_owner', 'family_pet', 'home_litter'
);

alter table public.animals add column origin public.animal_origin;

-- Guards now key on the executing role, so SECURITY DEFINER functions can change protected columns.

create or replace function public.guard_animal()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and current_user in ('anon', 'authenticated')
    and not public.is_admin()
    and (
      new.organization_id is distinct from old.organization_id
      or new.profile_id is distinct from old.profile_id
    ) then
    raise exception 'Cambio di proprietario non consentito' using errcode = '42501';
  end if;

  -- Public coordinates are snapped to a ~2 km grid; the exact point is never stored.
  if new.location is not null then
    new.location := extensions.st_snaptogrid(new.location::extensions.geometry, 0.02)::extensions.geography;
  end if;

  return new;
end;
$$;

create or replace function public.guard_listing()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  is_end_user boolean := current_user in ('anon', 'authenticated') and not public.is_admin();
begin
  if tg_op = 'INSERT' then
    if is_end_user and (new.status <> 'draft' or new.expires_at is not null or new.published_at is not null) then
      raise exception 'Stato iniziale non consentito' using errcode = '42501';
    end if;
  elsif is_end_user then
    if new.animal_id is distinct from old.animal_id
      or new.published_at is distinct from old.published_at
      or new.expires_at is distinct from old.expires_at then
      raise exception 'Modifica non consentita' using errcode = '42501';
    end if;
    -- Publishing is done by public.publish_listing(); takedown is a moderation action.
    if new.status is distinct from old.status
      and (old.status::text, new.status::text) not in (
        ('draft', 'pending_review'),
        ('pending_review', 'draft'),
        ('published', 'reserved'),
        ('reserved', 'published'),
        ('published', 'adopted'),
        ('reserved', 'adopted'),
        ('published', 'expired'),
        ('reserved', 'expired')
      ) then
      raise exception 'Transizione di stato non consentita' using errcode = '42501';
    end if;
  end if;

  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  return new;
end;
$$;

-- Rules in one place (mirrored by src/lib/compliance.ts for UI hints).

create function public.compliance_rules()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'min_age_days', 60,
    'microchip_required_species', jsonb_build_array('dog'),
    'max_active_private_animals', 5,
    'listing_days', 90,
    'min_story_length', 30,
    'max_photos', 8
  );
$$;

grant execute on function public.compliance_rules() to anon, authenticated;

create function public.storage_listing_id(object_name text)
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

grant execute on function public.storage_listing_id(text) to authenticated;

-- Returns the blocking issues for a listing; an empty array means it can be published.
create function public.listing_compliance_issues(p_listing_id uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  rules jsonb := public.compliance_rules();
  l public.listings;
  a public.animals;
  issues text[] := '{}';
  chip text;
begin
  select * into l from public.listings where id = p_listing_id;
  if not found or not (public.can_manage_animal(l.animal_id) or public.is_admin()) then
    raise exception 'Operazione non consentita' using errcode = '42501';
  end if;
  select * into a from public.animals where id = l.animal_id;

  if a.status <> 'active' then
    issues := array_append(issues, 'animal_not_active');
  end if;

  if a.organization_id is not null then
    if not exists (
      select 1 from public.organizations o
      where o.id = a.organization_id and o.verification_status = 'verified'
    ) then
      issues := array_append(issues, 'organization_not_verified');
    end if;
  else
    if not exists (
      select 1 from public.profiles p where p.id = a.profile_id and p.role in ('private', 'admin')
    ) then
      issues := array_append(issues, 'owner_not_allowed');
    end if;
    if l.type <> 'gift' then
      issues := array_append(issues, 'private_gift_only');
    end if;
    if (
      select count(distinct l2.animal_id)
      from public.listings l2
      join public.animals a2 on a2.id = l2.animal_id
      where a2.profile_id = a.profile_id
        and l2.status in ('published', 'reserved')
        and l2.id <> l.id
    ) >= (rules ->> 'max_active_private_animals')::int then
      issues := array_append(issues, 'private_limit');
    end if;
  end if;

  if a.birth_date > current_date - (rules ->> 'min_age_days')::int then
    issues := array_append(issues, 'animal_too_young');
  end if;

  if (rules -> 'microchip_required_species') @> to_jsonb(a.species::text) then
    select microchip_number into chip from public.animal_private where animal_id = a.id;
    if chip is null then
      issues := array_append(issues, 'microchip_required');
    elsif chip !~ '^[0-9]{15}$' then
      issues := array_append(issues, 'microchip_invalid');
    end if;
  end if;

  if a.origin is null then
    issues := array_append(issues, 'origin_required');
  end if;
  if not exists (select 1 from public.animal_health h where h.animal_id = a.id) then
    issues := array_append(issues, 'health_required');
  end if;
  if char_length(btrim(coalesce(a.story, ''))) < (rules ->> 'min_story_length')::int then
    issues := array_append(issues, 'story_required');
  end if;
  if not exists (select 1 from public.listing_photos ph where ph.listing_id = l.id) then
    issues := array_append(issues, 'photo_required');
  end if;

  return issues;
end;
$$;

create function public.publish_listing(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  l public.listings;
  issues text[];
begin
  select * into l from public.listings where id = p_listing_id for update;
  if not found or not (public.can_manage_animal(l.animal_id) or public.is_admin()) then
    raise exception 'Operazione non consentita' using errcode = '42501';
  end if;
  if l.status not in ('draft', 'expired') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;

  issues := public.listing_compliance_issues(p_listing_id);
  if cardinality(issues) > 0 then
    raise exception 'compliance:%', array_to_string(issues, ',') using errcode = '22023';
  end if;

  update public.listings
  set status = 'published',
      published_at = now(),
      expires_at = now() + make_interval(days => (public.compliance_rules() ->> 'listing_days')::int)
  where id = p_listing_id;
end;
$$;

create function public.extend_listing(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  l public.listings;
begin
  select * into l from public.listings where id = p_listing_id for update;
  if not found or not (public.can_manage_animal(l.animal_id) or public.is_admin()) then
    raise exception 'Operazione non consentita' using errcode = '42501';
  end if;
  if l.status not in ('published', 'reserved') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;

  update public.listings
  set expires_at = now() + make_interval(days => (public.compliance_rules() ->> 'listing_days')::int)
  where id = p_listing_id;
end;
$$;

-- Housekeeping: public visibility already hides expired listings, this aligns the stored status.
create function public.expire_listings()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  update public.listings
  set status = 'expired'
  where status in ('published', 'reserved') and expires_at is not null and expires_at <= now();
  get diagnostics n = row_count;
  return n;
end;
$$;

create function public.switch_to_private_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'Autenticazione richiesta' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = uid and role in ('adopter', 'private')) then
    raise exception 'Stato non valido' using errcode = '22023';
  end if;
  update public.profiles set role = 'private' where id = uid and role = 'adopter';
end;
$$;

revoke all on function
  public.listing_compliance_issues(uuid),
  public.publish_listing(uuid),
  public.extend_listing(uuid),
  public.switch_to_private_account()
from public, anon;

-- Housekeeping job: service role / scheduler only (default privileges would otherwise allow users).
revoke all on function public.expire_listings() from public, anon, authenticated;

grant execute on function
  public.listing_compliance_issues(uuid),
  public.publish_listing(uuid),
  public.extend_listing(uuid),
  public.switch_to_private_account()
to authenticated;

-- Photos

alter table public.listing_photos
  add constraint listing_photos_path_in_listing_folder
  check (split_part(storage_path, '/', 1) = listing_id::text);

create function public.limit_listing_photos()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.listing_photos where listing_id = new.listing_id)
     >= (public.compliance_rules() ->> 'max_photos')::int then
    raise exception 'Limite foto raggiunto' using errcode = '54000';
  end if;
  return new;
end;
$$;

create trigger limit_listing_photos before insert on public.listing_photos
  for each row execute function public.limit_listing_photos();

-- Photos stay in a PRIVATE bucket; public read is granted by RLS only while the listing is public,
-- so drafts, expired and removed listings never expose their files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', false, 5242880, array['image/webp'])
on conflict (id) do nothing;

create policy listing_photos_storage_select_public on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'listing-photos'
    and exists (select 1 from public.listing_photos ph where ph.storage_path = name)
  );
create policy listing_photos_storage_select_manage on storage.objects for select to authenticated
  using (
    bucket_id = 'listing-photos'
    and (public.can_manage_listing(public.storage_listing_id(name)) or public.is_admin())
  );
create policy listing_photos_storage_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'listing-photos'
    and public.can_manage_listing(public.storage_listing_id(name))
  );
create policy listing_photos_storage_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'listing-photos'
    and (public.can_manage_listing(public.storage_listing_id(name)) or public.is_admin())
  );
