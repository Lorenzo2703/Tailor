-- M12: Reports & Moderation Back-office

-- 1. Enum for report reasons and status
create type public.report_reason as enum (
  'suspected_scam',
  'commercial_sale_prohibited',
  'underage_animal',
  'illegal_import_or_no_microchip',
  'animal_welfare_concern',
  'inappropriate_content',
  'other'
);

create type public.report_status as enum (
  'pending',
  'investigating',
  'resolved_takedown',
  'dismissed'
);

-- 2. Reports Table
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  listing_id uuid not null references public.listings (id) on delete cascade,
  reason public.report_reason not null,
  details text check (char_length(details) between 10 and 2000),
  status public.report_status not null default 'pending',
  handled_by uuid references public.profiles (id) on delete set null,
  handled_at timestamptz,
  resolution_notes text check (char_length(resolution_notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reports_status_idx on public.reports (status, created_at desc);
create index reports_listing_idx on public.reports (listing_id);
create index reports_reporter_idx on public.reports (reporter_id);

alter table public.reports enable row level security;

-- Grants
grant select, insert on table public.reports to authenticated;
grant update on table public.reports to authenticated; -- Restricted via policy to admin only

-- RLS Policies
-- Users can see reports they submitted; admins can see all reports
create policy "reports_select_owner_or_admin"
  on public.reports
  for select
  to authenticated
  using (
    reporter_id = (select auth.uid())
    or public.is_admin()
  );

-- Authenticated users can submit a report for a published or reserved listing
create policy "reports_insert_authenticated"
  on public.reports
  for insert
  to authenticated
  with check (
    reporter_id = (select auth.uid())
    and exists (
      select 1 from public.listings l
      where l.id = listing_id
      and l.status in ('published', 'reserved')
    )
  );

-- Only admins can update reports (resolve/dismiss/takedown)
create policy "reports_update_admin_only"
  on public.reports
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 3. Stored Procedure for Admin Moderation Action on a Report (Notice-and-Takedown)
create or replace function public.admin_resolve_report(
  report_id uuid,
  new_status public.report_status,
  takedown_listing boolean,
  notes text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid;
  target_listing_id uuid;
begin
  caller_id := (select auth.uid());
  if caller_id is null or not exists (
    select 1 from public.profiles p where p.id = caller_id and p.role = 'admin'
  ) then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  select listing_id into target_listing_id
  from public.reports
  where id = report_id;

  if target_listing_id is null then
    raise exception 'Report not found' using errcode = 'P0002';
  end if;

  -- Update report
  update public.reports
  set
    status = new_status,
    handled_by = caller_id,
    handled_at = now(),
    resolution_notes = notes,
    updated_at = now()
  where id = report_id;

  -- If takedown requested, change listing status to 'removed'
  if takedown_listing then
    update public.listings
    set
      status = 'removed',
      updated_at = now()
    where id = target_listing_id;

    -- Append audit log
    insert into public.moderation_log (actor_id, action, target_type, target_id, reason)
    values (caller_id, 'listing_takedown', 'listing', target_listing_id, notes);
  else
    insert into public.moderation_log (actor_id, action, target_type, target_id, reason)
    values (caller_id, 'report_resolved', 'report', report_id, notes);
  end if;
end;
$$;

grant execute on function public.admin_resolve_report(uuid, public.report_status, boolean, text) to authenticated;
