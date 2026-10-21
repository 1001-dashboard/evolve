-- Evolve 1.4: optional self-recorded weight trend, separated per authenticated user.
-- Run after existing migrations; this does not update or delete earlier tables.
create extension if not exists pgcrypto;
create table if not exists public.evolve_weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  weight_kg numeric(5,1) not null check (weight_kg between 25 and 450),
  note text not null default '' check (char_length(note) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,day)
);
create index if not exists evolve_weight_entries_user_day on public.evolve_weight_entries(user_id,day desc);
alter table public.evolve_weight_entries enable row level security;
-- Ensures every read and write is limited to the authenticated user.
drop policy if exists evolve_weight_select_self on public.evolve_weight_entries;
create policy evolve_weight_select_self on public.evolve_weight_entries for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists evolve_weight_insert_self on public.evolve_weight_entries;
create policy evolve_weight_insert_self on public.evolve_weight_entries for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists evolve_weight_update_self on public.evolve_weight_entries;
create policy evolve_weight_update_self on public.evolve_weight_entries for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists evolve_weight_delete_self on public.evolve_weight_entries;
create policy evolve_weight_delete_self on public.evolve_weight_entries for delete to authenticated using (user_id = (select auth.uid()));
grant select,insert,update,delete on public.evolve_weight_entries to authenticated;
