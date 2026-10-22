-- Evolve 1.8.1: personal goals and explicit attribution of existing observations.
-- ADDITIVE, run AFTER 202610220001_evolution_links.sql.
-- Existing coach plans, workouts, meal plans, and journals are not altered.
create table if not exists public.evolve_goals (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 area text not null check (area in ('abitudini','benessere','allenamento','alimentazione','lavoro','apprendimento','relazioni','organizzazione')),
 title text not null check (char_length(title) between 4 and 120),
 description text not null default '' check (char_length(description)<=350),
 status text not null default 'active' check (status in ('active','paused','completed')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(id,user_id)
);
create index if not exists evolve_goals_owner_status on public.evolve_goals(user_id,status);
alter table public.evolve_goals enable row level security;
revoke all on public.evolve_goals from anon;
grant select,insert,update on public.evolve_goals to authenticated;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='evolve_goals' and policyname='evolve_goals_owner') then
  create policy evolve_goals_owner on public.evolve_goals for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
 end if;
end $$;
create table if not exists public.evolve_goal_links (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 goal_id uuid not null,
 source_kind text not null check (source_kind in ('workout','meal_plan','coach')),
 source_key text not null check (char_length(source_key) between 10 and 72),
 evidence_day date not null,
 created_at timestamptz not null default now(),
 foreign key (goal_id,user_id) references public.evolve_goals(id,user_id) on delete cascade,
 unique(user_id,source_kind,source_key)
);
create index if not exists evolve_goal_links_owner_goal on public.evolve_goal_links(user_id,goal_id,evidence_day desc);
alter table public.evolve_goal_links enable row level security;
revoke all on public.evolve_goal_links from anon;
grant select,insert,delete on public.evolve_goal_links to authenticated;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='evolve_goal_links' and policyname='evolve_goal_links_read') then
  create policy evolve_goal_links_read on public.evolve_goal_links for select to authenticated using (user_id=auth.uid());
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='evolve_goal_links' and policyname='evolve_goal_links_insert') then
  create policy evolve_goal_links_insert on public.evolve_goal_links for insert to authenticated with check (
   user_id=auth.uid()
   and exists(select 1 from public.evolve_goals g where g.id=goal_id and g.user_id=auth.uid() and g.status='active')
   and evidence_day <= (now() at time zone 'Europe/Rome')::date
   and (
     (source_kind='workout' and exists (
      select 1 from public.evolve_workouts w where w.user_id=auth.uid() and w.id::text=source_key
       and (w.occurred_at at time zone 'Europe/Rome')::date=evidence_day
     ))
     or (source_kind='meal_plan' and exists (
      select 1 from public.evolve_meal_plans m where m.user_id=auth.uid() and m.week_start::text=source_key
       and coalesce((m.updated_at at time zone 'Europe/Rome')::date,m.week_start::date)=evidence_day
     ))
     or (source_kind='coach' and exists (
      select 1 from public.evolve_coach_logs l where l.user_id=auth.uid() and l.outcome='done'
       and l.commitment_id::text=split_part(source_key,':',1)
       and l.day::text=split_part(source_key,':',2) and l.day=evidence_day
       and source_key=l.commitment_id::text||':'||l.day::text
     ))
   )
  );
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='evolve_goal_links' and policyname='evolve_goal_links_delete') then
  create policy evolve_goal_links_delete on public.evolve_goal_links for delete to authenticated using (user_id=auth.uid());
 end if;
end $$;
