-- ════════════════════════════════════════════════════════════════════
--  Phase 2 — admin-managed event types, organizer role, per-type fields
--
--  · user_role gains 'organizer' (added in 20260520000005a, separate tx —
--    Postgres forbids using a new enum value in its own transaction).
--  · event_types: admin-editable catalog; seeded from the built-in 13 in
--    lib/terminology.ts, which stays as the sync fallback.
--  · event_organizers: assigns organizers to specific events; RLS scopes
--    organizers to only their events' data.
--  · ceremonies.custom_data: JSONB answers for the type's custom_fields.
-- ════════════════════════════════════════════════════════════════════

-- Run first, on its own:
--   ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'organizer';

CREATE TABLE IF NOT EXISTS public.event_types (
  value                 TEXT PRIMARY KEY,
  label                 TEXT NOT NULL,
  event_noun            TEXT NOT NULL DEFAULT 'evento',
  participant_singular  TEXT NOT NULL DEFAULT 'participante',
  participant_plural    TEXT NOT NULL DEFAULT 'participantes',
  guest_singular        TEXT NOT NULL DEFAULT 'invitado',
  guest_plural          TEXT NOT NULL DEFAULT 'invitados',
  invite_phrase         TEXT NOT NULL DEFAULT 'te ha invitado a este evento',
  photo_recommended     BOOLEAN NOT NULL DEFAULT FALSE,
  default_template      TEXT NOT NULL DEFAULT 'clasica',
  custom_fields         JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_builtin            BOOLEAN NOT NULL DEFAULT FALSE,
  active                BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order            INT NOT NULL DEFAULT 100,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS event_types_touch_updated ON public.event_types;
CREATE TRIGGER event_types_touch_updated BEFORE UPDATE ON public.event_types
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.ceremonies
  ADD COLUMN IF NOT EXISTS custom_data JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.event_organizers (
  ceremony_id  TEXT NOT NULL REFERENCES public.ceremonies(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (ceremony_id, user_id)
);
CREATE INDEX IF NOT EXISTS event_organizers_user_idx
  ON public.event_organizers(user_id);

CREATE OR REPLACE FUNCTION public.is_event_organizer(p_ceremony_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_organizers eo
    JOIN public.users u ON u.id = eo.user_id
    WHERE eo.ceremony_id = p_ceremony_id
      AND eo.user_id = auth.uid()
      AND u.active
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_event_organizer(TEXT) TO authenticated;

ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_organizers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_types_read ON public.event_types;
CREATE POLICY event_types_read ON public.event_types
  FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS event_types_admin_write ON public.event_types;
CREATE POLICY event_types_admin_write ON public.event_types
  FOR ALL TO authenticated
  USING (public.is_staff(ARRAY['admin']::public.user_role[]))
  WITH CHECK (public.is_staff(ARRAY['admin']::public.user_role[]));

DROP POLICY IF EXISTS event_organizers_admin ON public.event_organizers;
CREATE POLICY event_organizers_admin ON public.event_organizers
  FOR ALL TO authenticated
  USING (public.is_staff(ARRAY['admin','coordinator']::public.user_role[]))
  WITH CHECK (public.is_staff(ARRAY['admin','coordinator']::public.user_role[]));
DROP POLICY IF EXISTS event_organizers_self_read ON public.event_organizers;
CREATE POLICY event_organizers_self_read ON public.event_organizers
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS ceremonies_organizer_read ON public.ceremonies;
CREATE POLICY ceremonies_organizer_read ON public.ceremonies
  FOR SELECT TO authenticated USING (public.is_event_organizer(id));

DROP POLICY IF EXISTS graduates_organizer_read ON public.graduates;
CREATE POLICY graduates_organizer_read ON public.graduates
  FOR SELECT TO authenticated USING (public.is_event_organizer(ceremony_id));

DROP POLICY IF EXISTS guests_organizer_read ON public.guests;
CREATE POLICY guests_organizer_read ON public.guests
  FOR SELECT TO authenticated
  USING (public.is_event_organizer(
    (SELECT ceremony_id FROM public.graduates WHERE id = guests.graduate_id)
  ));

-- Seed the 13 built-in types (mirror of lib/terminology.ts EVENT_TYPES).
INSERT INTO public.event_types
  (value, label, event_noun, participant_singular, participant_plural, guest_singular, guest_plural, invite_phrase, photo_recommended, default_template, is_builtin, sort_order)
VALUES
  ('graduation','Ceremonia de grado','ceremonia','graduando','graduandos','invitado','invitados','te ha invitado a acompañarle en su ceremonia de grado',true,'elegante',true,10),
  ('institutional','Evento institucional','evento','anfitrión','anfitriones','invitado','invitados','te ha invitado a este evento institucional',false,'clasica',true,20),
  ('private','Evento privado','evento','anfitrión','anfitriones','invitado','invitados','te ha invitado a este evento privado',true,'moderna',true,30),
  ('sports','Evento deportivo','evento','participante','participantes','asistente','asistentes','te ha invitado a este evento deportivo',false,'moderna',true,40),
  ('catering','Evento de catering','evento','anfitrión','anfitriones','invitado','invitados','te ha invitado',false,'elegante',true,50),
  ('investors','Reunión con inversionistas','reunión','anfitrión','anfitriones','asistente','asistentes','te ha invitado a esta reunión',false,'clasica',true,60),
  ('conference','Conferencia','conferencia','organizador','organizadores','asistente','asistentes','te ha invitado a esta conferencia',false,'clasica',true,70),
  ('talk','Charla','charla','organizador','organizadores','asistente','asistentes','te ha invitado a esta charla',false,'moderna',true,80),
  ('workshop','Taller','taller','organizador','organizadores','asistente','asistentes','te ha invitado a este taller',false,'moderna',true,90),
  ('seminar','Seminario','seminario','organizador','organizadores','asistente','asistentes','te ha invitado a este seminario',false,'clasica',true,100),
  ('fair','Feria','feria','expositor','expositores','asistente','asistentes','te ha invitado a esta feria',false,'moderna',true,110),
  ('business','Reunión empresarial','reunión','anfitrión','anfitriones','asistente','asistentes','te ha invitado a esta reunión',false,'clasica',true,120),
  ('other','Otro','evento','participante','participantes','invitado','invitados','te ha invitado a este evento',false,'clasica',true,130)
ON CONFLICT (value) DO NOTHING;
