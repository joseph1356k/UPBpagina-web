-- ============================================================================
--  Self-registration / RSVP for open events
--
--  Until now every guest hung off a participant (graduate). For open events
--  (a conference, a fair…) the attendee IS the guest — there's no participant.
--  So a guest may now belong to EITHER:
--    · a participant (graduate_id set)  → ceremony resolved via the graduate
--    · an event directly (ceremony_id set, graduate_id NULL) → self-registered
--
--  The per-participant quota trigger (enforce_guest_quota) is a no-op when
--  graduate_id is NULL, so self-registered guests are bounded by the event's
--  `capacity` instead (enforced atomically in register_attendee).
-- ============================================================================

ALTER TABLE public.guests ALTER COLUMN graduate_id DROP NOT NULL;

ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS ceremony_id TEXT
  REFERENCES public.ceremonies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS guests_ceremony_idx ON public.guests(ceremony_id);

-- A guest must be attached to a participant or an event (or both, defensively).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'guests_owner_chk'
  ) THEN
    ALTER TABLE public.guests
      ADD CONSTRAINT guests_owner_chk
      CHECK (graduate_id IS NOT NULL OR ceremony_id IS NOT NULL);
  END IF;
END $$;

-- ─── Resolve-ceremony helper inlined as COALESCE in each function below ──────

-- Public invitation lookup — graduate is now optional (self-reg has none).
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'guest', jsonb_build_object(
      'id',              g.id,
      'fullName',        g.full_name,
      'email',           g.email,
      'status',          g.status,
      'invitationToken', g.invitation_token,
      'checkedInAt',     g.checked_in_at
    ),
    'graduate', CASE
      WHEN gr.id IS NULL THEN NULL
      ELSE jsonb_build_object(
        'fullName', gr.full_name,
        'program',  gr.program,
        'faculty',  gr.faculty
      )
    END,
    'ceremony', jsonb_build_object(
      'id',         c.id,
      'name',       c.name,
      'date',       c.date,
      'startTime',  c.start_time,
      'endTime',    c.end_time,
      'venue',      c.venue,
      'campus',     c.campus
    )
  ) INTO v_result
  FROM public.guests g
  LEFT JOIN public.graduates  gr ON gr.id = g.graduate_id
  JOIN public.ceremonies c ON c.id = COALESCE(g.ceremony_id, gr.ceremony_id)
  WHERE g.invitation_token = p_token
    AND g.status <> 'revoked';

  RETURN v_result;  -- NULL if not found
END;
$$;

-- Atomic QR validation — ceremony resolved via COALESCE(guest, graduate).
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

-- Manual check-in — same COALESCE ceremony resolution.
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

-- ─── Atomic self-registration ───────────────────────────────────────────────
--  Locks the event row to serialize capacity checks. Idempotent per email.
CREATE OR REPLACE FUNCTION public.register_attendee(
  p_ceremony_id TEXT,
  p_full_name   TEXT,
  p_email       TEXT,
  p_document    TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cer      public.ceremonies%ROWTYPE;
  v_existing public.guests%ROWTYPE;
  v_count    INT;
  v_guest_id TEXT;
  v_token    TEXT;
BEGIN
  -- Serialize concurrent registrations for this event.
  SELECT * INTO v_cer FROM public.ceremonies WHERE id = p_ceremony_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  IF NOT v_cer.public_listed THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_public');
  END IF;
  IF v_cer.status <> 'open' OR v_cer.registration_closes_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'closed');
  END IF;

  -- Idempotent: same email already registered → return the existing pass.
  IF p_email IS NOT NULL THEN
    SELECT * INTO v_existing FROM public.guests
    WHERE ceremony_id = p_ceremony_id
      AND email = p_email
      AND status <> 'revoked'
    LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'ok', true, 'already', true,
        'guestId', v_existing.id,
        'token', v_existing.invitation_token,
        'fullName', v_existing.full_name
      );
    END IF;
  END IF;

  -- Capacity (venue limit) — count non-revoked attendees of this event.
  IF v_cer.capacity IS NOT NULL THEN
    SELECT count(*) INTO v_count FROM public.guests
    WHERE ceremony_id = p_ceremony_id AND status <> 'revoked';
    IF v_count >= v_cer.capacity THEN
      RETURN jsonb_build_object('ok', false, 'error', 'full');
    END IF;
  END IF;

  INSERT INTO public.guests
    (ceremony_id, full_name, email, document_number, status, invited_at)
  VALUES
    (p_ceremony_id, p_full_name, p_email, p_document, 'invited', now())
  RETURNING id, invitation_token INTO v_guest_id, v_token;

  RETURN jsonb_build_object(
    'ok', true, 'already', false,
    'guestId', v_guest_id, 'token', v_token, 'fullName', p_full_name
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.register_attendee(TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_attendee(TEXT, TEXT, TEXT, TEXT)
  TO service_role;

-- Aggregate now counts self-registered guests (ceremony_id direct) as well.
CREATE OR REPLACE FUNCTION public.get_ceremony_stats(p_ceremony_id TEXT)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH grads AS (
    SELECT * FROM public.graduates WHERE ceremony_id = p_ceremony_id
  ),
  gsts AS (
    SELECT g.* FROM public.guests g
    WHERE g.ceremony_id = p_ceremony_id
       OR g.graduate_id IN (SELECT id FROM grads)
  )
  SELECT jsonb_build_object(
    'ceremonyId',          p_ceremony_id,
    'capacity',            (SELECT capacity FROM public.ceremonies WHERE id = p_ceremony_id),
    'graduatesCount',      (SELECT count(*)  FROM grads),
    'graduatesRegistered', (SELECT count(*)  FROM grads WHERE status IN ('registered','completed')),
    'guestsCount',         (SELECT count(*)  FROM gsts),
    'guestsInvited',       (SELECT count(*)  FROM gsts WHERE status IN ('invited','checked_in')),
    'guestsCheckedIn',     (SELECT count(*)  FROM gsts WHERE status = 'checked_in'),
    'cuposTotal',          COALESCE((SELECT sum(max_guests) FROM grads), 0),
    'cuposUsed',           (SELECT count(*)  FROM gsts WHERE status <> 'revoked')
  );
$$;

-- ─── Organizer RLS: resolve ceremony for self-reg guests too ────────────────
DROP POLICY IF EXISTS guests_organizer_read ON public.guests;
CREATE POLICY guests_organizer_read ON public.guests
  FOR SELECT TO authenticated
  USING (
    public.is_event_organizer(
      COALESCE(
        guests.ceremony_id,
        (SELECT ceremony_id FROM public.graduates WHERE id = guests.graduate_id)
      )
    )
  );

DROP POLICY IF EXISTS guests_organizer_write ON public.guests;
CREATE POLICY guests_organizer_write ON public.guests
  FOR UPDATE TO authenticated
  USING (
    public.is_event_organizer(
      COALESCE(
        guests.ceremony_id,
        (SELECT ceremony_id FROM public.graduates WHERE id = guests.graduate_id)
      )
    )
  )
  WITH CHECK (
    public.is_event_organizer(
      COALESCE(
        guests.ceremony_id,
        (SELECT ceremony_id FROM public.graduates WHERE id = guests.graduate_id)
      )
    )
  );
