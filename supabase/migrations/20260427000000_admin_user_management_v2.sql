-- =====================================================
-- Wastra — Admin user management v2
--
-- Adds three RPCs:
--   - admin_delete_user(target uuid)        — hard-delete a user (cascades)
--   - admin_update_user(target, full_name)  — edit raw_user_meta_data.full_name
--   - admin_cleanup_anonymous_now()         — purge ALL anonymous users now
--
-- All three:
--   * security definer
--   * gate on public.is_admin(auth.uid())
--   * write a row to public.audit_logs
--
-- Idempotent.
-- =====================================================

-- Hard-delete a user. FK cascades to public.admins; auth.users delete also
-- removes auth.identities, sessions, refresh_tokens via the GoTrue schema's
-- own cascades. Refuses self-delete.
create or replace function public.admin_delete_user(target uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_email   text;
  target_was_admin boolean;
  target_was_anon  boolean;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden';
  end if;
  if target = auth.uid() then
    raise exception 'cannot delete self';
  end if;

  select email::text, coalesce(is_anonymous, false)
    into target_email, target_was_anon
    from auth.users where id = target;

  if target_email is null and not target_was_anon then
    -- Either truly missing, or no email + not anonymous (shouldn't happen).
    if not exists (select 1 from auth.users where id = target) then
      raise exception 'user not found';
    end if;
  end if;

  target_was_admin := exists (select 1 from public.admins where user_id = target);

  delete from auth.users where id = target;

  insert into public.audit_logs (actor_id, action, target_type, target_id, diff)
  values (
    auth.uid(),
    'user.delete',
    'auth.users',
    target::text,
    jsonb_build_object(
      'target_email', target_email,
      'was_admin', target_was_admin,
      'was_anonymous', target_was_anon
    )
  );
end;
$$;

grant execute on function public.admin_delete_user(uuid) to authenticated;


-- Update a user's display name (full_name in raw_user_meta_data). Other
-- fields (email, password) require the Admin REST API; out of scope here.
create or replace function public.admin_update_user(target uuid, new_full_name text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  old_meta     jsonb;
  new_meta     jsonb;
  old_name     text;
  target_email text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden';
  end if;
  if not exists (select 1 from auth.users where id = target) then
    raise exception 'user not found';
  end if;

  select raw_user_meta_data, email::text
    into old_meta, target_email
    from auth.users where id = target;

  old_name := old_meta->>'full_name';
  new_meta := coalesce(old_meta, '{}'::jsonb) || jsonb_build_object('full_name', new_full_name);

  update auth.users
    set raw_user_meta_data = new_meta
    where id = target;

  insert into public.audit_logs (actor_id, action, target_type, target_id, diff)
  values (
    auth.uid(),
    'user.update',
    'auth.users',
    target::text,
    jsonb_build_object(
      'target_email', target_email,
      'before', jsonb_build_object('full_name', old_name),
      'after',  jsonb_build_object('full_name', new_full_name)
    )
  );
end;
$$;

grant execute on function public.admin_update_user(uuid, text) to authenticated;


-- Force-clean all anonymous users right now (any age). Complements the
-- hourly pg_cron job which only deletes anonymous users older than 24h.
create or replace function public.admin_cleanup_anonymous_now()
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  deleted_count integer;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden';
  end if;

  with deleted as (
    delete from auth.users
    where coalesce(is_anonymous, false) = true
    returning id
  )
  select count(*) into deleted_count from deleted;

  insert into public.audit_logs (actor_id, action, target_type, diff)
  values (
    auth.uid(),
    'guests.cleanup',
    'auth.users',
    jsonb_build_object('deleted_count', deleted_count)
  );

  return deleted_count;
end;
$$;

grant execute on function public.admin_cleanup_anonymous_now() to authenticated;
