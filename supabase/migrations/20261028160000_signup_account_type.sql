-- M6: let sign-up choose between the two self-service account types.
-- Any other value (including 'admin' or 'shelter_member') falls back to 'adopter'.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    nullif(left(new.raw_user_meta_data ->> 'display_name', 80), ''),
    case
      when new.raw_user_meta_data ->> 'account_type' = 'private' then 'private'::public.user_role
      else 'adopter'::public.user_role
    end
  );
  return new;
end;
$$;
