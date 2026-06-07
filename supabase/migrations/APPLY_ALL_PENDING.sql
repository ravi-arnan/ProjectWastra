-- =====================================================
-- ProjectMango — bundle of every pending migration.
-- Paste this whole file into Supabase → SQL Editor → Run.
-- Every statement is idempotent; safe to re-run.
--
-- This single file is provided for convenience because the MCP
-- connection in the current Claude session is read-only. The
-- canonical history lives as five separate files in this folder:
--   20260419010000_ai_prompt_and_safeguard.sql
--   20260425000000_ai_agent_provider_key.sql
--   20260425010000_seed_ai_defaults.sql
--   20260426000000_audit_logs.sql
--   20260426010000_user_management_rpcs.sql
-- =====================================================


-- =====================================================
-- 1) 20260419010000_ai_prompt_and_safeguard
-- Adds prompt + safeguard columns (incl. allow_anonymous_chat).
-- =====================================================
alter table public.ai_agent_settings
  add column if not exists greeting_message text,
  add column if not exists fallback_message text,
  add column if not exists suggested_prompts text[] not null default '{}',
  add column if not exists persona text not null default 'informatif'
    check (persona in ('informatif', 'formal', 'santai', 'profesional')),
  add column if not exists content_filter_enabled boolean not null default true,
  add column if not exists blocked_keywords text[] not null default '{}',
  add column if not exists refusal_message text not null default
    'Maaf, saya tidak bisa membantu dengan topik itu. Tanyakan seputar wisata Bali ya.',
  add column if not exists allow_anonymous_chat boolean not null default true;


-- =====================================================
-- 2) 20260425000000_ai_agent_provider_key
-- Adds api_key + api_provider; locks down SELECT to admins;
-- exposes get_public_ai_settings() for anonymous chat page.
-- =====================================================
alter table public.ai_agent_settings
  add column if not exists api_key text,
  add column if not exists api_provider text not null default 'github-models'
    check (api_provider in ('github-models'));

drop policy if exists "anyone can read ai settings" on public.ai_agent_settings;
drop policy if exists "admins can read ai settings" on public.ai_agent_settings;

create policy "admins can read ai settings"
  on public.ai_agent_settings for select
  to authenticated
  using (public.is_admin(auth.uid()));

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
-- 3) 20260425010000_seed_ai_defaults
-- Seeds singleton row + backfills NULL/empty defaults.
-- =====================================================
insert into public.ai_agent_settings (id) values (1)
on conflict (id) do nothing;

update public.ai_agent_settings set
  system_prompt = case
    when system_prompt is null or btrim(system_prompt) = '' then $$Kamu adalah Mango AI, asisten wisata cerdas untuk platform pariwisata Bali. Kamu membantu pengguna menemukan destinasi terbaik di seluruh Bali, memberikan informasi lengkap, rekomendasi waktu kunjungan, dan rencana perjalanan.

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
    when greeting_message is null or btrim(greeting_message) = '' then 'Halo! Saya Mango AI. Tanyakan apa saja tentang destinasi wisata di Bali — kepadatan, rekomendasi, waktu terbaik berkunjung, dan lainnya.'
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
-- 4) 20260426000000_audit_logs
-- audit_logs table + RLS + ai_agent_settings update trigger
-- + admin_list_audit_logs RPC.
-- =====================================================
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

drop policy if exists "admins can read audit logs" on public.audit_logs;
create policy "admins can read audit logs"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin(auth.uid()));

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
-- 5) 20260426010000_user_management_rpcs
-- admin_list_users, admin_grant_admin, admin_revoke_admin.
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
