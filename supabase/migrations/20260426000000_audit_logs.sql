-- =====================================================
-- Wastra — Audit logs
-- Records every admin action: AI settings updates, role grants/revokes.
-- Trigger-based for ai_agent_settings; security-definer RPCs insert
-- their own rows for role changes (see 20260426010000_user_management_rpcs.sql).
-- Idempotent.
-- =====================================================

-- 1. Table
create table if not exists public.audit_logs (
  id          bigserial primary key,
  actor_id    uuid references auth.users(id) on delete set null,
  action      text not null,
  target_type text,
  target_id   text,
  diff        jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx
  on public.audit_logs (actor_id, created_at desc);

alter table public.audit_logs enable row level security;

-- 2. RLS: only admins can read. No write policies → only security-definer
-- functions/triggers can insert. Direct mutations from clients are denied.
drop policy if exists "admins can read audit logs" on public.audit_logs;
create policy "admins can read audit logs"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin(auth.uid()));

-- 3. Trigger: log every UPDATE to ai_agent_settings.
-- api_key is redacted in both before/after halves.
create or replace function public.log_ai_agent_settings_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  before_json jsonb;
  after_json  jsonb;
begin
  before_json := to_jsonb(old);
  after_json  := to_jsonb(new);

  if before_json ? 'api_key' then
    before_json := jsonb_set(before_json, '{api_key}',
      to_jsonb(case when (old).api_key is null then null else '***REDACTED***' end));
  end if;
  if after_json ? 'api_key' then
    after_json := jsonb_set(after_json, '{api_key}',
      to_jsonb(case when (new).api_key is null then null else '***REDACTED***' end));
  end if;

  insert into public.audit_logs (actor_id, action, target_type, target_id, diff)
  values (
    (new).updated_by,
    'ai_settings.update',
    'ai_agent_settings',
    (new).id::text,
    jsonb_build_object('before', before_json, 'after', after_json)
  );
  return new;
end;
$$;

drop trigger if exists ai_agent_settings_audit on public.ai_agent_settings;
create trigger ai_agent_settings_audit
  after update on public.ai_agent_settings
  for each row execute function public.log_ai_agent_settings_update();

-- 4. RPC: list recent audit logs joined with actor email.
-- auth.users isn't directly joinable from PostgREST, so expose this RPC.
create or replace function public.admin_list_audit_logs(
  limit_count int default 100,
  offset_count int default 0,
  action_filter text default null
)
returns table (
  id          bigint,
  actor_id    uuid,
  actor_email text,
  action      text,
  target_type text,
  target_id   text,
  diff        jsonb,
  created_at  timestamptz
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
    l.id,
    l.actor_id,
    u.email::text as actor_email,
    l.action,
    l.target_type,
    l.target_id,
    l.diff,
    l.created_at
  from public.audit_logs l
  left join auth.users u on u.id = l.actor_id
  where action_filter is null or l.action = action_filter
  order by l.created_at desc
  limit greatest(1, least(limit_count, 500))
  offset greatest(0, offset_count);
end;
$$;

grant execute on function public.admin_list_audit_logs(int, int, text) to authenticated;
