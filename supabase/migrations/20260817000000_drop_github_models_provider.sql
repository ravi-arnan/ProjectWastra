-- GitHub Models was fully retired on 2026-07-30: its inference API answers
-- 410 Gone for every request regardless of token, so 'github-models' is no
-- longer a usable value. Move existing rows to Groq and drop it from the
-- allowed set so the admin UI and API can never select it again.

update public.ai_agent_settings
set api_provider = 'groq',
    default_model = 'llama-3.3-70b-versatile',
    api_key = null
where api_provider = 'github-models';

alter table public.ai_agent_settings
  drop constraint if exists ai_agent_settings_api_provider_check;

alter table public.ai_agent_settings
  add constraint ai_agent_settings_api_provider_check
  check (api_provider in ('groq', 'openai', 'openrouter'));
