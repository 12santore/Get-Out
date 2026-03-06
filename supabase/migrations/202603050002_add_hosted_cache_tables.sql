-- Hosted cache + ops logging tables to avoid local filesystem dependency in production.

create table if not exists public.city_update_requests (
  request_id text primary key,
  requested_at timestamptz not null default now(),
  status text not null default 'pending_approval',
  lat double precision not null,
  lng double precision not null,
  requester_email text not null default ''
);

create table if not exists public.nearby_pull_events (
  id uuid primary key default uuid_generate_v4(),
  pulled_at timestamptz not null default now(),
  lat double precision not null,
  lng double precision not null,
  category text not null,
  name text not null,
  source_url text,
  source_provider text not null default 'unknown'
);

create table if not exists public.system_spend_audit (
  id uuid primary key default uuid_generate_v4(),
  logged_at timestamptz not null default now(),
  kind text not null,
  provider text not null,
  estimated_usd numeric(12,6) not null default 0,
  notes text not null default ''
);

create table if not exists public.cache_review_items (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null check (category in ('Movement', 'Food', 'Wellness', 'Explore')),
  duration integer not null check (duration > 0),
  energy_level integer not null check (energy_level between 1 and 5),
  social_context text not null check (social_context in ('Solo', 'With Friends', 'Either')),
  lat double precision,
  lng double precision,
  tags text[] not null default '{}',
  source_url text,
  source_name text not null default '',
  start_date text not null default '',
  image_url text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists city_update_requests_requested_at_idx on public.city_update_requests(requested_at);
create index if not exists nearby_pull_events_pulled_at_idx on public.nearby_pull_events(pulled_at);
create index if not exists system_spend_audit_logged_at_idx on public.system_spend_audit(logged_at);
create index if not exists system_spend_audit_kind_idx on public.system_spend_audit(kind);
create index if not exists cache_review_items_created_at_idx on public.cache_review_items(created_at);

alter table public.city_update_requests enable row level security;
alter table public.nearby_pull_events enable row level security;
alter table public.system_spend_audit enable row level security;
alter table public.cache_review_items enable row level security;

-- Keep these internal/admin-only by default (no public policies).
