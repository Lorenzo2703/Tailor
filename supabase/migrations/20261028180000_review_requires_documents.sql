-- A rejected organization must upload at least one new document before asking for another review.

create or replace function public.request_organization_review(p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_org_owner(p_org_id) then
    raise exception 'Operazione non consentita' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.organization_documents
    where organization_id = p_org_id and status = 'pending'
  ) then
    raise exception 'documents_required' using errcode = '22023';
  end if;
  update public.organizations
  set verification_status = 'pending'
  where id = p_org_id and verification_status = 'rejected';
  if not found then
    raise exception 'Stato non valido' using errcode = '22023';
  end if;
end;
$$;
