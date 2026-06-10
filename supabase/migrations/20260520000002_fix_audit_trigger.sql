-- ============================================================================
--  Fix audit_row_change trigger — works across all audited tables.
--
--  Bug: the previous version did
--       COALESCE(NEW.name, NEW.full_name, NEW.id::text)
--    PostgreSQL evaluates every branch at compile time, so when the trigger
--    fires on `ceremonies` (which has `name` but not `full_name`) PG raises
--    "record NEW has no field full_name" and the INSERT fails. That was
--    blocking ceremony creation entirely.
--
--  Fix: cast the row to jsonb and read fields dynamically — jsonb_extract
--  returns NULL for missing keys instead of throwing.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.audit_row_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor     UUID;
  v_action    public.audit_action;
  v_row       JSONB;
  v_entity_id TEXT;
  v_label     TEXT;
  v_summary   TEXT;
BEGIN
  v_actor := auth.uid();
  v_row   := to_jsonb(COALESCE(NEW, OLD));
  v_label := COALESCE(v_row->>'name', v_row->>'full_name', v_row->>'id', '?');

  IF TG_OP = 'INSERT' THEN
    v_action    := 'create';
    v_entity_id := (NEW).id::text;
    v_summary   := format('Creó %s "%s"', TG_TABLE_NAME, v_label);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action    := 'update';
    v_entity_id := (NEW).id::text;
    v_summary   := format('Actualizó %s "%s"', TG_TABLE_NAME, v_label);
  ELSIF TG_OP = 'DELETE' THEN
    v_action    := 'delete';
    v_entity_id := (OLD).id::text;
    v_summary   := format('Eliminó %s "%s"', TG_TABLE_NAME, v_label);
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
