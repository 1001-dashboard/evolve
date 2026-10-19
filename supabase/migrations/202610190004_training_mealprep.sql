-- Evolve 1.0: new additive tables. Run once after prior migrations.
create table if not exists public.evolve_workouts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 occurred_at timestamptz not null default now(), activity text not null,
 duration_minutes numeric(6,1) not null check(duration_minutes > 0 and duration_minutes <= 600),
 distance_m numeric(10,1), strokes integer, cadence_spm numeric(6,1), machine_kcal numeric(8,1),
 estimated_kcal numeric(8,1), effort integer not null check(effort between 1 and 10),
 details jsonb not null default '{}'::jsonb, notes text not null default '', created_at timestamptz default now()
);
create index if not exists evolve_workouts_user_date on public.evolve_workouts(user_id,occurred_at desc);
alter table public.evolve_workouts enable row level security;
drop policy if exists workouts_owner on public.evolve_workouts;
create policy workouts_owner on public.evolve_workouts for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create table if not exists public.evolve_meal_plans (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 week_start date not null, configuration jsonb not null default '{}'::jsonb,
 menu jsonb not null default '[]'::jsonb, shopping jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(user_id,week_start)
);
alter table public.evolve_meal_plans enable row level security;
drop policy if exists meal_plans_owner on public.evolve_meal_plans;
create policy meal_plans_owner on public.evolve_meal_plans for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
