-- ============================================================================
--  Door capacity — new denied reason (own migration / transaction)
--
--  Postgres forbids using a freshly-added enum value in the same transaction
--  that adds it, so 'capacity_full' is introduced here, on its own. The
--  functions that use it are (re)declared in the next migration.
-- ============================================================================

ALTER TYPE public.scan_denied_reason ADD VALUE IF NOT EXISTS 'capacity_full';
