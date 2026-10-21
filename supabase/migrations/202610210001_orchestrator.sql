-- EVOLVE 1.3 - Weekly focus. Only new tables; never modifies previous records.
create table if not exists public.evolve_weekly_focus (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  focus_id text not null check (focus_id in ('organizzazione','recupero','movimento','pasti','continuita')),
  title text not null check (char_length(title) between 3 and 100),
  action_text text not null check (char_length(action_text) between 8 and 260),
  minutes smallint not null default 5 check (minutes between 1 and 60),
  review_note text not null default '' check (char_length(review_note) <= 600),
  approved_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);
create table if not exists public.evolve_weekly_focus_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  day date not null,
  outcome text not null check (outcome in ('done','skipped')),
  note text not null default '' check (char_length(note) <= 260),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start, day),
  foreign key (user_id, week_start) references public.evolve_weekly_focus(user_id,week_start) on delete cascade,
  check (day >= week_start and day < (week_start + interval '7 days'))
);
alter table public.evolve_weekly_focus enable row level security;
alter table public.evolve_weekly_focus_logs enable row level security;
create policy "weekly_focus_owner" on public.evolve_weekly_focus for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "weekly_focus_logs_owner" on public.evolve_weekly_focus_logs for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
