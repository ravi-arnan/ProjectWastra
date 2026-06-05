-- =====================================================
-- Wastra — Periodic cleanup of stale anonymous users
--
-- "Continue as Guest" creates an anonymous auth.users row per session;
-- those accumulate forever. This sets up an hourly pg_cron job that
-- deletes anonymous users older than 24h. Idempotent.
-- =====================================================

create extension if not exists pg_cron with schema extensions;

-- Function: delete anonymous users older than max_age. Returns number deleted.
create or replace function public.cleanup_stale_anonymous_users(max_age interval default '24 hours')
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  deleted_count integer;
begin
  with deleted as (
    delete from auth.users
    where coalesce(is_anonymous, false) = true
      and created_at < now() - max_age
    returning id
  )
  select count(*) into deleted_count from deleted;
  return deleted_count;
end;
$$;

-- Unschedule any prior incarnation (idempotent re-run).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'cleanup-stale-anonymous-users') then
    perform cron.unschedule('cleanup-stale-anonymous-users');
  end if;
end
$$;

-- Schedule hourly: every hour at minute 0.
select cron.schedule(
  'cleanup-stale-anonymous-users',
  '0 * * * *',
  $cmd$select public.cleanup_stale_anonymous_users('24 hours'::interval)$cmd$
);
