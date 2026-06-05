-- =====================================================
-- Wastra — Expand allowed api_provider values
--
-- Original constraint only allowed 'github-models'. We now support several
-- OpenAI-compatible providers; this migration drops the old check and adds
-- a wider one. Idempotent.
-- =====================================================

alter table public.ai_agent_settings
  drop constraint if exists ai_agent_settings_api_provider_check;

alter table public.ai_agent_settings
  add constraint ai_agent_settings_api_provider_check
  check (api_provider in ('github-models', 'openai', 'openrouter', 'groq'));
