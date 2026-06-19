-- ============================================================================
--  Door capacity control (B3)
--
--  At check-in time, compare the event's checked-in count against `capacity`:
--    · capacity_enforce = false (default) → ADMIT but flag 'capacity_full' as a
--      warning (don't leave a family out over an off-by-one).
--    · capacity_enforce = true            → DENY with reason 'capacity_full'.
--
--  Both validators are re-declared (carrying forward the self-reg COALESCE and
--  the ceremony_id / method columns) and now return a `warning` field.
-- ============================================================================

ALTER TABLE public.ceremonies
  ADD COLUMN IF NOT EXISTS capacity_enforce BOOLEAN NOT NULL DEFAULT false;

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
  v_capacity    INT;
  v_enforce     BOOLEAN;
  v_checked     INT;
  v_warning     TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_scanner_id AND role IN ('admin', 'coordinator', 'scanner') AND active
  ) THEN
    RAISE EXCEPTION 'Scanner no autorizado';
  END IF;

  SELECT * INTO v_guest FROM public.guests
  WHERE invitation_token = p_token
  FOR UPDATE;
  v_guest_found := FOUND;

  IF NOT v_guest_found THEN
    v_result := 'denied';
    v_reason := 'not_found';
  ELSE
    v_ceremony_id := COALESCE(
      v_guest.ceremony_id,
      (SELECT ceremony_id FROM public.graduates WHERE id = v_guest.graduate_id)
    );

    IF v_guest.status = 'revoked' THEN
      v_result := 'denied';
      v_reason := 'revoked';
    ELSIF v_guest.status = 'checked_in' THEN
      v_result := 'denied';
      v_reason := 'already_used';
    ELSE
      -- Capacity gate (venue limit). Counts checked-in guests of the event,
      -- whether registered via a participant or self-registered.
      SELECT capacity, capacity_enforce INTO v_capacity, v_enforce
      FROM public.ceremonies WHERE id = v_ceremony_id;
      IF v_capacity IS NOT NULL THEN
        SELECT count(*) INTO v_checked FROM public.guests g
        WHERE g.status = 'checked_in'
          AND (
            g.ceremony_id = v_ceremony_id
            OR g.graduate_id IN (
              SELECT id FROM public.graduates WHERE ceremony_id = v_ceremony_id
            )
          );
        IF v_checked >= v_capacity AND v_enforce THEN
          v_result := 'denied';
          v_reason := 'capacity_full';
        ELSIF v_checked >= v_capacity THEN
          v_warning := 'capacity_full';
        END IF;
      END IF;

      IF v_result IS NULL THEN
        UPDATE public.guests
        SET status = 'checked_in',
            checked_in_at = now(),
            updated_at = now()
        WHERE id = v_guest.id;
        v_result := 'allowed';
        v_reason := NULL;
      END IF;
    END IF;
  END IF;

  INSERT INTO public.scan_events (guest_id, scanned_by_user_id, result, reason, ceremony_id)
  VALUES (v_guest.id, p_scanner_id, v_result, v_reason, v_ceremony_id);

  RETURN jsonb_build_object(
    'result',      v_result,
    'reason',      v_reason,
    'guestName',   v_guest.full_name,
    'graduateId',  v_guest.graduate_id,
    'warning',     v_warning
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.manual_check_in(
  p_guest_id   TEXT,
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
  v_capacity    INT;
  v_enforce     BOOLEAN;
  v_checked     INT;
  v_warning     TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_scanner_id AND role IN ('admin', 'coordinator', 'scanner') AND active
  ) THEN
    RAISE EXCEPTION 'Scanner no autorizado';
  END IF;

  SELECT * INTO v_guest FROM public.guests
  WHERE id = p_guest_id
  FOR UPDATE;
  v_guest_found := FOUND;

  IF NOT v_guest_found THEN
    v_result := 'denied';
    v_reason := 'not_found';
  ELSE
    v_ceremony_id := COALESCE(
      v_guest.ceremony_id,
      (SELECT ceremony_id FROM public.graduates WHERE id = v_guest.graduate_id)
    );

    IF v_guest.status = 'revoked' THEN
      v_result := 'denied';
      v_reason := 'revoked';
    ELSIF v_guest.status = 'checked_in' THEN
      v_result := 'denied';
      v_reason := 'already_used';
    ELSE
      SELECT capacity, capacity_enforce INTO v_capacity, v_enforce
      FROM public.ceremonies WHERE id = v_ceremony_id;
      IF v_capacity IS NOT NULL THEN
        SELECT count(*) INTO v_checked FROM public.guests g
        WHERE g.status = 'checked_in'
          AND (
            g.ceremony_id = v_ceremony_id
            OR g.graduate_id IN (
              SELECT id FROM public.graduates WHERE ceremony_id = v_ceremony_id
            )
          );
        IF v_checked >= v_capacity AND v_enforce THEN
          v_result := 'denied';
          v_reason := 'capacity_full';
        ELSIF v_checked >= v_capacity THEN
          v_warning := 'capacity_full';
        END IF;
      END IF;

      IF v_result IS NULL THEN
        UPDATE public.guests
        SET status = 'checked_in',
            checked_in_at = now(),
            updated_at = now()
        WHERE id = v_guest.id;
        v_result := 'allowed';
        v_reason := NULL;
      END IF;
    END IF;
  END IF;

  INSERT INTO public.scan_events (guest_id, scanned_by_user_id, result, reason, ceremony_id, method)
  VALUES (v_guest.id, p_scanner_id, v_result, v_reason, v_ceremony_id, 'manual');

  RETURN jsonb_build_object(
    'result',     v_result,
    'reason',     v_reason,
    'guestName',  v_guest.full_name,
    'graduateId', v_guest.graduate_id,
    'warning',    v_warning
  );
END;
$$;
