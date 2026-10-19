-- EVOLVE v0.6 - profiles and weekly reviews. Run ONCE after v0.4 migration.
-- No existing tables or rows are removed.
create table if not exists public.evolve_plan_profiles (
  program_id uuid primary key references public.evolve_programs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  focus text not null check (focus in ('ibiza','spagnolo','inglese','stazione','trasferimento','movimento','abitudini','osservazione_alcol')),
  baseline text not null check (char_length(baseline) between 5 and 320),
  obstacle text not null default '' check (char_length(obstacle) <= 320),
  success_sign text not null check (char_length(success_sign) between 5 and 320),
  minutes smallint not null check (minutes in (5,10,15,20,30)),
  days_per_week smallint not null check (days_per_week between 2 and 7),
  confidence smallint not null check (confidence between 1 and 5),
  preferred_time text not null default 'flessibile' check (preferred_time in ('mattina','pranzo','sera','flessibile')),
  starts_on date not null default current_date,
  updated_at timestamptz not null default now()
);

create table if not exists public.evolve_plan_reviews (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.evolve_programs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  confidence smallint not null check (confidence between 1 and 5),
  win text check (win is null or char_length(win) <= 320),
  obstacle text check (obstacle is null or char_length(obstacle) <= 320),
  adjustment text check (adjustment is null or char_length(adjustment) <= 320),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, period_start)
);
create index if not exists evolve_profiles_user on public.evolve_plan_profiles(user_id);
create index if not exists evolve_reviews_user_period on public.evolve_plan_reviews(user_id, period_start desc);

alter table public.evolve_plan_profiles enable row level security;
alter table public.evolve_plan_reviews enable row level security;

create policy "evolve_profiles_owner" on public.evolve_plan_profiles
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.evolve_programs p where p.id=program_id and p.user_id=(select auth.uid())
  ));

create policy "evolve_reviews_owner" on public.evolve_plan_reviews
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.evolve_programs p where p.id=program_id and p.user_id=(select auth.uid())
  ));
