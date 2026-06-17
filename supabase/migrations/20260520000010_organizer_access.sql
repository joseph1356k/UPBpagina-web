-- ============================================================================
--  Organizer workspace — write access + scan visibility (scoped per event)
--
--  Migration 5 gave organizers READ access to their assigned events'
--  ceremonies / graduates / guests. This adds:
--    · UPDATE on graduates + guests, scoped via is_event_organizer()
--    · SELECT on scan_events for their events (the live monitor / escaneos)
--
--  Enforcement is RLS: the admin API routes simply widen their role gate to
--  include 'organizer', and these policies confine an organizer to the events
--  they are assigned to. Editing the ceremony itself stays admin/coordinator.
-- ============================================================================

-- ─── graduates: organizers may edit participants of their events ────────────
DROP POLICY IF EXISTS graduates_organizer_write ON public.graduates;
CREATE POLICY graduates_organizer_write ON public.graduates
  FOR UPDATE TO authenticated
  USING (public.is_event_organizer(ceremony_id))
  WITH CHECK (public.is_event_organizer(ceremony_id));

-- ─── guests: organizers may edit/revoke guests of their events ──────────────
DROP POLICY IF EXISTS guests_organizer_write ON public.guests;
CREATE POLICY guests_organizer_write ON public.guests
  FOR UPDATE TO authenticated
  USING (
    public.is_event_organizer(
      (SELECT ceremony_id FROM public.graduates WHERE id = guests.graduate_id)
    )
  )
  WITH CHECK (
    public.is_event_organizer(
      (SELECT ceremony_id FROM public.graduates WHERE id = guests.graduate_id)
    )
  );

-- ─── scan_events: organizers can read their events' scans (monitor/escaneos)─
DROP POLICY IF EXISTS scan_events_organizer_read ON public.scan_events;
CREATE POLICY scan_events_organizer_read ON public.scan_events
  FOR SELECT TO authenticated
  USING (public.is_event_organizer(ceremony_id));
