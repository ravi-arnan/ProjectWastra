-- Newsletter signups from the public landing page footer.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'landing',
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

-- Anyone (incl. anonymous visitors) may subscribe; the WITH CHECK validates the
-- email shape and pins the source so the public policy can't be abused to write
-- arbitrary rows. Nobody may read the list through the API — only the service
-- role / admins via the dashboard.
drop policy if exists "anyone can subscribe" on public.newsletter_subscribers;
create policy "anyone can subscribe"
  on public.newsletter_subscribers
  for insert
  to anon, authenticated
  with check (
    email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and length(email) <= 254
    and source = 'landing'
  );
