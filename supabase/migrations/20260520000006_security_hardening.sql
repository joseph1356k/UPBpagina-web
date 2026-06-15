-- ════════════════════════════════════════════════════════════════════
--  P0 security hardening — hide backend-only functions from the REST API
--
--  Postgres grants EXECUTE to PUBLIC by default, and anon/authenticated
--  inherit from PUBLIC — so we must REVOKE from PUBLIC too, then GRANT
--  back only where genuinely needed. The service_role (used by our API
--  routes) gets an explicit grant so the backend keeps working.
--
--  Result: an attacker with the anon key can no longer invoke the OTP /
--  QR / invitation logic directly via /rest/v1/rpc/* — they must go
--  through our API routes, which enforce rate-limit + CSRF + validation.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Backend-only: callable ONLY by the service role ──────────────
--  Verified: every caller uses createServiceClient() in API routes
--  (app/api/auth/graduate/*, app/api/invitations/[token], lib/db).
DO $$
DECLARE sig text;
BEGIN
  FOREACH sig IN ARRAY ARRAY[
    'graduate_generate_otp(text, inet)',
    'graduate_verify_otp(text, text)',
    'graduate_from_session(text)',
    'graduate_revoke_session(text)',
    'get_invitation_by_token(text)'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', sig);
  END LOOP;
END $$;

-- ── 2. Authenticated-only: drop anon, keep signed-in + service ──────
--  validate_qr_token self-checks the scanner role internally; stats and
--  RLS helpers are used server-side / by policies.
DO $$
DECLARE sig text;
BEGIN
  FOREACH sig IN ARRAY ARRAY[
    'validate_qr_token(text, uuid)',
    'get_overview_stats()',
    'get_ceremony_stats(text)',
    'is_staff(public.user_role[])',
    'is_event_organizer(text)',
    'touch_user_login(uuid)'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon', sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated, service_role', sig);
  END LOOP;
END $$;

-- ── 3. Trigger functions: never callable directly via RPC ───────────
--  Triggers fire with the table owner's privileges; no EXECUTE grant
--  to callers is needed for them to work.
REVOKE EXECUTE ON FUNCTION public.audit_row_change()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_guest_quota()  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at()     FROM PUBLIC, anon, authenticated;

-- ── 4. Fix mutable search_path (advisor 0011) ───────────────────────
ALTER FUNCTION public.touch_updated_at()    SET search_path = public;
ALTER FUNCTION public.enforce_guest_quota() SET search_path = public;

-- ── 5. Tighten the rest (their only callers now use the service client) ─
--  lib/db getCeremonyStats/getOverviewStats/simulateScan switched to
--  createServiceClient(), so these no longer need authenticated EXECUTE.
DO $$
DECLARE sig text;
BEGIN
  FOREACH sig IN ARRAY ARRAY[
    'validate_qr_token(text, uuid)',
    'get_overview_stats()',
    'get_ceremony_stats(text)'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', sig);
  END LOOP;
END $$;

-- ── 6. Harden touch_user_login — ignore client input, use auth.uid() ───
--  Previously trusted p_user_id, letting any signed-in staff touch another
--  user's last_sign_in_at. Now it only ever updates the caller's own row.
CREATE OR REPLACE FUNCTION public.touch_user_login(p_user_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.users SET last_sign_in_at = now() WHERE id = auth.uid();
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.touch_user_login(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.touch_user_login(uuid) TO authenticated, service_role;

-- ════════════════════════════════════════════════════════════════════
--  Remaining (intentional) authenticated-executable SECURITY DEFINER fns:
--    is_staff(user_role[]), is_event_organizer(text)
--  These are called *inside* RLS policies in the signed-in user's context,
--  so they MUST keep authenticated EXECUTE or every RLS-protected query by
--  staff would fail. They only return a boolean about the caller — no data
--  leak. The advisor warning for them is expected and accepted.
-- ════════════════════════════════════════════════════════════════════
