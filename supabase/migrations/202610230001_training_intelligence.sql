-- EVOLVE 1.9 — Opt-in training preferences. Does not change/delete workout history.
-- Run after 202610220002_goals_evidence.sql and 202610220003_workout_edit_delete.sql.
create table if not exists public.evolve_training_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 preferred_activity text not null check (preferred_activity in
  ('vogatore','kettlebell','camminata','sacco','corsa','bicicletta','nuoto','palestra','corpo libero','altro')),
 focus text not null check (focus in ('continuita','resistenza','tecnica','equilibrio')),
 target_sessions smallint not null check (target_sessions between 1 and 7),
 preferred_minutes smallint not null check (preferred_minutes in (5,10,15,20,25,30,40,45,60,75,90)),
 goal_id uuid references public.evolve_goals(id) on delete set null,
 updated_at timestamptz not null default now()
);
alter table public.evolve_training_preferences enable row level security;
revoke all on public.evolve_training_preferences from anon;
grant select,insert,update on public.evolve_training_preferences to authenticated;
drop policy if exists evolve_training_preferences_own on public.evolve_training_preferences;
create policy evolve_training_preferences_own on public.evolve_training_preferences
 for all to authenticated using (user_id=auth.uid())
 with check (user_id=auth.uid() and (goal_id is null or exists (
  select 1 from public.evolve_goals g
  where g.id=goal_id and g.user_id=auth.uid() and g.area='allenamento'
 )));
-- All existing workouts, goal links and Coach logs remain unchanged.
