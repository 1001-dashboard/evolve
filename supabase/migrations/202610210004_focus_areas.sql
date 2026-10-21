-- Evolve 1.7.1 — Separate all areas of interest from 1–3 active priorities.
-- Run AFTER 202610210003_smart_onboarding.sql. Additive, rerunnable; retains existing profiles and plans.
-- The old generated CHECK rejects more than 3 interest areas, so replace it.
ALTER TABLE public.evolve_guided_onboarding
  DROP CONSTRAINT IF EXISTS evolve_guided_onboarding_areas_check;
ALTER TABLE public.evolve_guided_onboarding
  ADD CONSTRAINT evolve_guided_onboarding_areas_check CHECK (
    cardinality(areas) BETWEEN 1 AND 8 AND
    areas <@ ARRAY['abitudini','benessere','allenamento','alimentazione','lavoro','apprendimento','relazioni','organizzazione']::text[]
  );
-- Backfill current priorities from the old one-to-three selected areas.
ALTER TABLE public.evolve_guided_onboarding
  ADD COLUMN IF NOT EXISTS priority_areas text[];
UPDATE public.evolve_guided_onboarding
  SET priority_areas = areas[1:LEAST(cardinality(areas),3)]
  WHERE priority_areas IS NULL;
ALTER TABLE public.evolve_guided_onboarding
  ALTER COLUMN priority_areas SET NOT NULL;
ALTER TABLE public.evolve_guided_onboarding
  DROP CONSTRAINT IF EXISTS evolve_guided_onboarding_priority_areas_check;
ALTER TABLE public.evolve_guided_onboarding
  ADD CONSTRAINT evolve_guided_onboarding_priority_areas_check CHECK (
    cardinality(priority_areas) BETWEEN 1 AND 3 AND
    priority_areas <@ areas
  );
-- Existing RLS owner policy remains unchanged; no profile or diary data is removed.
