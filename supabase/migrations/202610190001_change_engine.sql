-- Evolve Change Engine (applica UNA volta nel SQL Editor Supabase).
-- Mantiene intatte le tabelle già esistenti, le conversazioni e gli account.
create extension if not exists pgcrypto;

create table if not exists public.evolve_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('benessere','alcol','lingue','lavoro','cambiamento','altro')),
  title text not null check (char_length(title) between 3 and 120),
  objective text check (objective is null or char_length(objective) <= 500),
  level smallint not null default 1 check (level between 1 and 4),
  level_since date not null default current_date,
  status text not null default 'active' check (status in ('active','paused','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.evolve_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null references public.evolve_programs(id) on delete cascade,
  day date not null,
  exercise_key text not null check (char_length(exercise_key) between 2 and 30),
  outcome text not null check (outcome in ('done','difficult','skipped')),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  unique(program_id, day)
);

create index if not exists evolve_programs_user on public.evolve_programs(user_id, status, created_at desc);
create index if not exists evolve_checkins_user_day on public.evolve_checkins(user_id, day desc);
create index if not exists evolve_checkins_program_day on public.evolve_checkins(program_id, day desc);

alter table public.evolve_programs enable row level security;
alter table public.evolve_checkins enable row level security;

create policy "evolve_programs_owner" on public.evolve_programs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "evolve_checkins_owner" on public.evolve_checkins
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid()) and
    exists (select 1 from public.evolve_programs p
      where p.id = program_id and p.user_id = (select auth.uid()))
  );
