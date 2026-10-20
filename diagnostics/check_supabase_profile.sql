-- Solo lettura. Supabase SQL Editor > Run. Non espone dati del profilo.
select
 to_regclass('public.evolve_life_profiles') is not null as tabella_profilo,
 to_regclass('public.evolve_daily_states') is not null as tabella_checkin,
 to_regclass('public.evolve_coach_commitments') is not null as tabella_coach_operativo,
 exists(select 1 from information_schema.columns
        where table_schema='public' and table_name='evolve_life_profiles'
          and column_name='coach_context_opt_in') as consenso_ai,
 exists(select 1 from pg_policies where schemaname='public' and tablename='evolve_life_profiles'
        and policyname='life_profile_owner') as policy_profilo;
