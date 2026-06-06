-- ==============================================================================
-- MIGRATION: CREATE LOCAL MANAGERS TABLE
-- Deskripsi: Memetakan user (Auth Supabase) ke satu spesifik destinasi wisata.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.local_managers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  destination_id text not null, -- Sesuai dengan ID destinasi statis MVP (contoh: 'tanah-lot')
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Row Level Security (RLS)
ALTER TABLE public.local_managers ENABLE ROW LEVEL SECURITY;

-- Siapa saja bisa melihat data manager (untuk frontend validation)
CREATE POLICY "Local managers are viewable by everyone."
  ON public.local_managers FOR SELECT
  USING ( true );

-- Hanya Super Admin yang bisa menambah/menghapus local manager
CREATE POLICY "Admins can insert local managers"
  ON public.local_managers FOR INSERT
  WITH CHECK ( exists (select 1 from public.admins where user_id = auth.uid()) );

CREATE POLICY "Admins can delete local managers"
  ON public.local_managers FOR DELETE
  USING ( exists (select 1 from public.admins where user_id = auth.uid()) );
