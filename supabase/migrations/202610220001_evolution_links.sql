-- Evolve 1.8. Additive evidence-to-commitment attribution. Run after the previous Evolve migrations.
-- A link never changes the completion status of a Coach commitment.
create table if not exists public.evolve_evidence_links (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 commitment_id uuid not null references public.evolve_coach_commitments(id) on delete cascade,
 source_kind text not null check (source_kind in ('workout','meal_plan')),
 source_key text not null check (char_length(source_key) between 10 and 40),
 evidence_day date not null,
 created_at timestamptz not null default now(),
 unique(user_id,source_kind,source_key)
);
create index if not exists evolve_evidence_links_owner_day on public.evolve_evidence_links(user_id,evidence_day desc);
alter table public.evolve_evidence_links enable row level security;
revoke all on public.evolve_evidence_links from anon;
grant select,insert,delete on public.evolve_evidence_links to authenticated;
-- Prevent references to a different person's Coach item or evidence, even with direct client API access.
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='evolve_evidence_links' and policyname='evolution_owner_read') then
  create policy evolution_owner_read on public.evolve_evidence_links for select to authenticated using (user_id=auth.uid());
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='evolve_evidence_links' and policyname='evolution_owner_insert') then
  create policy evolution_owner_insert on public.evolve_evidence_links for insert to authenticated with check (
   user_id=auth.uid() and
   exists(select 1 from public.evolve_coach_commitments c where c.id=commitment_id and c.user_id=auth.uid() and c.status='active'
      and ((source_kind='workout' and c.kind='allenamento') or (source_kind='meal_plan' and c.kind='alimentazione')))
   and evidence_day between ((now() at time zone 'Europe/Rome')::date - 29) and (now() at time zone 'Europe/Rome')::date
   and ((source_kind='workout' and exists(select 1 from public.evolve_workouts w where w.id::text=source_key and w.user_id=auth.uid()
      and (w.occurred_at at time zone 'Europe/Rome')::date=evidence_day))
     or (source_kind='meal_plan' and exists(select 1 from public.evolve_meal_plans m where m.week_start::text=source_key and m.user_id=auth.uid()
      and coalesce((m.updated_at at time zone 'Europe/Rome')::date,m.week_start::date)=evidence_day)))
  );
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='evolve_evidence_links' and policyname='evolution_owner_delete') then
  create policy evolution_owner_delete on public.evolve_evidence_links for delete to authenticated using (user_id=auth.uid());
 end if;
end $$;
