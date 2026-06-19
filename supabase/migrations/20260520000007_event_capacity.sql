-- ============================================================================
--  Event capacity (aforo)
--
--  Adds an optional venue capacity to events. This is distinct from
--  `max_guests_default`, which is the per-participant guest quota:
--    · max_guests_default → how many guests ONE participant may register
--    · capacity           → the physical limit of the venue (all guests)
--
--  NULL = no capacity limit (default). Feeds the live attendance board (B1)
--  and the door capacity control (B3).
-- ============================================================================

ALTER TABLE public.ceremonies
  ADD COLUMN IF NOT EXISTS capacity INT
  CHECK (capacity IS NULL OR capacity > 0);

-- Surface `capacity` in the ceremony aggregate so the dashboard / monitor can
-- render "ingresos vs. aforo" from a single call. Body is identical to the
-- original (initial_schema.sql) plus the new `capacity` key.
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
