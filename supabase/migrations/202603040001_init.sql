-- Spin & Do schema migration
-- This migration creates all tables used by the V0 prototype.

create extension if not exists "uuid-ossp";

-- Core activity catalog
create table if not exists public.activities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null check (category in ('Movement', 'Food', 'Wellness', 'Explore')),
  duration integer not null check (duration > 0),
  energy_level integer not null check (energy_level between 1 and 5),
  social_context text not null check (social_context in ('Solo', 'With Friends', 'Either')),
  lat double precision,
  lng double precision,
  tags text[] default '{}',
  source_url text,
  created_at timestamptz not null default now()
);

-- User-completed activities
create table if not exists public.completed_experiences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  date_completed timestamptz not null default now(),
  rating integer check (rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);

-- Saved/favorited activities for each user (extra table to support favorites UI/API)
create table if not exists public.saved_activities (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, activity_id)
);

create index if not exists activities_category_idx on public.activities(category);
create index if not exists activities_social_context_idx on public.activities(social_context);
create index if not exists activities_duration_idx on public.activities(duration);
create index if not exists completed_experiences_user_id_idx on public.completed_experiences(user_id);
create index if not exists saved_activities_user_id_idx on public.saved_activities(user_id);

alter table public.activities enable row level security;
alter table public.completed_experiences enable row level security;
alter table public.saved_activities enable row level security;

-- Public read access for activity catalog
create policy "activities are readable by everyone"
  on public.activities for select
  using (true);

-- Authenticated users can manage their own completed records
create policy "users can view their completed experiences"
  on public.completed_experiences for select
  using (auth.uid() = user_id);

create policy "users can insert their completed experiences"
  on public.completed_experiences for insert
  with check (auth.uid() = user_id);

-- Authenticated users can manage their own favorites
create policy "users can view saved activities"
  on public.saved_activities for select
  using (auth.uid() = user_id);

create policy "users can save activities"
  on public.saved_activities for insert
  with check (auth.uid() = user_id);

create policy "users can unsave activities"
  on public.saved_activities for delete
  using (auth.uid() = user_id);
