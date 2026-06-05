-- =====================================================
-- Wastra — AI Prompt + Safeguard settings
-- Menambah kolom baru ke ai_agent_settings. Idempotent.
-- =====================================================

alter table public.ai_agent_settings
  -- Prompt settings
  add column if not exists greeting_message text,
  add column if not exists fallback_message text,
  add column if not exists suggested_prompts text[] not null default '{}',
  add column if not exists persona text not null default 'informatif'
    check (persona in ('informatif', 'formal', 'santai', 'profesional')),
  -- Safeguard settings
  add column if not exists content_filter_enabled boolean not null default true,
  add column if not exists blocked_keywords text[] not null default '{}',
  add column if not exists refusal_message text not null default
    'Maaf, saya tidak bisa membantu dengan topik itu. Tanyakan seputar wisata Bali ya.',
  add column if not exists allow_anonymous_chat boolean not null default true;
