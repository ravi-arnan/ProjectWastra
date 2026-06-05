-- Wastra — rebrand the live AI assistant name (Mango -> Wastra).
--
-- Why a forward migration: editing the earlier seed migration only affects
-- fresh databases; an already-seeded production row keeps the old "Mango AI"
-- name. This updates that row in place.
--
-- Safe by design: a targeted replace() swaps only the brand token, so any admin
-- customizations to the prompts/messages are preserved. NULL columns stay NULL
-- (replace(NULL, ...) returns NULL). Idempotent — once no "Mango" remains,
-- re-running is a no-op.

update public.ai_agent_settings set
  system_prompt    = replace(system_prompt, 'Mango', 'Wastra'),
  greeting_message = replace(greeting_message, 'Mango', 'Wastra'),
  fallback_message = replace(fallback_message, 'Mango', 'Wastra'),
  refusal_message  = replace(refusal_message, 'Mango', 'Wastra')
where id = 1;
