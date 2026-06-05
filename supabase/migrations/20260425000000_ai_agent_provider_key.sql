-- =====================================================
-- Wastra — AI Agent provider + API key
-- Adds api_key + api_provider columns and locks down SELECT
-- so only admins can read api_key. Non-admins use a SECURITY
-- DEFINER function that returns only public-safe columns.
-- Idempotent.
-- =====================================================

-- 1. Add new columns
alter table public.ai_agent_settings
  add column if not exists api_key text,
  add column if not exists api_provider text not null default 'github-models'
    check (api_provider in ('github-models'));

-- 2. Lock down SELECT so anon/non-admin users cannot read api_key
drop policy if exists "anyone can read ai settings" on public.ai_agent_settings;
drop policy if exists "admins can read ai settings" on public.ai_agent_settings;

create policy "admins can read ai settings"
  on public.ai_agent_settings for select
  to authenticated
  using (public.is_admin(auth.uid()));

-- 3. Public RPC for non-sensitive settings used by the chat page
-- Returns only fields that are safe for anonymous users to see.
create or replace function public.get_public_ai_settings()
returns table (
  greeting_message text,
  suggested_prompts text[],
  fallback_message text
)
language sql
security definer
set search_path = public
as $$
  select greeting_message, suggested_prompts, fallback_message
  from public.ai_agent_settings
  where id = 1;
$$;

grant execute on function public.get_public_ai_settings() to anon, authenticated;
