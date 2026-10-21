-- Evolve 1.5: opt-in onboarding and explicitly controlled guidance levels.
-- Additive migration. No existing user profile or commitment is deleted.
create table if not exists public.evolve_guided_onboarding (
  user_id uuid primary key references auth.users(id) on delete cascade,
  areas text[] not null check (cardinality(areas) between 1 and 3 and areas <@ array['abitudini','benessere','allenamento','alimentazione','lavoro','apprendimento','relazioni','organizzazione']::text[]),
  goal text not null check (char_length(goal) between 5 and 320),
  obstacle text not null default '' check (char_length(obstacle)<=350),
  minutes smallint not null check (minutes in (5,10,15,20,30,45,60)),
  anchor text not null default '' check (char_length(anchor)<=120),
  support_level text not null default 'guidato' check (support_level in ('guidato','essenziale','autonomo')),
  confidence smallint not null default 3 check (confidence between 1 and 5),
  approval_token uuid not null,
  started_on date not null default current_date,
  updated_at timestamptz not null default now()
);
alter table public.evolve_guided_onboarding enable row level security;
-- Re-running the migration is safe.
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='evolve_guided_onboarding' and policyname='evolve_guided_onboarding_own') then
  create policy evolve_guided_onboarding_own on public.evolve_guided_onboarding for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
 end if;
end $$;
