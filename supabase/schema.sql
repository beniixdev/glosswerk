create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 50),
  email text not null check (char_length(email) between 5 and 254),
  phone text not null check (char_length(phone) between 9 and 20),
  car text not null check (char_length(car) between 2 and 50),
  service text not null check (
    service in ('kulso-mosas', 'belso-detailing', 'gepi-polirozas', 'keramia-bevonat')
  ),
  requested_date date not null,
  message text not null check (char_length(message) between 10 and 500),
  status text not null default 'pending' check (
    status in ('pending', 'confirmed', 'cancelled', 'completed')
  ),
  access_token_hash text not null,
  created_at timestamptz not null default now(),
  constraint requested_date_not_in_past check (requested_date >= current_date)
);

create index if not exists bookings_requested_date_idx
  on public.bookings (requested_date);

create index if not exists bookings_created_at_idx
  on public.bookings (created_at desc);

alter table public.bookings enable row level security;
revoke all on table public.bookings from anon, authenticated;

