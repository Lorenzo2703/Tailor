-- M11: favorites + user account data management (GDPR)

-- 1. Favorites Table
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, listing_id)
);

create index favorites_profile_idx on public.favorites (profile_id, created_at desc);
create index favorites_listing_idx on public.favorites (listing_id);

alter table public.favorites enable row level security;

-- Grants
grant select, insert, delete on table public.favorites to authenticated;

-- RLS Policies
-- Users can only see their own favorites
create policy "favorites_select_own"
  on public.favorites
  for select
  to authenticated
  using (profile_id = (select auth.uid()));

-- Users can only insert their own favorites
create policy "favorites_insert_own"
  on public.favorites
  for insert
  to authenticated
  with check (
    profile_id = (select auth.uid())
    and exists (
      select 1 from public.listings l
      where l.id = listing_id
      and l.status in ('published', 'reserved')
    )
  );

-- Users can only remove their own favorites
create policy "favorites_delete_own"
  on public.favorites
  for delete
  to authenticated
  using (profile_id = (select auth.uid()));

-- 2. GDPR Profile Export Function
create or replace function public.export_user_data(user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
  caller_id uuid;
begin
  caller_id := (select auth.uid());
  if caller_id is null or (caller_id <> user_id and not exists (
    select 1 from public.profiles p where p.id = caller_id and p.role = 'admin'
  )) then
    raise exception 'Unauthorized';
  end if;

  select jsonb_build_object(
    'profile', (
      select to_jsonb(p) from public.profiles p where p.id = user_id
    ),
    'favorites', coalesce((
      select jsonb_agg(jsonb_build_object(
        'listing_id', f.listing_id,
        'favorited_at', f.created_at
      ))
      from public.favorites f
      where f.profile_id = user_id
    ), '[]'::jsonb),
    'inquiries_sent', coalesce((
      select jsonb_agg(to_jsonb(i))
      from public.inquiries i
      where i.from_profile_id = user_id
    ), '[]'::jsonb),
    'organizations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'organization', to_jsonb(o),
        'role', om.member_role
      ))
      from public.organization_members om
      join public.organizations o on o.id = om.organization_id
      where om.profile_id = user_id
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

grant execute on function public.export_user_data(uuid) to authenticated;
