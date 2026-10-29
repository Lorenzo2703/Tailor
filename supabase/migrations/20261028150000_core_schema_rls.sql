-- M5: core schema + RLS v1 (profiles, organizations, animals, listings, photos)

create extension if not exists postgis with schema extensions;

-- New tables are deny-by-default: grants are added explicitly per table below.
alter default privileges in schema public revoke all on tables from anon, authenticated;

-- Enums

create type public.user_role as enum ('adopter', 'shelter_member', 'private', 'admin');
create type public.organization_type as enum ('shelter', 'association', 'breeder');
create type public.verification_status as enum ('pending', 'verified', 'rejected');
create type public.org_member_role as enum ('owner', 'member');
create type public.species as enum ('dog', 'cat');
create type public.animal_sex as enum ('M', 'F');
create type public.animal_size as enum ('small', 'medium', 'large');
create type public.animal_status as enum ('active', 'archived');
create type public.listing_type as enum ('adoption', 'gift');
create type public.listing_status as enum (
  'draft', 'pending_review', 'published', 'reserved', 'adopted', 'expired', 'removed'
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Tables

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  role public.user_role not null default 'adopter',
  city text check (char_length(city) <= 80),
  notification_prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  type public.organization_type not null,
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  region text not null check (char_length(region) <= 80),
  city text not null check (char_length(city) <= 80),
  description text check (char_length(description) <= 2000),
  verification_status public.verification_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_private (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  legal_name text check (char_length(legal_name) <= 200),
  registration_number text check (char_length(registration_number) <= 80),
  contact_email text check (char_length(contact_email) <= 200),
  contact_phone text check (char_length(contact_phone) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  member_role public.org_member_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

create index organization_members_profile_idx on public.organization_members (profile_id);

create table public.animals (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  species public.species not null,
  breed text check (char_length(breed) <= 80),
  sex public.animal_sex not null,
  birth_date date not null,
  size public.animal_size not null,
  story text check (char_length(story) <= 5000),
  good_with_kids boolean,
  good_with_dogs boolean,
  good_with_cats boolean,
  apartment_ok boolean,
  organization_id uuid references public.organizations (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete cascade,
  city text not null check (char_length(city) <= 80),
  location extensions.geography (point, 4326),
  status public.animal_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint animals_single_owner check ((organization_id is null) <> (profile_id is null))
);

create index animals_organization_idx on public.animals (organization_id);
create index animals_profile_idx on public.animals (profile_id);
create index animals_location_idx on public.animals using gist (location);

-- Public health facts: same visibility as the animal.
create table public.animal_health (
  animal_id uuid primary key references public.animals (id) on delete cascade,
  vaccinated boolean not null default false,
  sterilized boolean not null default false,
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Never public: only owners and admins can read it.
create table public.animal_private (
  animal_id uuid primary key references public.animals (id) on delete cascade,
  microchip_number text unique check (char_length(microchip_number) between 5 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals (id) on delete cascade,
  type public.listing_type not null,
  status public.listing_status not null default 'draft',
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_animal_idx on public.listings (animal_id);
create index listings_status_idx on public.listings (status, published_at desc);
create unique index listings_one_active_per_animal
  on public.listings (animal_id)
  where status in ('draft', 'pending_review', 'published', 'reserved');

create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  storage_path text not null check (char_length(storage_path) <= 300),
  position integer not null default 0 check (position >= 0),
  alt_text text not null check (char_length(btrim(alt_text)) between 1 and 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, position) deferrable initially deferred
);

create index listing_photos_listing_idx on public.listing_photos (listing_id);

-- Authorization helpers (SECURITY DEFINER avoids RLS recursion between tables)

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id and profile_id = (select auth.uid())
  );
$$;

create function public.is_org_owner(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id
      and profile_id = (select auth.uid())
      and member_role = 'owner'
  );
$$;

create function public.can_manage_animal(target_animal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.animals a
    where a.id = target_animal_id
      and (
        a.profile_id = (select auth.uid())
        or (a.organization_id is not null and public.is_org_member(a.organization_id))
      )
  );
$$;

create function public.can_manage_listing(target_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.listings l
    where l.id = target_listing_id and public.can_manage_animal(l.animal_id)
  );
$$;

grant execute on function
  public.is_admin(),
  public.is_org_member(uuid),
  public.is_org_owner(uuid),
  public.can_manage_animal(uuid),
  public.can_manage_listing(uuid)
to anon, authenticated;

-- Triggers

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- The role is never taken from user-controlled metadata.
  insert into public.profiles (id, display_name)
  values (new.id, nullif(left(new.raw_user_meta_data ->> 'display_name', 80), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Guards run only for end users (auth.uid() not null); service role and migrations pass through.

create function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    if new.role is distinct from old.role or new.id is distinct from old.id then
      raise exception 'Modifica del ruolo non consentita' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create function public.guard_organization_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    if new.type is distinct from old.type
      or new.slug is distinct from old.slug
      or new.verification_status is distinct from old.verification_status then
      raise exception 'Modifica non consentita' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create function public.guard_animal()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and (select auth.uid()) is not null
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

create function public.guard_listing()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  is_end_user boolean := (select auth.uid()) is not null and not public.is_admin();
begin
  if tg_op = 'INSERT' then
    if is_end_user and new.status <> 'draft' then
      raise exception 'Stato iniziale non consentito' using errcode = '42501';
    end if;
  else
    if is_end_user then
      if new.animal_id is distinct from old.animal_id
        or new.published_at is distinct from old.published_at then
        raise exception 'Modifica non consentita' using errcode = '42501';
      end if;
      -- Publishing and takedown are moderation actions (admin only).
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
  end if;

  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  return new;
end;
$$;

create trigger guard_profile_update before update on public.profiles
  for each row execute function public.guard_profile_update();
create trigger guard_organization_update before update on public.organizations
  for each row execute function public.guard_organization_update();
create trigger guard_animal before insert or update on public.animals
  for each row execute function public.guard_animal();
create trigger guard_listing before insert or update on public.listings
  for each row execute function public.guard_listing();

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.organization_private
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.organization_members
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.animals
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.animal_health
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.animal_private
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.listings
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.listing_photos
  for each row execute function public.set_updated_at();

-- Grants (RLS below is the real gate; anon never gets private tables)

grant select on
  public.organizations,
  public.animals,
  public.animal_health,
  public.listings,
  public.listing_photos
to anon;

grant select, insert, update, delete on
  public.profiles,
  public.organizations,
  public.organization_private,
  public.organization_members,
  public.animals,
  public.animal_health,
  public.animal_private,
  public.listings,
  public.listing_photos
to authenticated;

-- RLS

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_private enable row level security;
alter table public.organization_members enable row level security;
alter table public.animals enable row level security;
alter table public.animal_health enable row level security;
alter table public.animal_private enable row level security;
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;

-- profiles: self + admin. Rows are created by the auth trigger only.
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- organizations: verified ones are public; members see their own; creation goes through a
-- dedicated function in M7, so end users have no insert policy.
create policy organizations_select_public on public.organizations for select to anon, authenticated
  using (verification_status = 'verified');
create policy organizations_select_member on public.organizations for select to authenticated
  using (public.is_org_member(id) or public.is_admin());
create policy organizations_update on public.organizations for update to authenticated
  using (public.is_org_owner(id) or public.is_admin())
  with check (public.is_org_owner(id) or public.is_admin());
create policy organizations_insert_admin on public.organizations for insert to authenticated
  with check (public.is_admin());
create policy organizations_delete_admin on public.organizations for delete to authenticated
  using (public.is_admin());

create policy organization_private_select on public.organization_private for select to authenticated
  using (public.is_org_member(organization_id) or public.is_admin());
create policy organization_private_update on public.organization_private for update to authenticated
  using (public.is_org_owner(organization_id) or public.is_admin())
  with check (public.is_org_owner(organization_id) or public.is_admin());
create policy organization_private_insert_admin on public.organization_private for insert to authenticated
  with check (public.is_admin());
create policy organization_private_delete_admin on public.organization_private for delete to authenticated
  using (public.is_admin());

create policy organization_members_select on public.organization_members for select to authenticated
  using (
    profile_id = (select auth.uid())
    or public.is_org_member(organization_id)
    or public.is_admin()
  );
create policy organization_members_insert_admin on public.organization_members for insert to authenticated
  with check (public.is_admin());
create policy organization_members_update_admin on public.organization_members for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy organization_members_delete_admin on public.organization_members for delete to authenticated
  using (public.is_admin());

-- animals: public when the animal has a listing the caller can see (listings RLS decides),
-- owners and admins always. Owner checks use columns, not helper functions that re-read this
-- table, so INSERT ... RETURNING keeps working.
create policy animals_select_public on public.animals for select to anon, authenticated
  using (exists (select 1 from public.listings l where l.animal_id = animals.id));
create policy animals_select_owner on public.animals for select to authenticated
  using (
    profile_id = (select auth.uid())
    or (organization_id is not null and public.is_org_member(organization_id))
    or public.is_admin()
  );
create policy animals_insert on public.animals for insert to authenticated
  with check (
    (
      profile_id = (select auth.uid())
      and exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid()) and p.role in ('private', 'admin')
      )
    )
    or (organization_id is not null and public.is_org_member(organization_id))
    or public.is_admin()
  );
create policy animals_update on public.animals for update to authenticated
  using (
    profile_id = (select auth.uid())
    or (organization_id is not null and public.is_org_member(organization_id))
    or public.is_admin()
  )
  with check (
    profile_id = (select auth.uid())
    or (organization_id is not null and public.is_org_member(organization_id))
    or public.is_admin()
  );
create policy animals_delete on public.animals for delete to authenticated
  using (
    profile_id = (select auth.uid())
    or (organization_id is not null and public.is_org_member(organization_id))
    or public.is_admin()
  );

create policy animal_health_select on public.animal_health for select to anon, authenticated
  using (exists (select 1 from public.animals a where a.id = animal_health.animal_id));
create policy animal_health_insert on public.animal_health for insert to authenticated
  with check (public.can_manage_animal(animal_id) or public.is_admin());
create policy animal_health_update on public.animal_health for update to authenticated
  using (public.can_manage_animal(animal_id) or public.is_admin())
  with check (public.can_manage_animal(animal_id) or public.is_admin());
create policy animal_health_delete on public.animal_health for delete to authenticated
  using (public.can_manage_animal(animal_id) or public.is_admin());

create policy animal_private_select on public.animal_private for select to authenticated
  using (public.can_manage_animal(animal_id) or public.is_admin());
create policy animal_private_insert on public.animal_private for insert to authenticated
  with check (public.can_manage_animal(animal_id) or public.is_admin());
create policy animal_private_update on public.animal_private for update to authenticated
  using (public.can_manage_animal(animal_id) or public.is_admin())
  with check (public.can_manage_animal(animal_id) or public.is_admin());
create policy animal_private_delete on public.animal_private for delete to authenticated
  using (public.can_manage_animal(animal_id) or public.is_admin());

-- listings: published/reserved and not expired are public; owners and admins see all of theirs.
create policy listings_select_public on public.listings for select to anon, authenticated
  using (status in ('published', 'reserved') and (expires_at is null or expires_at > now()));
create policy listings_select_manage on public.listings for select to authenticated
  using (public.can_manage_animal(animal_id) or public.is_admin());
create policy listings_insert on public.listings for insert to authenticated
  with check (public.can_manage_animal(animal_id) or public.is_admin());
create policy listings_update on public.listings for update to authenticated
  using (public.can_manage_animal(animal_id) or public.is_admin())
  with check (public.can_manage_animal(animal_id) or public.is_admin());
create policy listings_delete on public.listings for delete to authenticated
  using ((public.can_manage_animal(animal_id) and status = 'draft') or public.is_admin());

create policy listing_photos_select on public.listing_photos for select to anon, authenticated
  using (exists (select 1 from public.listings l where l.id = listing_photos.listing_id));
create policy listing_photos_insert on public.listing_photos for insert to authenticated
  with check (public.can_manage_listing(listing_id) or public.is_admin());
create policy listing_photos_update on public.listing_photos for update to authenticated
  using (public.can_manage_listing(listing_id) or public.is_admin())
  with check (public.can_manage_listing(listing_id) or public.is_admin());
create policy listing_photos_delete on public.listing_photos for delete to authenticated
  using (public.can_manage_listing(listing_id) or public.is_admin());
