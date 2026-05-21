-- ============================================================================
--  UPB Ceremonias — Initial schema
--  Tables, enums, indexes, triggers, functions, RLS
--
--  Convention:
--    · TIMESTAMPTZ everywhere (stored UTC, app converts to America/Bogota)
--    · Prefixed text IDs for human-readable URLs (cer_, grad_, gst_, …)
--    · auth.users for staff (admin/coordinator/scanner)
--    · graduates linked to auth identity by email (provisioned on first OTP)
-- ============================================================================

-- ─── Extensions ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid, crypt
CREATE EXTENSION IF NOT EXISTS "citext";    -- case-insensitive text for emails

-- ─── Helper: prefixed ID generator ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.gen_prefixed_id(p_prefix TEXT)
RETURNS TEXT
LANGUAGE sql VOLATILE
AS $$
  SELECT p_prefix || '_' || replace(gen_random_uuid()::text, '-', '');
$$;

-- ─── ENUMs ─────────────────────────────────────────────────────────────────
CREATE TYPE public.document_type AS ENUM ('CC', 'CE', 'TI', 'PP');

CREATE TYPE public.ceremony_status AS ENUM (
  'draft', 'open', 'closed', 'in_progress', 'completed'
);

CREATE TYPE public.graduate_status AS ENUM (
  'eligible', 'not_eligible', 'registered', 'completed'
);

CREATE TYPE public.guest_status AS ENUM (
  'pending', 'invited', 'checked_in', 'revoked'
);

CREATE TYPE public.user_role AS ENUM ('admin', 'scanner', 'coordinator');

CREATE TYPE public.scan_result AS ENUM ('allowed', 'denied');

CREATE TYPE public.scan_denied_reason AS ENUM (
  'already_used', 'invalid_signature', 'wrong_ceremony',
  'outside_time_window', 'revoked', 'not_found'
);

CREATE TYPE public.audit_action AS ENUM (
  'create', 'update', 'delete', 'import',
  'send_invitation', 'revoke', 'check_in', 'login'
);

CREATE TYPE public.entity_type AS ENUM (
  'ceremony', 'graduate', 'guest', 'user', 'scan_event'
);

-- ============================================================================
--  TABLES
-- ============================================================================

-- ─── ceremonies ────────────────────────────────────────────────────────────
CREATE TABLE public.ceremonies (
  id                      TEXT PRIMARY KEY DEFAULT public.gen_prefixed_id('cer'),
  name                    TEXT NOT NULL,
  date                    DATE NOT NULL,
  start_time              TIME NOT NULL,
  end_time                TIME NOT NULL,
  venue                   TEXT NOT NULL,
  campus                  TEXT NOT NULL,
  faculty                 TEXT NOT NULL,
  status                  public.ceremony_status NOT NULL DEFAULT 'draft',
  registration_closes_at  TIMESTAMPTZ NOT NULL,
  max_guests_default      INT NOT NULL DEFAULT 4
    CHECK (max_guests_default BETWEEN 1 AND 20),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ceremonies_status_idx ON public.ceremonies(status);
CREATE INDEX ceremonies_date_idx   ON public.ceremonies(date DESC);

-- ─── users (profile mirror of auth.users for staff) ────────────────────────
CREATE TABLE public.users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           CITEXT NOT NULL UNIQUE,
  full_name       TEXT NOT NULL,
  role            public.user_role NOT NULL DEFAULT 'scanner',
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  last_sign_in_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX users_role_active_idx ON public.users(role) WHERE active;

-- Auto-create public.users row when a new auth.users row appears
-- (admin invites staff via service role → triggers this)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Only create profile if metadata says it's a staff member (not a graduate)
  IF NEW.raw_user_meta_data->>'is_staff' = 'true' THEN
    INSERT INTO public.users (id, email, full_name, role, active)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'scanner'),
      TRUE
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ─── graduates ─────────────────────────────────────────────────────────────
CREATE TABLE public.graduates (
  id              TEXT PRIMARY KEY DEFAULT public.gen_prefixed_id('grad'),
  ceremony_id     TEXT NOT NULL REFERENCES public.ceremonies(id) ON DELETE CASCADE,
  document_type   public.document_type NOT NULL,
  document_number TEXT NOT NULL,
  student_code    TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  email           CITEXT NOT NULL,
  program         TEXT NOT NULL,
  faculty         TEXT NOT NULL,
  max_guests      INT NOT NULL DEFAULT 4
    CHECK (max_guests BETWEEN 0 AND 20),
  status          public.graduate_status NOT NULL DEFAULT 'eligible',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ceremony_id, document_number)
);

CREATE INDEX graduates_ceremony_idx ON public.graduates(ceremony_id);
CREATE INDEX graduates_document_idx ON public.graduates(document_number);
CREATE INDEX graduates_email_idx    ON public.graduates(email);
CREATE INDEX graduates_status_idx   ON public.graduates(status);

-- ─── guests ────────────────────────────────────────────────────────────────
CREATE TABLE public.guests (
  id                TEXT PRIMARY KEY DEFAULT public.gen_prefixed_id('gst'),
  graduate_id       TEXT NOT NULL REFERENCES public.graduates(id) ON DELETE CASCADE,
  full_name         TEXT NOT NULL,
  document_number   TEXT,
  email             CITEXT,
  relationship      TEXT,
  status            public.guest_status NOT NULL DEFAULT 'pending',
  invitation_token  TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  invited_at        TIMESTAMPTZ,
  checked_in_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX guests_graduate_idx ON public.guests(graduate_id);
CREATE UNIQUE INDEX guests_token_idx ON public.guests(invitation_token);
CREATE INDEX guests_status_idx   ON public.guests(status);

-- ─── scan_events ───────────────────────────────────────────────────────────
CREATE TABLE public.scan_events (
  id                  TEXT PRIMARY KEY DEFAULT public.gen_prefixed_id('scn'),
  guest_id            TEXT REFERENCES public.guests(id) ON DELETE SET NULL,
  scanned_by_user_id  UUID NOT NULL REFERENCES public.users(id),
  scanned_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  result              public.scan_result NOT NULL,
  reason              public.scan_denied_reason
);

CREATE INDEX scan_events_at_idx     ON public.scan_events(scanned_at DESC);
CREATE INDEX scan_events_guest_idx  ON public.scan_events(guest_id);
CREATE INDEX scan_events_result_idx ON public.scan_events(result);

-- ─── audit_log ─────────────────────────────────────────────────────────────
CREATE TABLE public.audit_log (
  id          BIGSERIAL PRIMARY KEY,
  actor_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action      public.audit_action NOT NULL,
  entity_type public.entity_type NOT NULL,
  entity_id   TEXT NOT NULL,
  summary     TEXT NOT NULL,
  at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata    JSONB
);

CREATE INDEX audit_log_at_idx     ON public.audit_log(at DESC);
CREATE INDEX audit_log_entity_idx ON public.audit_log(entity_type, entity_id);
CREATE INDEX audit_log_actor_idx  ON public.audit_log(actor_id);

-- ─── graduate_sessions (OTP) ───────────────────────────────────────────────
--  Custom OTP for graduates (not Supabase Auth — they're "guest users")
--  Storing only the hash; plain code is sent via email.
CREATE TABLE public.graduate_sessions (
  id            BIGSERIAL PRIMARY KEY,
  graduate_id   TEXT NOT NULL REFERENCES public.graduates(id) ON DELETE CASCADE,
  otp_hash      TEXT NOT NULL,           -- bcrypt of the 6-digit code
  attempts      INT  NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ NOT NULL,
  consumed_at   TIMESTAMPTZ,
  session_token TEXT UNIQUE,             -- set after successful verify; sent as cookie
  session_expires_at TIMESTAMPTZ,
  ip_address    INET,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX graduate_sessions_graduate_idx
  ON public.graduate_sessions(graduate_id, created_at DESC);
CREATE INDEX graduate_sessions_token_idx
  ON public.graduate_sessions(session_token)
  WHERE session_token IS NOT NULL;
CREATE INDEX graduate_sessions_expires_idx
  ON public.graduate_sessions(expires_at)
  WHERE consumed_at IS NULL;

-- ============================================================================
--  TRIGGERS
-- ============================================================================

-- ─── Auto updated_at ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER ceremonies_touch_updated  BEFORE UPDATE ON public.ceremonies
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER graduates_touch_updated   BEFORE UPDATE ON public.graduates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER guests_touch_updated      BEFORE UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================================
--  FUNCTIONS (SECURITY DEFINER — callable from API routes)
-- ============================================================================

-- ─── Public invitation lookup (anon) ───────────────────────────────────────
--  Used by /invitacion/[token] (no auth required, but only specific token)
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
    'graduate', jsonb_build_object(
      'fullName', gr.full_name,
      'program',  gr.program,
      'faculty',  gr.faculty
    ),
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
  JOIN public.graduates  gr ON gr.id = g.graduate_id
  JOIN public.ceremonies c  ON c.id  = gr.ceremony_id
  WHERE g.invitation_token = p_token
    AND g.status <> 'revoked';

  RETURN v_result;  -- NULL if not found
END;
$$;

-- ─── Atomic QR validation + check-in ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.validate_qr_token(
  p_token      TEXT,
  p_scanner_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest   public.guests%ROWTYPE;
  v_result  public.scan_result;
  v_reason  public.scan_denied_reason;
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

  IF NOT FOUND THEN
    v_result := 'denied';
    v_reason := 'not_found';
  ELSIF v_guest.status = 'revoked' THEN
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

  -- Always log the attempt
  INSERT INTO public.scan_events (guest_id, scanned_by_user_id, result, reason)
  VALUES (v_guest.id, p_scanner_id, v_result, v_reason);

  RETURN jsonb_build_object(
    'result',      v_result,
    'reason',      v_reason,
    'guestName',   v_guest.full_name,
    'graduateId',  v_guest.graduate_id
  );
END;
$$;

-- ─── Ceremony aggregate stats ──────────────────────────────────────────────
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
    JOIN grads gr ON gr.id = g.graduate_id
  )
  SELECT jsonb_build_object(
    'ceremonyId',          p_ceremony_id,
    'graduatesCount',      (SELECT count(*)  FROM grads),
    'graduatesRegistered', (SELECT count(*)  FROM grads WHERE status IN ('registered','completed')),
    'guestsCount',         (SELECT count(*)  FROM gsts),
    'guestsInvited',       (SELECT count(*)  FROM gsts WHERE status IN ('invited','checked_in')),
    'guestsCheckedIn',     (SELECT count(*)  FROM gsts WHERE status = 'checked_in'),
    'cuposTotal',          COALESCE((SELECT sum(max_guests) FROM grads), 0),
    'cuposUsed',           (SELECT count(*)  FROM gsts WHERE status <> 'revoked')
  );
$$;

-- ─── Overview stats (dashboard) ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_overview_stats()
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'totalCeremonies',     (SELECT count(*) FROM public.ceremonies),
    'activeCeremonies',    (SELECT count(*) FROM public.ceremonies WHERE status IN ('open','in_progress')),
    'totalGraduates',      (SELECT count(*) FROM public.graduates),
    'graduatesRegistered', (SELECT count(*) FROM public.graduates WHERE status IN ('registered','completed')),
    'totalGuestsInvited',  (SELECT count(*) FROM public.guests WHERE status IN ('invited','checked_in')),
    'totalCheckedIn',      (SELECT count(*) FROM public.guests WHERE status = 'checked_in'),
    'scanEventsLast24h',   (SELECT count(*) FROM public.scan_events WHERE scanned_at > now() - interval '24 hours')
  );
$$;

-- ─── Graduate OTP flow ─────────────────────────────────────────────────────
--  Step 1: generate OTP for a graduate (by document)
--  Returns plain 6-digit code so the API route can email it.
--  Hashed in DB.
CREATE OR REPLACE FUNCTION public.graduate_generate_otp(
  p_document_number TEXT,
  p_ip              INET DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_grad     public.graduates%ROWTYPE;
  v_code     TEXT;
  v_recent   INT;
BEGIN
  SELECT * INTO v_grad FROM public.graduates
  WHERE document_number = p_document_number;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF v_grad.status = 'not_eligible' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_eligible');
  END IF;

  -- Rate-limit: 5 OTPs in the last 15 minutes
  SELECT count(*) INTO v_recent
  FROM public.graduate_sessions
  WHERE graduate_id = v_grad.id
    AND created_at > now() - interval '15 minutes';
  IF v_recent >= 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'rate_limit');
  END IF;

  -- Generate 6-digit code
  v_code := lpad(floor(random() * 1000000)::text, 6, '0');

  INSERT INTO public.graduate_sessions
    (graduate_id, otp_hash, expires_at, ip_address)
  VALUES
    (v_grad.id, crypt(v_code, gen_salt('bf', 8)), now() + interval '10 minutes', p_ip);

  RETURN jsonb_build_object(
    'ok',           true,
    'graduateId',   v_grad.id,
    'graduateName', v_grad.full_name,
    'email',        v_grad.email,
    'code',         v_code   -- ⚠ caller must NOT return this to client; only email it
  );
END;
$$;

--  Step 2: verify OTP, mint session token
CREATE OR REPLACE FUNCTION public.graduate_verify_otp(
  p_graduate_id TEXT,
  p_code        TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.graduate_sessions%ROWTYPE;
  v_token   TEXT;
BEGIN
  SELECT * INTO v_session FROM public.graduate_sessions
  WHERE graduate_id = p_graduate_id
    AND consumed_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;

  IF v_session.attempts >= 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'too_many_attempts');
  END IF;

  IF v_session.otp_hash <> crypt(p_code, v_session.otp_hash) THEN
    UPDATE public.graduate_sessions
    SET attempts = attempts + 1
    WHERE id = v_session.id;
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code',
      'attemptsLeft', GREATEST(0, 4 - v_session.attempts));
  END IF;

  -- Success — mint session token (30 minutes)
  v_token := encode(gen_random_bytes(32), 'hex');

  UPDATE public.graduate_sessions
  SET consumed_at = now(),
      session_token = v_token,
      session_expires_at = now() + interval '30 minutes'
  WHERE id = v_session.id;

  RETURN jsonb_build_object(
    'ok',           true,
    'sessionToken', v_token,
    'expiresAt',    (now() + interval '30 minutes')
  );
END;
$$;

--  Step 3: look up graduate by session token (for protected reads)
CREATE OR REPLACE FUNCTION public.graduate_from_session(p_token TEXT)
RETURNS TEXT  -- graduate_id
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT graduate_id
  FROM public.graduate_sessions
  WHERE session_token = p_token
    AND session_expires_at > now()
  LIMIT 1;
$$;

-- ============================================================================
--  ROW-LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.ceremonies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graduates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graduate_sessions  ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user staff with given role?
CREATE OR REPLACE FUNCTION public.is_staff(p_roles public.user_role[] DEFAULT ARRAY['admin','coordinator','scanner']::public.user_role[])
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND active
      AND role = ANY(p_roles)
  );
$$;

-- ─── ceremonies ────────────────────────────────────────────────────────────
CREATE POLICY ceremonies_select_all ON public.ceremonies
  FOR SELECT TO authenticated, anon
  USING (true);  -- safe: ceremony names are public

CREATE POLICY ceremonies_admin_write ON public.ceremonies
  FOR ALL TO authenticated
  USING (public.is_staff(ARRAY['admin','coordinator']::public.user_role[]))
  WITH CHECK (public.is_staff(ARRAY['admin','coordinator']::public.user_role[]));

-- ─── users ─────────────────────────────────────────────────────────────────
CREATE POLICY users_admin_all ON public.users
  FOR ALL TO authenticated
  USING (public.is_staff(ARRAY['admin']::public.user_role[]))
  WITH CHECK (public.is_staff(ARRAY['admin']::public.user_role[]));

CREATE POLICY users_self_read ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- ─── graduates ─────────────────────────────────────────────────────────────
CREATE POLICY graduates_admin_all ON public.graduates
  FOR ALL TO authenticated
  USING (public.is_staff(ARRAY['admin','coordinator']::public.user_role[]))
  WITH CHECK (public.is_staff(ARRAY['admin','coordinator']::public.user_role[]));

CREATE POLICY graduates_scanner_read ON public.graduates
  FOR SELECT TO authenticated
  USING (public.is_staff(ARRAY['scanner']::public.user_role[]));

-- (graduate-self read is enforced via session token in API routes,
--  not RLS, since graduates are not auth.users)

-- ─── guests ────────────────────────────────────────────────────────────────
CREATE POLICY guests_admin_all ON public.guests
  FOR ALL TO authenticated
  USING (public.is_staff(ARRAY['admin','coordinator']::public.user_role[]))
  WITH CHECK (public.is_staff(ARRAY['admin','coordinator']::public.user_role[]));

CREATE POLICY guests_scanner_read ON public.guests
  FOR SELECT TO authenticated
  USING (public.is_staff(ARRAY['scanner']::public.user_role[]));

-- ─── scan_events ───────────────────────────────────────────────────────────
CREATE POLICY scan_events_admin_read ON public.scan_events
  FOR SELECT TO authenticated
  USING (public.is_staff(ARRAY['admin','coordinator']::public.user_role[]));

CREATE POLICY scan_events_scanner_self ON public.scan_events
  FOR SELECT TO authenticated
  USING (
    public.is_staff(ARRAY['scanner']::public.user_role[])
    AND scanned_by_user_id = auth.uid()
  );
-- writes happen only via validate_qr_token() SECURITY DEFINER

-- ─── audit_log ─────────────────────────────────────────────────────────────
CREATE POLICY audit_log_admin_read ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.is_staff(ARRAY['admin']::public.user_role[]));
-- writes via triggers / service role

-- ─── graduate_sessions ─────────────────────────────────────────────────────
-- No client access at all — only SECURITY DEFINER functions touch this.
-- (RLS enabled with no policies = nothing allowed for non-service connections)

-- ============================================================================
--  GRANTS for anon / authenticated to call our SECURITY DEFINER functions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(TEXT)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_qr_token(TEXT, UUID)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ceremony_stats(TEXT)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_overview_stats()
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.graduate_generate_otp(TEXT, INET)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.graduate_verify_otp(TEXT, TEXT)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.graduate_from_session(TEXT)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(public.user_role[])
  TO authenticated;
