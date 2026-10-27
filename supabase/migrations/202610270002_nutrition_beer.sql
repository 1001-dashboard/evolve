-- Evolve 1.9.3: Birretta (50/66cl) stored as a normal confirmed food entry.
-- Run AFTER 202610270001_nutrition_journal.sql. No existing rows are deleted or rewritten.
alter table public.evolve_food_entries
 add column if not exists entry_kind text not null default 'food';
alter table public.evolve_food_entries
 add column if not exists beer_ml smallint;
alter table public.evolve_food_entries
 drop constraint if exists evolve_food_entry_kind_check;
alter table public.evolve_food_entries
 add constraint evolve_food_entry_kind_check check (
  (entry_kind='food' and beer_ml is null) or
  (entry_kind='beer' and beer_ml in (500,660))
 );
-- Existing owner RLS from 202610270001 remains in force; no public read grants.
