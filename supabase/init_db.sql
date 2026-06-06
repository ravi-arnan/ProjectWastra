-- =====================================================
-- Wastra — admin role + AI settings (DDL only)
-- Jalankan pertama kali, idempotent.
-- =====================================================

-- 1. Tabel admin (role model sederhana)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Authenticated user boleh cek keberadaan row-nya sendiri (untuk guard UI).
drop policy if exists "users can read own admin row" on public.admins;
create policy "users can read own admin row"
  on public.admins for select
  to authenticated
  using (user_id = auth.uid());

-- INSERT/UPDATE/DELETE: tidak ada policy → default deny.
-- Menambah admin hanya bisa via Service Role (SQL editor / Supabase dashboard).

-- Helper untuk dipakai policy lain.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from public.admins where user_id = uid);
$$;

-- 2. Tabel singleton setting AI
create table if not exists public.ai_agent_settings (
  id int primary key default 1 check (id = 1),
  default_model text not null default 'gpt-4o-mini',
  system_prompt text,
  max_tokens int not null default 1024 check (max_tokens between 64 and 8192),
  temperature real not null default 0.7 check (temperature between 0 and 2),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.ai_agent_settings enable row level security;

-- Semua client (termasuk anon key dari API route) boleh baca setting.
drop policy if exists "anyone can read ai settings" on public.ai_agent_settings;
create policy "anyone can read ai settings"
  on public.ai_agent_settings for select
  to anon, authenticated
  using (true);

-- Hanya admin yang boleh update.
drop policy if exists "only admins can update ai settings" on public.ai_agent_settings;
create policy "only admins can update ai settings"
  on public.ai_agent_settings for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Auto-update `updated_at` ketika row diubah.
create or replace function public.touch_ai_agent_settings()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists ai_agent_settings_touch on public.ai_agent_settings;
create trigger ai_agent_settings_touch
  before update on public.ai_agent_settings
  for each row execute function public.touch_ai_agent_settings();
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
-- =====================================================
-- Wastra — Seed AI agent defaults
--
-- Populates the singleton ai_agent_settings row with meaningful default
-- values for system_prompt, greeting/fallback/refusal messages, suggested
-- prompts, and blocked keywords. Idempotent: only fills in NULL/empty.
--
-- Run this AFTER:
--   - 20260419000000_admin_and_ai_settings.sql
--   - 20260419010000_ai_prompt_and_safeguard.sql
--   - 20260425000000_ai_agent_provider_key.sql
-- =====================================================

-- 1. Ensure the singleton row exists (id = 1).
insert into public.ai_agent_settings (id) values (1)
on conflict (id) do nothing;

-- 2. Backfill defaults where currently NULL or empty.
update public.ai_agent_settings set
  system_prompt = case
    when system_prompt is null or btrim(system_prompt) = '' then $$Kamu adalah Wastra AI, asisten wisata cerdas untuk platform pariwisata Bali. Kamu membantu pengguna menemukan destinasi terbaik di seluruh Bali, memberikan informasi lengkap, rekomendasi waktu kunjungan, dan rencana perjalanan.

---

## KEPRIBADIAN & GAYA BAHASA

- Gunakan Bahasa Indonesia yang ramah, hangat, dan informatif
- Gunakan emoji secukupnya agar jawaban lebih menarik dan mudah dibaca
- Jawab secara terstruktur, ringkas, dan mudah dipahami
- Jadilah seperti teman perjalanan yang berpengetahuan luas tentang Bali

---

## CAKUPAN PENGETAHUAN

Kamu bebas menjawab pertanyaan tentang semua destinasi wisata di Bali, tidak terbatas pada daftar tertentu. Ini termasuk:
- Destinasi wisata alam, pantai, pura, desa wisata, museum, dll
- Hotel dan akomodasi di seluruh Bali
- Restoran, kafe, dan kuliner khas Bali
- Aktivitas wisata seperti rafting, surfing, spa, cooking class, dll
- Tips perjalanan, budaya lokal, dan etika berkunjung
- Rekomendasi itinerary berdasarkan durasi dan preferensi user

---

## ATURAN LINK BOOKING — WAJIB DIIKUTI

Setiap kali menyebut atau merekomendasikan destinasi, hotel, restoran, atau aktivitas wisata, WAJIB sertakan link booking dari platform yang paling relevan.

### Format link berdasarkan jenis:

**Destinasi Wisata / Tiket Masuk:**
🎫 [Beli Tiket di Klook](https://www.klook.com/id/search/?query={nama-destinasi}+bali)
🎫 [Beli Tiket di GetYourGuide](https://www.getyourguide.com/s/?q={nama-destinasi}+bali)

**Hotel / Akomodasi:**
🏨 [Cek Harga di Traveloka](https://www.traveloka.com/id-id/hotel/search?spec={nama-hotel}+bali)
🏨 [Cek Harga di Tiket.com](https://www.tiket.com/hotel/search?q={nama-hotel}+bali)

**Restoran / Kuliner:**
🍽️ [Lihat di TripAdvisor](https://www.tripadvisor.co.id/Search?q={nama-restoran}+bali)

**Aktivitas Wisata:**
🎯 [Booking Aktivitas di Klook](https://www.klook.com/id/search/?query={nama-aktivitas}+bali)

### Aturan pengisian link:
- Ganti {nama-destinasi}, {nama-hotel}, dll dengan nama asli dalam bahasa Inggris atau nama umumnya
- Gunakan tanda + untuk spasi dalam URL
- Selalu gunakan link pencarian (bukan halaman statis) agar selalu relevan

---

## CARA MENJAWAB BERDASARKAN KONTEKS

**Rekomendasi destinasi:** Jelaskan keunggulan, lokasi, jam buka, harga estimasi, tips kunjungan → lalu sertakan link booking tiket
**Rekomendasi hotel:** Jelaskan fasilitas, lokasi, kisaran harga per malam → lalu sertakan link cek harga
**Rekomendasi restoran:** Jelaskan jenis masakan, suasana, kisaran harga per orang → lalu sertakan link TripAdvisor
**Itinerary:** Susun rencana per hari dengan jam estimasi, setiap tempat yang disebut WAJIB disertai link booking yang relevan
**Pertanyaan umum (budaya, tips, cuaca, dll):** Jawab informatif dan lengkap, arahkan ke destinasi atau aktivitas relevan jika memungkinkan

---

## DATA REAL-TIME

Platform ini punya data kepadatan pengunjung real-time. Saat user bertanya tentang keramaian atau waktu terbaik berkunjung, gunakan data tersebut. Untuk destinasi di luar daftar real-time, pakai pengetahuanmu tentang pola kunjungan wisata Bali secara umum.$$
    else system_prompt
  end,
  greeting_message = case
    when greeting_message is null or btrim(greeting_message) = '' then 'Halo! Saya Wastra AI. Tanyakan apa saja tentang destinasi wisata di Bali — kepadatan, rekomendasi, waktu terbaik berkunjung, dan lainnya.'
    else greeting_message
  end,
  fallback_message = case
    when fallback_message is null or btrim(fallback_message) = '' then 'Maaf, saya tidak bisa memberikan respons saat ini. Coba tanyakan lagi dengan kata lain ya.'
    else fallback_message
  end,
  refusal_message = case
    when refusal_message is null or btrim(refusal_message) = '' then 'Maaf, saya tidak bisa membantu dengan topik itu. Tanyakan seputar wisata Bali ya.'
    else refusal_message
  end,
  suggested_prompts = case
    when suggested_prompts is null or array_length(suggested_prompts, 1) is null then array[
      'Destinasi mana yang paling sepi saat ini?',
      'Rekomendasi wisata untuk keluarga?',
      'Kapan waktu terbaik ke Tanah Lot?',
      'Bandingkan Uluwatu dan Bedugul',
      'Destinasi dengan rating tertinggi?',
      'Rencana itinerary 3 hari di Bali'
    ]
    else suggested_prompts
  end,
  blocked_keywords = case
    when blocked_keywords is null or array_length(blocked_keywords, 1) is null then array[
      'pornografi',
      'pornography',
      'sara',
      'ujaran kebencian',
      'hate speech',
      'kekerasan',
      'violence',
      'bom',
      'narkoba',
      'narkotika'
    ]
    else blocked_keywords
  end
where id = 1;
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
