-- M9: public discovery. Slugs, approximate location, public read model, full-text + distance search.

alter table public.listings add column slug text unique;

-- City -> approximate point. The guard_animal trigger snaps it to a ~2 km grid before storing.
create function public.city_point(p_city text, p_region text default null)
returns extensions.geography
language sql
stable
set search_path = ''
as $$
  select extensions.st_setsrid(extensions.st_makepoint(c.lng, c.lat), 4326)::extensions.geography
  from public.italian_cities c
  where c.slug = public.slugify(p_city)
    and (p_region is null or lower(c.region) = lower(p_region))
  order by c.name
  limit 1;
$$;

grant execute on function public.city_point(text, text) to anon, authenticated;

-- Keep animals.location in sync with the city whenever it changes (an unknown city leaves it empty).
-- The name sorts before guard_animal, which then snaps the point to a ~2 km grid.
create function public.sync_animal_location()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.city is distinct from old.city or new.location is null then
    new.location := public.city_point(new.city);
  end if;
  return new;
end;
$$;

create trigger a_sync_animal_location before insert or update on public.animals
  for each row execute function public.sync_animal_location();

-- Stable, readable public URLs: <name>-<random>. Set once, kept across republishing.
create or replace function public.publish_listing(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  l public.listings;
  animal_name text;
  issues text[];
  new_slug text;
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

  new_slug := l.slug;
  if new_slug is null then
    select name into animal_name from public.animals where id = l.animal_id;
    loop
      new_slug := coalesce(nullif(left(public.slugify(animal_name), 40), ''), 'animale')
        || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
      exit when not exists (select 1 from public.listings where slug = new_slug);
    end loop;
  end if;

  update public.listings
  set status = 'published',
      slug = new_slug,
      published_at = now(),
      expires_at = now() + make_interval(days => (public.compliance_rules() ->> 'listing_days')::int)
  where id = p_listing_id;
end;
$$;

-- Public read model. security_invoker keeps every underlying RLS policy in force: the view can only
-- ever return what the caller could already read, and exposes no private columns.
create view public.public_listings
with (security_invoker = true)
as
select
  l.id as listing_id,
  l.slug,
  l.type as listing_type,
  l.status as listing_status,
  l.published_at,
  l.expires_at,
  a.id as animal_id,
  a.name,
  a.species,
  a.breed,
  a.sex,
  a.birth_date,
  a.size,
  a.story,
  a.good_with_kids,
  a.good_with_dogs,
  a.good_with_cats,
  a.apartment_ok,
  a.origin,
  a.city,
  a.location,
  o.id as organization_id,
  o.name as organization_name,
  o.slug as organization_slug,
  h.vaccinated,
  h.sterilized,
  h.notes as health_notes,
  (select ph.id from public.listing_photos ph where ph.listing_id = l.id order by ph.position limit 1) as cover_photo_id,
  (select ph.alt_text from public.listing_photos ph where ph.listing_id = l.id order by ph.position limit 1) as cover_photo_alt,
  to_tsvector(
    'italian',
    coalesce(a.name, '') || ' ' || coalesce(a.breed, '') || ' ' || coalesce(a.city, '') || ' ' || coalesce(a.story, '')
  ) as search_vector
from public.listings l
join public.animals a on a.id = l.animal_id
left join public.organizations o on o.id = a.organization_id
left join public.animal_health h on h.animal_id = a.id
where l.status in ('published', 'reserved')
  and l.slug is not null
  and (l.expires_at is null or l.expires_at > now());

grant select on public.public_listings to anon, authenticated;

create index animals_city_idx on public.animals (city);
create index listings_slug_idx on public.listings (slug);

-- Faceted search with optional distance (km). Returns one page plus the total count.
create function public.search_listings(
  p_species public.species default null,
  p_size public.animal_size default null,
  p_sex public.animal_sex default null,
  p_kids boolean default null,
  p_dogs boolean default null,
  p_cats boolean default null,
  p_apartment boolean default null,
  p_query text default null,
  p_city_slug text default null,
  p_lat double precision default null,
  p_lng double precision default null,
  p_radius_km integer default null,
  p_limit integer default 12,
  p_offset integer default 0
)
returns table (
  listing_id uuid,
  slug text,
  listing_type public.listing_type,
  listing_status public.listing_status,
  name text,
  species public.species,
  sex public.animal_sex,
  size public.animal_size,
  breed text,
  birth_date date,
  city text,
  organization_name text,
  organization_slug text,
  cover_photo_id uuid,
  cover_photo_alt text,
  published_at timestamptz,
  distance_km double precision,
  total_count bigint
)
language sql
stable
set search_path = ''
as $$
  with origin as (
    select
      coalesce(p_lat, c.lat) as lat,
      coalesce(p_lng, c.lng) as lng
    from (select 1) one
    left join public.italian_cities c on c.slug = p_city_slug
    where p_lat is not null or c.slug is not null
  ),
  matched as (
    select
      pl.*,
      case
        when exists (select 1 from origin) and pl.location is not null then
          extensions.st_distance(
            pl.location,
            extensions.st_setsrid(extensions.st_makepoint((select lng from origin), (select lat from origin)), 4326)::extensions.geography
          ) / 1000.0
      end as distance_km
    from public.public_listings pl
    where (p_species is null or pl.species = p_species)
      and (p_size is null or pl.size = p_size)
      and (p_sex is null or pl.sex = p_sex)
      and (p_kids is not true or pl.good_with_kids is true)
      and (p_dogs is not true or pl.good_with_dogs is true)
      and (p_cats is not true or pl.good_with_cats is true)
      and (p_apartment is not true or pl.apartment_ok is true)
      and (
        nullif(btrim(p_query), '') is null
        or pl.search_vector @@ websearch_to_tsquery('italian', p_query)
      )
  ),
  filtered as (
    select * from matched
    where p_radius_km is null
      or not exists (select 1 from origin)
      or (distance_km is not null and distance_km <= p_radius_km)
  )
  select
    f.listing_id, f.slug, f.listing_type, f.listing_status, f.name, f.species, f.sex, f.size, f.breed,
    f.birth_date, f.city, f.organization_name, f.organization_slug, f.cover_photo_id, f.cover_photo_alt,
    f.published_at, f.distance_km,
    count(*) over () as total_count
  from filtered f
  order by
    case when exists (select 1 from origin) then f.distance_km end asc nulls last,
    f.published_at desc
  limit least(greatest(p_limit, 1), 48)
  offset greatest(p_offset, 0);
$$;

grant execute on function public.search_listings(
  public.species, public.animal_size, public.animal_sex, boolean, boolean, boolean, boolean,
  text, text, double precision, double precision, integer, integer, integer
) to anon, authenticated;

-- Backfill slugs for listings published before this migration.
do $$
declare
  r record;
  candidate text;
begin
  for r in
    select l.id, a.name
    from public.listings l
    join public.animals a on a.id = l.animal_id
    where l.slug is null and l.status in ('published', 'reserved')
  loop
    loop
      candidate := coalesce(nullif(left(public.slugify(r.name), 40), ''), 'animale')
        || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
      exit when not exists (select 1 from public.listings where slug = candidate);
    end loop;
    update public.listings set slug = candidate where id = r.id;
  end loop;
  update public.animals set city = city where location is null;
end;
$$;
