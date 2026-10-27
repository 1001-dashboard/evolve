-- Evolve 1.9.2: opt-in nutrition journal. Existing meal prep, diary and workouts are unchanged.
-- Run once after earlier Evolve migrations. Entries are only meals explicitly confirmed by the user.
create table if not exists public.evolve_food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  eaten_at timestamptz not null,
  meal_type text not null check(meal_type in ('colazione','pranzo','cena','spuntino','altro')),
  description text not null check (char_length(description) between 3 and 600),
  kcal numeric(7,1) check(kcal is null or kcal between 0 and 4000),
  kcal_low numeric(7,1) check(kcal_low is null or kcal_low between 0 and 4000),
  kcal_high numeric(7,1) check(kcal_high is null or kcal_high between 0 and 4000),
  calorie_source text not null default 'non_disponibile' check(calorie_source in ('etichetta','ai_stima','stima_personale','non_disponibile')),
  note text not null default '' check(char_length(note)<=600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evolve_food_range_valid check (
    (kcal_low is null and kcal_high is null) or
    (kcal_low is not null and kcal_high is not null and kcal_low<=kcal_high)
  )
);
create index if not exists evolve_food_entries_owner_date on public.evolve_food_entries(user_id,eaten_at desc);
alter table public.evolve_food_entries enable row level security;
revoke all on public.evolve_food_entries from anon;
grant select,insert,update,delete on public.evolve_food_entries to authenticated;
drop policy if exists evolve_food_entries_owner on public.evolve_food_entries;
create policy evolve_food_entries_owner on public.evolve_food_entries
 for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create table if not exists public.evolve_nutrition_settings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 daily_reference_kcal integer check(daily_reference_kcal is null or daily_reference_kcal between 800 and 6000),
 avoided_foods text not null default '' check(char_length(avoided_foods)<=500),
 updated_at timestamptz not null default now()
);
alter table public.evolve_nutrition_settings enable row level security;
revoke all on public.evolve_nutrition_settings from anon;
grant select,insert,update,delete on public.evolve_nutrition_settings to authenticated;
drop policy if exists evolve_nutrition_settings_owner on public.evolve_nutrition_settings;
create policy evolve_nutrition_settings_owner on public.evolve_nutrition_settings
 for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
