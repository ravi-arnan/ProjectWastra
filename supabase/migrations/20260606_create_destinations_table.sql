-- ==============================================================================
-- MIGRATION: CREATE DESTINATIONS TABLE
-- Deskripsi: File SQL ini disediakan sebagai persiapan jika di masa depan 
--            Wastra akan memigrasikan data destinasi statis ke dalam database Supabase.
-- ==============================================================================

-- 1. Membuat tabel 'destinations'
CREATE TABLE IF NOT EXISTS public.destinations (
  id text primary key,
  name text not null,
  location text not null,
  region text not null,
  category text not null,
  distance text,
  density numeric not null default 0,
  density_label text,
  visitors integer not null default 0,
  max_capacity integer not null,
  rating numeric,
  review_count integer,
  open_hours text,
  ticket_price text,
  parking text,
  lat double precision not null,
  lng double precision not null,
  image text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Mengatur Row Level Security (RLS)
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

-- 3. Membuat Policies
-- Siapa saja (termasuk turis publik) bisa MELIHAT data destinasi
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.destinations FOR SELECT
  USING ( true );

-- HANYA Admin yang bisa MENAMBAH, MENGUBAH, atau MENGHAPUS data destinasi
CREATE POLICY "Admins can insert destinations"
  ON public.destinations FOR INSERT
  WITH CHECK ( exists (select 1 from public.admins where user_id = auth.uid()) );

CREATE POLICY "Admins can update destinations"
  ON public.destinations FOR UPDATE
  USING ( exists (select 1 from public.admins where user_id = auth.uid()) );

CREATE POLICY "Admins can delete destinations"
  ON public.destinations FOR DELETE
  USING ( exists (select 1 from public.admins where user_id = auth.uid()) );

-- 4. Opsional: Membuat index untuk pencarian lokasi yang lebih cepat
CREATE INDEX IF NOT EXISTS destinations_category_idx ON public.destinations (category);
CREATE INDEX IF NOT EXISTS destinations_region_idx ON public.destinations (region);
