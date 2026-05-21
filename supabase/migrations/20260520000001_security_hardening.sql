-- ============================================================================
--  Security hardening — OWASP A07 (Auth) + Supabase best practices
--
--  Fixes:
--    1. Use raw_app_meta_data (admin-only) instead of raw_user_meta_data
--       (user-editable) for staff provisioning — prevents privilege
--       escalation if signup is ever enabled.
--    2. Replace OTP random() (non-cryptographic) with gen_random_bytes()
--       from pgcrypto — prevents OTP prediction.
--    3. Add explicit revoke on graduate session token (separate function).
--    4. Add audit_log triggers for sensitive mutations.
--    5. Add invariant: graduate cannot exceed max_guests when creating guests.
-- ============================================================================

-- ─── 1. Fix handle_new_auth_user — use app_metadata ────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_staff BOOLEAN;
  v_role     public.user_role;
  v_name     TEXT;
BEGIN
  -- app_metadata is admin-only (set by service role via admin.createUser).
  -- Never trust user_metadata for authorization decisions.
  v_is_staff := COALESCE(
    (NEW.raw_app_meta_data->>'is_staff')::boolean,
    FALSE
  );

  IF v_is_staff THEN
    v_role := COALESCE(
      (NEW.raw_app_meta_data->>'role')::public.user_role,
      'scanner'
    );
    v_name := COALESCE(
      NEW.raw_app_meta_data->>'full_name',
      NEW.email
    );

    INSERT INTO public.users (id, email, full_name, role, active)
    VALUES (NEW.id, NEW.email, v_name, v_role, TRUE)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ─── 2. Cryptographically secure OTP generation ────────────────────────────
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
  v_bytes    BYTEA;
  v_int      BIGINT;
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

  -- Rate-limit: 5 OTPs in the last 15 minutes (regardless of IP)
  SELECT count(*) INTO v_recent
  FROM public.graduate_sessions
  WHERE graduate_id = v_grad.id
    AND created_at > now() - interval '15 minutes';
  IF v_recent >= 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'rate_limit');
  END IF;

  -- CSPRNG: 4 bytes → 32-bit unsigned int → mod 1,000,000 → 6 digits.
  -- gen_random_bytes() uses /dev/urandom (cryptographically secure).
  v_bytes := gen_random_bytes(4);
  v_int := (get_byte(v_bytes, 0)::bigint * 16777216)
         + (get_byte(v_bytes, 1) * 65536)
         + (get_byte(v_bytes, 2) * 256)
         +  get_byte(v_bytes, 3);
  v_code := lpad((v_int % 1000000)::text, 6, '0');

  INSERT INTO public.graduate_sessions
    (graduate_id, otp_hash, expires_at, ip_address)
  VALUES
    (v_grad.id, crypt(v_code, gen_salt('bf', 10)), now() + interval '10 minutes', p_ip);

  RETURN jsonb_build_object(
    'ok',           true,
    'graduateId',   v_grad.id,
    'graduateName', v_grad.full_name,
    'email',        v_grad.email,
    'code',         v_code   -- ⚠ caller must NOT return this to client; only email it
  );
END;
$$;

-- ─── 3. Explicit graduate sign-out (revokes session token) ─────────────────
CREATE OR REPLACE FUNCTION public.graduate_revoke_session(p_token TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.graduate_sessions
  SET session_token = NULL,
      session_expires_at = NULL
  WHERE session_token = p_token;
END;
$$;
GRANT EXECUTE ON FUNCTION public.graduate_revoke_session(TEXT) TO anon, authenticated;

-- ─── 4. Audit log triggers for sensitive tables ────────────────────────────
CREATE OR REPLACE FUNCTION public.audit_row_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID;
  v_action public.audit_action;
  v_entity_id TEXT;
  v_summary TEXT;
BEGIN
  -- The function runs as the caller's user context for auth.uid()
  v_actor := auth.uid();

  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_entity_id := NEW.id::text;
    v_summary := format('Creó %s "%s"', TG_TABLE_NAME,
      COALESCE(NEW.name, NEW.full_name, NEW.id::text));
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_entity_id := NEW.id::text;
    v_summary := format('Actualizó %s "%s"', TG_TABLE_NAME,
      COALESCE(NEW.name, NEW.full_name, NEW.id::text));
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_entity_id := OLD.id::text;
    v_summary := format('Eliminó %s "%s"', TG_TABLE_NAME,
      COALESCE(OLD.name, OLD.full_name, OLD.id::text));
  END IF;

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id, summary)
  VALUES (
    v_actor,
    v_action,
    CASE TG_TABLE_NAME
      WHEN 'ceremonies' THEN 'ceremony'::public.entity_type
      WHEN 'graduates'  THEN 'graduate'::public.entity_type
      WHEN 'guests'     THEN 'guest'::public.entity_type
      WHEN 'users'      THEN 'user'::public.entity_type
      ELSE 'ceremony'::public.entity_type
    END,
    v_entity_id,
    v_summary
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_ceremonies
  AFTER INSERT OR UPDATE OR DELETE ON public.ceremonies
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

CREATE TRIGGER audit_users
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

-- (Don't audit graduates/guests — too high volume; significant ones logged
--  by API routes explicitly when needed.)

-- ─── 5. Enforce max_guests invariant at the DB level ───────────────────────
CREATE OR REPLACE FUNCTION public.enforce_guest_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_max INT;
  v_current INT;
BEGIN
  -- Only check on INSERT or when un-revoking
  IF TG_OP = 'INSERT' OR
     (TG_OP = 'UPDATE' AND OLD.status = 'revoked' AND NEW.status <> 'revoked') THEN

    SELECT max_guests INTO v_max
    FROM public.graduates WHERE id = NEW.graduate_id;

    SELECT count(*) INTO v_current
    FROM public.guests
    WHERE graduate_id = NEW.graduate_id
      AND status <> 'revoked'
      AND (TG_OP = 'INSERT' OR id <> NEW.id);

    IF v_current >= v_max THEN
      RAISE EXCEPTION 'cupo_lleno' USING
        ERRCODE = 'check_violation',
        DETAIL  = format('Graduando ya tiene %s invitados (cupo: %s)', v_current, v_max);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_guest_quota_trigger
  BEFORE INSERT OR UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.enforce_guest_quota();

-- ─── 6. Restrict ceremonies SELECT to non-draft for anon ───────────────────
-- (draft ceremonies should not leak to public)
DROP POLICY IF EXISTS ceremonies_select_all ON public.ceremonies;

CREATE POLICY ceremonies_anon_read_public ON public.ceremonies
  FOR SELECT TO anon
  USING (status IN ('open', 'in_progress', 'closed', 'completed'));

CREATE POLICY ceremonies_authenticated_read_all ON public.ceremonies
  FOR SELECT TO authenticated
  USING (true);

-- ─── 7. Tighten guests RLS — graduates self-access guarded in API only ─────
-- (No change; current model is correct — graduates aren't auth.users, so
--  their access is enforced by API routes via session token, not RLS.)

-- ─── 8. Belt-and-suspenders: deny anon ALL on sensitive tables ─────────────
REVOKE ALL ON public.users              FROM anon;
REVOKE ALL ON public.scan_events        FROM anon;
REVOKE ALL ON public.audit_log          FROM anon;
REVOKE ALL ON public.graduate_sessions  FROM anon;
REVOKE ALL ON public.graduate_sessions  FROM authenticated;

-- ─── 9. Add login tracking ─────────────────────────────────────────────────
-- Convenience function the auth callback calls to update last_sign_in_at
CREATE OR REPLACE FUNCTION public.touch_user_login(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET last_sign_in_at = now()
  WHERE id = p_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.touch_user_login(UUID) TO authenticated;
