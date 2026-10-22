-- Evolve 1.8.2: preserve referential coherence when editing or deleting workouts.
-- Run AFTER 202610190004_training_mealprep.sql and, when installed,
-- 202610220001_evolution_links.sql / 202610220002_goals_evidence.sql.
-- DOES NOT delete Coach commitments, their logs, or any other workout.
-- UPDATE of occurred_at: update the day of linked evidence in the same transaction.
-- DELETE: remove references to the deleted workout in the same transaction.
create or replace function public.evolve_sync_workout_evidence() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if tg_op='DELETE' then
  if to_regclass('public.evolve_evidence_links') is not null then
   delete from public.evolve_evidence_links where user_id=old.user_id
     and source_kind='workout' and source_key=old.id::text;
  end if;
  if to_regclass('public.evolve_goal_links') is not null then
   delete from public.evolve_goal_links where user_id=old.user_id
     and source_kind='workout' and source_key=old.id::text;
  end if;
  return old;
 end if;
 if tg_op='UPDATE' and new.occurred_at is distinct from old.occurred_at then
  if to_regclass('public.evolve_evidence_links') is not null then
   update public.evolve_evidence_links
     set evidence_day=(new.occurred_at at time zone 'Europe/Rome')::date
     where user_id=new.user_id and source_kind='workout' and source_key=new.id::text;
  end if;
  if to_regclass('public.evolve_goal_links') is not null then
   update public.evolve_goal_links
     set evidence_day=(new.occurred_at at time zone 'Europe/Rome')::date
     where user_id=new.user_id and source_kind='workout' and source_key=new.id::text;
  end if;
 end if;
 return new;
end;
$$;
revoke all on function public.evolve_sync_workout_evidence() from public;
drop trigger if exists evolve_workouts_sync_evidence on public.evolve_workouts;
create trigger evolve_workouts_sync_evidence
 after update of occurred_at or delete on public.evolve_workouts
 for each row execute function public.evolve_sync_workout_evidence();
