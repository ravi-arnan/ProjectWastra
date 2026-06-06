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

-- Manager hanya bisa melihat baris miliknya sendiri; Super Admin bisa melihat semua.
-- (Sebelumnya USING(true) membocorkan seluruh pemetaan user_id -> destinasi ke publik.)
CREATE POLICY "Managers can view their own row; admins view all"
  ON public.local_managers FOR SELECT
  TO authenticated
  USING ( user_id = auth.uid() OR public.is_admin(auth.uid()) );

-- Hanya Super Admin yang bisa menambah/menghapus local manager
CREATE POLICY "Admins can insert local managers"
  ON public.local_managers FOR INSERT
  TO authenticated
  WITH CHECK ( public.is_admin(auth.uid()) );

CREATE POLICY "Admins can delete local managers"
  ON public.local_managers FOR DELETE
  TO authenticated
  USING ( public.is_admin(auth.uid()) );
