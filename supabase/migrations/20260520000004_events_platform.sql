-- ============================================================================
--  Events platform generalization
--
--  The data model was already generic in shape (event → participant → guest
--  → ticket); only the names were graduation-specific. We keep the physical
--  table names (renaming would break 7 SECURITY DEFINER functions, 12 RLS
--  policies and every query for zero functional gain) and generalize at the
--  data + presentation layers:
--
--    · ceremonies.event_type      — which kind of event this is
--    · ceremonies.email_template  — invitation template key (registry in app)
--    · graduates.photo_url        — optional participant photo
--
--  Existing rows default to event_type='graduation' + template='clasica',
--  so nothing changes for current data.
-- ============================================================================

ALTER TABLE public.ceremonies
  ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'graduation';

ALTER TABLE public.ceremonies
  ADD COLUMN IF NOT EXISTS email_template TEXT NOT NULL DEFAULT 'clasica';

ALTER TABLE public.graduates
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

CREATE INDEX IF NOT EXISTS ceremonies_event_type_idx
  ON public.ceremonies(event_type);

-- Storage bucket for participant photos: public read, writes only via
-- service role (the API route validates magic bytes + size first).
INSERT INTO storage.buckets (id, name, public)
VALUES ('participant-photos', 'participant-photos', true)
ON CONFLICT (id) DO NOTHING;
