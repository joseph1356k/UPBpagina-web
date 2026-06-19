-- ============================================================================
--  Live attendance — scan_events.ceremony_id + Realtime publication
--
--  The live board (admin/ceremonias/[id]/monitor) subscribes to scan_events
--  via Supabase Realtime, filtered per event. scan_events only carried
--  guest_id, so we denormalize ceremony_id onto it:
--    · enables the realtime filter `ceremony_id=eq.<id>`
--    · avoids a guest → graduate → ceremony join on every scan read
--
--  validate_qr_token is re-declared to populate ceremony_id on insert. Body is
--  identical to initial_schema.sql except for the ceremony lookup + the extra
--  insert column (guest-found state is captured in a boolean so the second
--  SELECT does not clobber FOUND).
-- ============================================================================

ALTER TABLE public.scan_events
  ADD COLUMN IF NOT EXISTS ceremony_id TEXT
  REFERENCES public.ceremonies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS scan_events_ceremony_idx
  ON public.scan_events(ceremony_id, scanned_at DESC);

-- Backfill existing rows (guest → graduate → ceremony).
UPDATE public.scan_events se
SET ceremony_id = gr.ceremony_id
FROM public.guests g
JOIN public.graduates gr ON gr.id = g.graduate_id
WHERE se.guest_id = g.id
  AND se.ceremony_id IS NULL;

CREATE OR REPLACE FUNCTION public.validate_qr_token(
  p_token      TEXT,
  p_scanner_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest       public.guests%ROWTYPE;
  v_guest_found BOOLEAN;
  v_result      public.scan_result;
  v_reason      public.scan_denied_reason;
  v_ceremony_id TEXT;
BEGIN
  -- Verify scanner exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_scanner_id AND role IN ('admin', 'coordinator', 'scanner') AND active
  ) THEN
    RAISE EXCEPTION 'Scanner no autorizado';
  END IF;

  -- Lock the guest row to prevent double check-in races
  SELECT * INTO v_guest FROM public.guests
  WHERE invitation_token = p_token
  FOR UPDATE;
  v_guest_found := FOUND;

  IF NOT v_guest_found THEN
    v_result := 'denied';
    v_reason := 'not_found';
  ELSE
    -- Resolve the event so the scan event is attributable per ceremony.
    SELECT ceremony_id INTO v_ceremony_id
    FROM public.graduates WHERE id = v_guest.graduate_id;

    IF v_guest.status = 'revoked' THEN
      v_result := 'denied';
      v_reason := 'revoked';
    ELSIF v_guest.status = 'checked_in' THEN
      v_result := 'denied';
      v_reason := 'already_used';
    ELSE
      UPDATE public.guests
      SET status = 'checked_in',
          checked_in_at = now(),
          updated_at = now()
      WHERE id = v_guest.id;
      v_result := 'allowed';
      v_reason := NULL;
    END IF;
  END IF;

  INSERT INTO public.scan_events (guest_id, scanned_by_user_id, result, reason, ceremony_id)
  VALUES (v_guest.id, p_scanner_id, v_result, v_reason, v_ceremony_id);

  RETURN jsonb_build_object(
    'result',      v_result,
    'reason',      v_reason,
    'guestName',   v_guest.full_name,
    'graduateId',  v_guest.graduate_id
  );
END;
$$;

-- Publish scan_events for Realtime (idempotent — the publication is created by
-- Supabase; only add the table if it isn't already a member).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'scan_events'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_events';
  END IF;
END $$;
