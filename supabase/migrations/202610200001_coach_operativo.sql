-- Evolve 1.1: approved coaching commitments and daily progress.
-- Additive / rerunnable; run after v0.7 and v1.0 migrations.
create extension if not exists pgcrypto;
create table if not exists public.evolve_coach_commitments (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 source_session_id uuid null,
 approval_token uuid not null,
 approval_index smallint not null check (approval_index between 0 and 5),
 kind text not null check(kind in ('azione','routine','allenamento','alimentazione','percorso','scenario')),
 title text not null check(char_length(title) between 3 and 120),
 description text not null check(char_length(description) between 8 and 650),
 minutes smallint not null check(minutes between 1 and 120),
 cadence text not null check(cadence in ('once','daily','weekly')),
 days smallint[] not null default '{}',
 time_window text not null default 'flessibile' check(time_window in ('mattina','pranzo','sera','flessibile')),
 status text not null default 'active' check(status in ('active','paused','completed')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint evolve_coach_approval_unique unique (user_id,approval_token,approval_index),
 constraint evolve_coach_days check (
  days <@ ARRAY[1,2,3,4,5,6,7]::smallint[] AND
  (cadence <> 'weekly' OR coalesce(array_length(days,1),0)>0)
 )
);
create index if not exists evolve_coach_user_status on public.evolve_coach_commitments(user_id,status,created_at desc);
create table if not exists public.evolve_coach_logs (
 user_id uuid not null references auth.users(id) on delete cascade,
 commitment_id uuid not null references public.evolve_coach_commitments(id) on delete cascade,
 day date not null,
 outcome text not null check(outcome in ('done','skipped')),
 note text not null default '' check(char_length(note)<=300),
 created_at timestamptz not null default now(),
 primary key (user_id,commitment_id,day)
);
create index if not exists evolve_coach_logs_user_day on public.evolve_coach_logs(user_id,day desc);
alter table public.evolve_coach_commitments enable row level security;
alter table public.evolve_coach_logs enable row level security;
drop policy if exists coach_commitments_owner on public.evolve_coach_commitments;
create policy coach_commitments_owner on public.evolve_coach_commitments for all to authenticated
 using (user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists coach_logs_owner on public.evolve_coach_logs;
create policy coach_logs_owner on public.evolve_coach_logs for all to authenticated
 using (user_id=(select auth.uid()) and exists (select 1 from public.evolve_coach_commitments c where c.id=commitment_id and c.user_id=(select auth.uid())))
 with check (user_id=(select auth.uid()) and exists (select 1 from public.evolve_coach_commitments c where c.id=commitment_id and c.user_id=(select auth.uid())));
