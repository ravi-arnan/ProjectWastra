-- Community reviews for destinations. Public read; only signed-in, non-anonymous
-- users may write, and only as themselves.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  destination_id text not null references public.destinations(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists reviews_destination_id_idx on public.reviews (destination_id, created_at desc);

alter table public.reviews enable row level security;

drop policy if exists "reviews are readable by everyone" on public.reviews;
create policy "reviews are readable by everyone"
  on public.reviews for select
  to anon, authenticated
  using (true);

-- Anonymous (guest) sessions are blocked; they must create an account first.
drop policy if exists "non-anonymous users insert own review" on public.reviews;
create policy "non-anonymous users insert own review"
  on public.reviews for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

drop policy if exists "users delete own review" on public.reviews;
create policy "users delete own review"
  on public.reviews for delete
  to authenticated
  using (user_id = auth.uid());
