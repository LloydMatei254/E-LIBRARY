-- Allow Staff Portal admin signups (requested_role = 'librarian' or 'super_admin')
-- to receive their requested staff role when the auth trigger creates/links their profile.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_requested_role text := coalesce(new.raw_user_meta_data ->> 'requested_role', 'member');
  v_role text := case
    when v_requested_role in ('librarian', 'super_admin') then v_requested_role
    else 'member'
  end;
begin
  if new.email_confirmed_at is null then
    return new;
  end if;

  update public.profiles
  set auth_user_id = new.id,
      full_name = coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), full_name),
      phone = coalesce(new.raw_user_meta_data ->> 'phone', phone),
      role = case when role = 'member' then v_role else role end
  where lower(email) = lower(new.email)
    and auth_user_id is null;

  if not found then
    insert into public.profiles (auth_user_id, full_name, email, phone, role)
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Library member'),
      new.email,
      coalesce(new.raw_user_meta_data ->> 'phone', ''),
      v_role
    )
    on conflict do nothing;
  end if;

  return new;
end;
$$;

-- Upgrade any already-confirmed Staff Portal signups whose profile defaulted to 'member'.
update public.profiles p
set role = u.raw_user_meta_data ->> 'requested_role'
from auth.users u
where p.auth_user_id = u.id
  and u.email_confirmed_at is not null
  and u.raw_user_meta_data ->> 'requested_role' in ('librarian', 'super_admin')
  and p.role = 'member';

