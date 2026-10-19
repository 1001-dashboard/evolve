-- EVOLVE v0.7: Personal profile, daily check-ins, situational plans and daily action log.
-- Run once after migrations 001 and 002. Creates only new tables.
create extension if not exists pgcrypto;

create table if not exists public.evolve_life_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  birth_date date,
  height_cm smallint check (height_cm is null or height_cm between 90 and 250),
  weight_kg numeric(5,1) check (weight_kg is null or weight_kg between 25 and 450),
  main_goal text not null default '' check (char_length(main_goal) <= 320),
  life_areas text[] not null default array['benessere','lavoro']::text[],
  minutes_per_day smallint not null default 15 check (minutes_per_day in (5,10,15,20,30,45,60)),
  preferred_time text not null default 'mattina' check (preferred_time in ('mattina','pranzo','sera','flessibile')),
  support_style text not null default 'pratico' check (support_style in ('pratico','graduale','equilibrato')),
  coach_context_opt_in boolean not null default false,
  morning_anchor text not null default '' check (char_length(morning_anchor) <= 120),
  current_context text not null default '' check (char_length(current_context) <= 500),
  updated_at timestamptz not null default now(),
  constraint evolve_life_areas_allowed check (
    life_areas <@ array['benessere','lavoro','relazioni','crescita']::text[]
    and coalesce(array_length(life_areas,1),0) between 1 and 4
  )
);

create table if not exists public.evolve_daily_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  energy smallint not null check (energy between 1 and 5),
  mood smallint not null check (mood between 1 and 5),
  sleep_hours numeric(3,1) check (sleep_hours is null or sleep_hours between 0 and 16),
  available_minutes smallint not null check (available_minutes in (5,10,15,20,30,45,60)),
  note text not null default '' check (char_length(note) <= 350),
  updated_at timestamptz not null default now(),
  primary key(user_id,day)
);

create table if not exists public.evolve_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  context text not null check (context in ('lavoro','casa','relazioni','benessere','altro')),
  trigger_text text not null check (char_length(trigger_text) between 5 and 280),
  response_text text not null check (char_length(response_text) between 5 and 500),
  small_step text not null check (char_length(small_step) between 5 and 280),
  fallback_text text not null default '' check (char_length(fallback_text) <= 280),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists evolve_scenarios_user_active on public.evolve_scenarios(user_id,active,created_at desc);

create table if not exists public.evolve_scenario_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_id uuid not null references public.evolve_scenarios(id) on delete cascade,
  day date not null,
  outcome text not null check (outcome in ('helped','adjust','rehearsed')),
  note text not null default '' check (char_length(note) <= 320),
  created_at timestamptz not null default now()
);
create index if not exists evolve_scenario_feedback_user on public.evolve_scenario_feedback(user_id,created_at desc);

create table if not exists public.evolve_daily_actions (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  action_key text not null check (char_length(action_key) between 3 and 90),
  status text not null check (status in ('done','skipped')),
  note text not null default '' check (char_length(note) <= 280),
  updated_at timestamptz not null default now(),
  primary key(user_id,day,action_key)
);

alter table public.evolve_life_profiles enable row level security;
alter table public.evolve_daily_states enable row level security;
alter table public.evolve_scenarios enable row level security;
alter table public.evolve_scenario_feedback enable row level security;
alter table public.evolve_daily_actions enable row level security;

create policy "life_profile_owner" on public.evolve_life_profiles for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "life_checkin_owner" on public.evolve_daily_states for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "life_scenarios_owner" on public.evolve_scenarios for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "life_feedback_owner" on public.evolve_scenario_feedback for all to authenticated
  using (user_id = (select auth.uid()) and exists (
    select 1 from public.evolve_scenarios s where s.id=scenario_id and s.user_id=(select auth.uid())
  )) with check (user_id = (select auth.uid()) and exists (
    select 1 from public.evolve_scenarios s where s.id=scenario_id and s.user_id=(select auth.uid())
  ));
create policy "life_daily_actions_owner" on public.evolve_daily_actions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
