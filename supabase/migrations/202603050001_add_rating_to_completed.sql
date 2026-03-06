-- Adds user rating support to completed experiences.
alter table if exists public.completed_experiences
  add column if not exists rating integer check (rating between 1 and 5);
