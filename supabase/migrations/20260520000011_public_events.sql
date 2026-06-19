-- ============================================================================
--  Public event catalog
--
--  Not every event is public — graduations are invitation-only. `public_listed`
--  opts an event into the public catalog (/eventos), where attendees can browse
--  and (with A3) self-register. Anon SELECT on ceremonies already exists
--  (ceremonies_select_all), so no new policy is needed.
-- ============================================================================

ALTER TABLE public.ceremonies
  ADD COLUMN IF NOT EXISTS public_listed BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS ceremonies_public_listed_idx
  ON public.ceremonies(public_listed)
  WHERE public_listed;
