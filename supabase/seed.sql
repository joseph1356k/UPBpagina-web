-- ============================================================================
--  UPB Ceremonias — Seed data
--  Loaded by `supabase db reset` and on first deploy.
--  Same data the mock layer has, so devs see a populated app from minute zero.
-- ============================================================================

-- ─── Events (table is still named `ceremonies`; event_type drives the UX) ──
INSERT INTO public.ceremonies
  (id, name, event_type, email_template, date, start_time, end_time, venue, campus, faculty, status, registration_closes_at, max_guests_default, capacity, public_listed, capacity_enforce)
VALUES
  ('cer_ing_06_2026', 'Grados Facultad de Ingenierías — Junio 2026', 'graduation', 'elegante',
   '2026-06-19', '09:00', '11:30',
   'Auditorio Mons. Felipe Estrada Vélez', 'Medellín',
   'Facultad de Ingenierías', 'open',
   '2026-06-12 23:59:59-05', 4, 320, false, false),

  ('cer_eco_06_2026', 'Grados Facultad de Ciencias Económicas — Junio 2026', 'graduation', 'elegante',
   '2026-06-26', '10:00', '12:30',
   'Auditorio Principal UPB Bucaramanga', 'Bucaramanga',
   'Facultad de Ciencias Económicas, Administrativas y Contables', 'open',
   '2026-06-19 23:59:59-05', 3, 250, false, false),

  ('cer_sal_04_2026', 'Grados Facultad de Ciencias de la Salud — Abril 2026', 'graduation', 'elegante',
   '2026-04-18', '08:30', '11:00',
   'Auditorio Mons. Felipe Estrada Vélez', 'Medellín',
   'Facultad de Ciencias de la Salud', 'completed',
   '2026-04-11 23:59:59-05', 4, 300, false, false),

  ('cer_conf_09_2026', 'Congreso de Innovación UPB 2026', 'conference', 'clasica',
   '2026-09-10', '08:00', '17:00',
   'Centro de Convenciones', 'Medellín', 'Vicerrectoría', 'open',
   '2026-09-05 23:59:59-05', 2, 500, true, false);

-- ─── Demo graduates (3 per ceremony — just enough to see the UI) ───────────
INSERT INTO public.graduates
  (id, ceremony_id, document_type, document_number, student_code, full_name, email, program, faculty, max_guests, status)
VALUES
  ('grad_demo_ing_001', 'cer_ing_06_2026', 'CC', '1037612845', '000123456',
   'Ana María Pérez Ruiz', 'ana.perez@upb.edu.co',
   'Ingeniería de Sistemas e Informática', 'Facultad de Ingenierías',
   4, 'registered'),

  ('grad_demo_ing_002', 'cer_ing_06_2026', 'CC', '1037612846', '000123457',
   'Carlos Andrés Vélez Mejía', 'carlos.velez@upb.edu.co',
   'Ingeniería Industrial', 'Facultad de Ingenierías',
   4, 'eligible'),

  ('grad_demo_ing_003', 'cer_ing_06_2026', 'CC', '1037612847', '000123458',
   'Laura Catalina Ríos Toro', 'laura.rios@upb.edu.co',
   'Ingeniería Civil', 'Facultad de Ingenierías',
   4, 'registered'),

  ('grad_demo_eco_001', 'cer_eco_06_2026', 'CC', '1037612848', '000123459',
   'Juan Pablo Gómez Arango', 'juan.gomez@upb.edu.co',
   'Administración de Empresas', 'Facultad de Ciencias Económicas, Administrativas y Contables',
   3, 'registered'),

  ('grad_demo_eco_002', 'cer_eco_06_2026', 'CC', '1037612849', '000123460',
   'María Isabel Quintero Saldarriaga', 'maria.quintero@upb.edu.co',
   'Contaduría Pública', 'Facultad de Ciencias Económicas, Administrativas y Contables',
   3, 'eligible'),

  ('grad_demo_sal_001', 'cer_sal_04_2026', 'CC', '1037612850', '000123461',
   'Daniel Esteban Restrepo Ochoa', 'daniel.restrepo@upb.edu.co',
   'Medicina', 'Facultad de Ciencias de la Salud',
   4, 'completed');

-- ─── Demo guests ───────────────────────────────────────────────────────────
INSERT INTO public.guests
  (id, graduate_id, full_name, document_number, email, relationship, status, invited_at, checked_in_at)
VALUES
  -- Ana (registered, all invited)
  ('gst_001', 'grad_demo_ing_001', 'María Eugenia Ruiz de Pérez',
   '32145678', 'maria.ruiz@gmail.com', 'Madre', 'invited',
   '2026-05-10 14:00:00-05', NULL),
  ('gst_002', 'grad_demo_ing_001', 'José Antonio Pérez Hernández',
   '8765432', 'jose.perez@gmail.com', 'Padre', 'invited',
   '2026-05-10 14:00:00-05', NULL),
  ('gst_003', 'grad_demo_ing_001', 'Sofía Pérez Ruiz',
   '1098765432', NULL, 'Hermano/a', 'invited',
   '2026-05-10 14:00:00-05', NULL),

  -- Carlos (eligible, two drafts)
  ('gst_004', 'grad_demo_ing_002', 'Patricia Mejía de Vélez',
   '43215678', 'patricia.mejia@gmail.com', 'Madre', 'pending', NULL, NULL),
  ('gst_005', 'grad_demo_ing_002', 'Sebastián Vélez',
   NULL, NULL, 'Hermano/a', 'pending', NULL, NULL),

  -- Daniel (completed ceremony, all checked in)
  ('gst_006', 'grad_demo_sal_001', 'Luz Marina Ochoa Castaño',
   '21987654', 'luz.ochoa@gmail.com', 'Madre', 'checked_in',
   '2026-04-10 10:00:00-05', '2026-04-18 08:35:00-05'),
  ('gst_007', 'grad_demo_sal_001', 'Andrés Felipe Restrepo Vargas',
   '12345987', 'andres.restrepo@gmail.com', 'Padre', 'checked_in',
   '2026-04-10 10:00:00-05', '2026-04-18 08:36:00-05');

-- ─── Staff users seed is intentionally empty ───────────────────────────────
-- Staff are created via Supabase Auth (admin invites) — that flow inserts
-- both auth.users and public.users via trigger. See docs/SETUP.md step 5.
