create function public.undo_adopted_listing(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  l public.listings;
begin
  if uid is null then
    raise exception 'Autenticazione richiesta' using errcode = '42501';
  end if;

  select * into l from public.listings where id = p_listing_id;
  if not found or not public.can_manage_animal(l.animal_id) then
    raise exception 'Operazione non consentita' using errcode = '42501';
  end if;
  if l.status <> 'adopted' then
    raise exception 'L''annuncio non risulta affidato' using errcode = '22023';
  end if;

  update public.listings
  set status = case
    when expires_at is not null and expires_at <= now() then 'expired'::public.listing_status
    else 'published'::public.listing_status
  end
  where id = p_listing_id;
end;
$$;

revoke all on function public.undo_adopted_listing(uuid) from public, anon, authenticated;
grant execute on function public.undo_adopted_listing(uuid) to authenticated;