-- =====================================================
-- Wastra — payments table for AstraPay (authoritative status store)
-- Idempotent.
-- =====================================================
--
-- Each AstraPay charge gets a row. The webhook (api/astrapay-notify) updates
-- the status authoritatively after verifying the SNAP signature; the client's
-- status poll reads this row instead of trusting a timer. Writes happen only
-- via the service role (server-side), so there is no anon/authenticated write
-- policy — default deny. Users may read their own payments.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  reference_no text not null unique,
  order_id text not null,
  destination_id text,
  user_id uuid references auth.users(id) on delete set null,
  amount integer not null check (amount >= 0),
  currency text not null default 'IDR',
  provider text not null default 'astrapay',
  status text not null default 'PENDING'
    check (status in ('PENDING', 'PAID', 'EXPIRED', 'FAILED')),
  qr_string text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_reference_no_idx on public.payments (reference_no);
create index if not exists payments_user_id_idx on public.payments (user_id);

alter table public.payments enable row level security;

-- Users read only their own payments. Server writes use the service role
-- (bypasses RLS) after signature verification — no write policy defined.
drop policy if exists "users can read own payments" on public.payments;
create policy "users can read own payments"
  on public.payments for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.touch_payments()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists payments_touch on public.payments;
create trigger payments_touch
  before update on public.payments
  for each row execute function public.touch_payments();
