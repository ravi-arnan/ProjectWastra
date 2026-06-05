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
