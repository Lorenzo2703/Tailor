-- M10: contact requests (inquiries) and message threads.
-- Conversations stay inside the platform: no email or phone is ever exposed to the other party.
-- Anti-spam limits live here (not only in the UI). TO BE VERIFIED: the numeric limits below.

create type public.inquiry_status as enum ('open', 'closed', 'blocked');

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  from_profile_id uuid not null references public.profiles (id) on delete cascade,
  status public.inquiry_status not null default 'open',
  last_message_at timestamptz not null default now(),
  last_message_sender_id uuid references public.profiles (id) on delete set null,
  from_last_read_at timestamptz,
  owner_last_read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, from_profile_id)
);

create index inquiries_from_idx on public.inquiries (from_profile_id, last_message_at desc);
create index inquiries_listing_idx on public.inquiries (listing_id);

create table public.inquiry_messages (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inquiry_messages_thread_idx on public.inquiry_messages (inquiry_id, created_at);
create index inquiry_messages_sender_idx on public.inquiry_messages (sender_id, created_at desc);

create trigger set_updated_at before update on public.inquiries
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.inquiry_messages
  for each row execute function public.set_updated_at();

alter table public.inquiries enable row level security;
alter table public.inquiry_messages enable row level security;

-- Read-only for users: all writes go through the SECURITY DEFINER functions below.
grant select on public.inquiries, public.inquiry_messages to authenticated;

create policy inquiries_select on public.inquiries for select to authenticated
  using (
    from_profile_id = (select auth.uid())
    or public.can_manage_listing(listing_id)
    or public.is_admin()
  );

create policy inquiry_messages_select on public.inquiry_messages for select to authenticated
  using (exists (select 1 from public.inquiries i where i.id = inquiry_messages.inquiry_id));

-- Internal: validates and stores one message. Never callable by users.
create function public._add_inquiry_message(p_inquiry_id uuid, p_sender uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  body text := btrim(coalesce(p_body, ''));
  new_id uuid;
begin
  if char_length(body) < 1 or char_length(body) > 2000 then
    raise exception 'message_invalid' using errcode = '22023';
  end if;
  if (select count(*) from regexp_matches(body, 'https?://|www\.', 'gi')) > 2 then
    raise exception 'too_many_links' using errcode = '22023';
  end if;
  if (
    select count(*) from public.inquiry_messages
    where sender_id = p_sender and created_at > now() - interval '1 hour'
  ) >= 30 then
    raise exception 'message_limit' using errcode = '54000';
  end if;

  insert into public.inquiry_messages (inquiry_id, sender_id, body)
  values (p_inquiry_id, p_sender, body)
  returning id into new_id;

  -- Writing in a closed thread reopens it; blocked threads are rejected by the callers.
  update public.inquiries
  set last_message_at = now(),
      last_message_sender_id = p_sender,
      status = case when status = 'closed' then 'open'::public.inquiry_status else status end
  where id = p_inquiry_id;

  return new_id;
end;
$$;

create function public.create_inquiry(p_listing_id uuid, p_message text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  l public.listings;
  existing public.inquiries;
  new_id uuid;
begin
  if uid is null or not exists (select 1 from public.profiles where id = uid) then
    raise exception 'Autenticazione richiesta' using errcode = '42501';
  end if;

  select * into l from public.listings where id = p_listing_id;
  if not found or l.status <> 'published' or (l.expires_at is not null and l.expires_at <= now()) then
    raise exception 'listing_unavailable' using errcode = '22023';
  end if;
  if public.can_manage_animal(l.animal_id) then
    raise exception 'own_listing' using errcode = '22023';
  end if;

  -- One thread per person per listing: writing again just adds a message.
  select * into existing from public.inquiries where listing_id = p_listing_id and from_profile_id = uid;
  if found then
    if existing.status = 'blocked' then
      raise exception 'inquiry_blocked' using errcode = '42501';
    end if;
    perform public._add_inquiry_message(existing.id, uid, p_message);
    return existing.id;
  end if;

  if (
    select count(*) from public.inquiries where from_profile_id = uid and created_at > now() - interval '1 day'
  ) >= 10 then
    raise exception 'inquiry_limit' using errcode = '54000';
  end if;

  insert into public.inquiries (listing_id, from_profile_id)
  values (p_listing_id, uid)
  returning id into new_id;

  perform public._add_inquiry_message(new_id, uid, p_message);
  return new_id;
end;
$$;

create function public.post_inquiry_message(p_inquiry_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  i public.inquiries;
  l public.listings;
begin
  if uid is null then
    raise exception 'Autenticazione richiesta' using errcode = '42501';
  end if;
  select * into i from public.inquiries where id = p_inquiry_id;
  if not found then
    raise exception 'Operazione non consentita' using errcode = '42501';
  end if;
  select * into l from public.listings where id = i.listing_id;
  if not (i.from_profile_id = uid or public.can_manage_animal(l.animal_id)) then
    raise exception 'Operazione non consentita' using errcode = '42501';
  end if;
  if i.status = 'blocked' then
    raise exception 'inquiry_blocked' using errcode = '42501';
  end if;
  return public._add_inquiry_message(p_inquiry_id, uid, p_body);
end;
$$;

-- Senders can only close; the listing side can open, close or block.
create function public.set_inquiry_status(p_inquiry_id uuid, p_status public.inquiry_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  i public.inquiries;
  l public.listings;
  is_owner_side boolean;
begin
  if uid is null then
    raise exception 'Autenticazione richiesta' using errcode = '42501';
  end if;
  select * into i from public.inquiries where id = p_inquiry_id;
  if not found then
    raise exception 'Operazione non consentita' using errcode = '42501';
  end if;
  select * into l from public.listings where id = i.listing_id;
  is_owner_side := public.can_manage_animal(l.animal_id);

  if is_owner_side then
    update public.inquiries set status = p_status where id = p_inquiry_id;
  elsif i.from_profile_id = uid and p_status = 'closed' and i.status <> 'blocked' then
    update public.inquiries set status = 'closed' where id = p_inquiry_id;
  else
    raise exception 'Operazione non consentita' using errcode = '42501';
  end if;
end;
$$;

create function public.mark_inquiry_read(p_inquiry_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  i public.inquiries;
  l public.listings;
begin
  select * into i from public.inquiries where id = p_inquiry_id;
  if not found then
    return;
  end if;
  select * into l from public.listings where id = i.listing_id;
  if i.from_profile_id = uid then
    update public.inquiries set from_last_read_at = now() where id = p_inquiry_id;
  elsif public.can_manage_animal(l.animal_id) then
    update public.inquiries set owner_last_read_at = now() where id = p_inquiry_id;
  end if;
end;
$$;

-- Inbox and thread header. Counterpart names come from public display names only.
create function public.inquiry_view(p_inquiry_id uuid default null)
returns table (
  inquiry_id uuid,
  listing_id uuid,
  role text,
  status public.inquiry_status,
  last_message_at timestamptz,
  unread boolean,
  animal_name text,
  listing_slug text,
  listing_status public.listing_status,
  counterpart text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    i.id,
    i.listing_id,
    case when i.from_profile_id = (select auth.uid()) then 'sender' else 'owner' end,
    i.status,
    i.last_message_at,
    (
      i.last_message_sender_id is distinct from (select auth.uid())
      and i.last_message_at > coalesce(
        case when i.from_profile_id = (select auth.uid()) then i.from_last_read_at else i.owner_last_read_at end,
        '-infinity'::timestamptz
      )
    ),
    a.name,
    l.slug,
    l.status,
    case
      when i.from_profile_id = (select auth.uid())
        then coalesce(o.name, nullif(po.display_name, ''), 'Privato')
      else coalesce(nullif(ps.display_name, ''), 'Utente')
    end
  from public.inquiries i
  join public.listings l on l.id = i.listing_id
  join public.animals a on a.id = l.animal_id
  left join public.organizations o on o.id = a.organization_id
  left join public.profiles po on po.id = a.profile_id
  left join public.profiles ps on ps.id = i.from_profile_id
  where (p_inquiry_id is null or i.id = p_inquiry_id)
    and (i.from_profile_id = (select auth.uid()) or public.can_manage_animal(a.id))
  order by i.last_message_at desc
  limit 200;
$$;

-- Who to notify by email when `p_author` writes. Service role only: it returns private email addresses.
create function public.inquiry_notification_targets(p_inquiry_id uuid, p_author uuid)
returns table (email text, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  with i as (
    select i.from_profile_id, a.profile_id as owner_profile_id, a.organization_id
    from public.inquiries i
    join public.listings l on l.id = i.listing_id
    join public.animals a on a.id = l.animal_id
    where i.id = p_inquiry_id
  ),
  recipients as (
    select i.from_profile_id as profile_id from i where p_author is distinct from i.from_profile_id
    union
    select i.owner_profile_id from i
      where i.from_profile_id = p_author and i.owner_profile_id is not null
    union
    select m.profile_id from i
      join public.organization_members m on m.organization_id = i.organization_id
      where i.from_profile_id = p_author
  )
  select u.email::text, p.display_name
  from recipients r
  join public.profiles p on p.id = r.profile_id
  join auth.users u on u.id = r.profile_id
  where r.profile_id is distinct from p_author
    and u.email is not null
    and coalesce((p.notification_prefs ->> 'email_inquiries')::boolean, true);
$$;

revoke all on function
  public._add_inquiry_message(uuid, uuid, text),
  public.create_inquiry(uuid, text),
  public.post_inquiry_message(uuid, text),
  public.set_inquiry_status(uuid, public.inquiry_status),
  public.mark_inquiry_read(uuid),
  public.inquiry_view(uuid),
  public.inquiry_notification_targets(uuid, uuid)
from public, anon, authenticated;

grant execute on function
  public.create_inquiry(uuid, text),
  public.post_inquiry_message(uuid, text),
  public.set_inquiry_status(uuid, public.inquiry_status),
  public.mark_inquiry_read(uuid),
  public.inquiry_view(uuid)
to authenticated;

grant execute on function public.inquiry_notification_targets(uuid, uuid) to service_role;
