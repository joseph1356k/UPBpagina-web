-- ============================================================================
--  Manual check-in (by name / document)
--
--  Day-of fallback when an attendee has no phone or QR: staff search the guest
--  and admit them manually. Same atomic, one-time-entry guarantees as
--  validate_qr_token, but keyed by guest id and tagged method='manual' so the
--  audit trail distinguishes manual admissions from QR scans.
-- ============================================================================

ALTER TABLE public.scan_events
  ADD COLUMN IF NOT EXISTS method TEXT NOT NULL DEFAULT 'qr'
  CHECK (method IN ('qr', 'manual'));

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
  WHERE id = p_guest_id
  FOR UPDATE;
  v_guest_found := FOUND;

  IF NOT v_guest_found THEN
    v_result := 'denied';
    v_reason := 'not_found';
  ELSE
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

  INSERT INTO public.scan_events (guest_id, scanned_by_user_id, result, reason, ceremony_id, method)
  VALUES (v_guest.id, p_scanner_id, v_result, v_reason, v_ceremony_id, 'manual');

  RETURN jsonb_build_object(
    'result',     v_result,
    'reason',     v_reason,
    'guestName',  v_guest.full_name,
    'graduateId', v_guest.graduate_id
  );
END;
$$;

-- Service-role only (called from the API route via the service client), same
-- posture as validate_qr_token.
REVOKE EXECUTE ON FUNCTION public.manual_check_in(TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.manual_check_in(TEXT, UUID) TO service_role;
