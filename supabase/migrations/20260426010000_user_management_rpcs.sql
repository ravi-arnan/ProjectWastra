-- =====================================================
-- Wastra — User management RPCs
-- Admin-only functions to list users and grant/revoke admin role.
-- Each role mutation also writes to public.audit_logs.
--
-- NOTE: suspend / delete a user requires the Supabase Admin API
-- (service role) and is intentionally NOT covered here. Add an
-- Edge Function later if that becomes needed.
--
-- Idempotent.
-- =====================================================

create or replace function public.admin_list_users()
returns table (
  id              uuid,
  email           text,
  full_name       text,
  created_at      timestamptz,
  last_sign_in_at timestamptz,
  is_admin        boolean,
  is_anonymous    boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden';
  end if;

  return query
  select
    u.id,
    u.email::text,
    coalesce(u.raw_user_meta_data->>'full_name', '')::text as full_name,
    u.created_at,
    u.last_sign_in_at,
    (a.user_id is not null) as is_admin,
    coalesce(u.is_anonymous, false) as is_anonymous
  from auth.users u
  left join public.admins a on a.user_id = u.id
  order by u.created_at desc;
end;
$$;

grant execute on function public.admin_list_users() to authenticated;


create or replace function public.admin_grant_admin(target uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_email text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden';
  end if;

  if not exists (select 1 from auth.users where id = target) then
    raise exception 'user not found';
  end if;

  insert into public.admins (user_id) values (target)
  on conflict (user_id) do nothing;

  select email::text into target_email from auth.users where id = target;

  insert into public.audit_logs (actor_id, action, target_type, target_id, diff)
  values (
    auth.uid(),
    'admin.grant',
    'admins',
    target::text,
    jsonb_build_object('target', target, 'target_email', target_email)
  );
end;
$$;

grant execute on function public.admin_grant_admin(uuid) to authenticated;


create or replace function public.admin_revoke_admin(target uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_email text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden';
  end if;

  if target = auth.uid() then
    raise exception 'cannot revoke self';
  end if;

  delete from public.admins where user_id = target;

  select email::text into target_email from auth.users where id = target;

  insert into public.audit_logs (actor_id, action, target_type, target_id, diff)
  values (
    auth.uid(),
    'admin.revoke',
    'admins',
    target::text,
    jsonb_build_object('target', target, 'target_email', target_email)
  );
end;
$$;

grant execute on function public.admin_revoke_admin(uuid) to authenticated;
