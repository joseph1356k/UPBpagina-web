-- Track when each graduate received the "your portal is ready" welcome
-- email, so the bulk-notify action can skip already-notified rows and
-- the admin UI can show who was reached.
ALTER TABLE public.graduates
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;
