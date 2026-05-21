# Security model — UPB Ceremonias

> Última auditoría: 2026-05-21 — OWASP Top 10:2025 + Supabase best practices

Este documento describe las decisiones de seguridad de la plataforma, qué
está cubierto y qué queda pendiente para producción.

---

## Roles y autenticación

| Rol           | Cómo se autentica                           | Almacenado en        |
|---------------|---------------------------------------------|----------------------|
| `admin`       | email + password (Supabase Auth)            | `auth.users` + `public.users` |
| `coordinator` | email + password (Supabase Auth)            | `auth.users` + `public.users` |
| `scanner`     | email + password (Supabase Auth)            | `auth.users` + `public.users` |
| Graduando     | OTP de 6 dígitos al correo institucional    | `public.graduate_sessions` (cookie) |
| Anónimo       | Sin auth — solo landing + invitación pública | —                   |

**Decisión clave:** los graduandos NO están en `auth.users`. UPB no quiere
gestionar contraseñas de ~1000 personas que entran una vez al año. En vez de
eso, usamos OTP por correo + cookie HttpOnly de 30 min.

---

## Defensas implementadas (por capa)

### Capa 1 — Headers HTTP (`next.config.ts`)

| Header | Valor | Mitiga |
|---|---|---|
| `Content-Security-Policy` | Estricto, solo `'self'` + Supabase + fonts.google | XSS, click-jacking |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Downgrade attacks |
| `X-Content-Type-Options` | `nosniff` | MIME confusion |
| `X-Frame-Options` | `DENY` | Click-jacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Token leak vía Referer |
| `Permissions-Policy` | `camera=(self), microphone=(), ...` | Cámara solo en scanner |
| `Cross-Origin-Opener-Policy` | `same-origin` | Spectre-style attacks |
| `X-Powered-By` | (suprimido) | Fingerprinting |

### Capa 2 — Proxy / route gating (`proxy.ts`)

- `/admin/*` → exige `auth.users` con `role in (admin, coordinator)` + `active`
- `/scanner/*` → exige `auth.users` con `role in (admin, coordinator, scanner)` + `active`
- `/portal/*` → exige cookie `upb_graduate_session`
- Si falla → redirect a login con `?redirect=<path>` para volver tras autenticarse

### Capa 3 — API routes (`app/api/*/route.ts`)

Cada endpoint POST/PUT aplica en orden:

1. **Rate limit IP** (`lib/security/rate-limit.ts`) — 5-60 req/min según endpoint
2. **CSRF** (`lib/security/csrf.ts`) — verifica `Origin` + `Sec-Fetch-Site`
3. **Validación zod** (`lib/security/schemas.ts`) — esquema estricto del body
4. **Auth** — `getUser()` de Supabase o validación de cookie graduado
5. **Verificación de rol** — defense-in-depth aunque RLS también lo bloquea
6. **Operación** — vía función `SECURITY DEFINER` para atomicidad

### Capa 4 — Base de datos (PostgreSQL + RLS)

#### RLS habilitado en TODAS las tablas

| Tabla | Política                                                |
|---|---|
| `ceremonies` | anon lee no-draft; staff (admin/coord) escribe |
| `users` | self-read; admin escribe |
| `graduates` | admin/coord all; scanner read |
| `guests` | admin/coord all; scanner read |
| `scan_events` | admin/coord read; scanner read solo lo suyo |
| `audit_log` | admin read |
| `graduate_sessions` | **nadie** (REVOKE total — solo funciones SECURITY DEFINER) |

#### Funciones SECURITY DEFINER

| Función | Razón |
|---|---|
| `validate_qr_token` | `LOCK ROW` + `UPDATE` + `INSERT scan_event` atómico |
| `graduate_generate_otp` | Rate-limit por documento + bcrypt hash |
| `graduate_verify_otp` | Verifica hash + mint token + invalida tras éxito |
| `is_staff(roles[])` | Evita recursión en políticas RLS |
| `get_invitation_by_token` | Anon callable, expone solo 1 invitado |

#### Constraints/Invariantes

- `graduates(ceremony_id, document_number)` UNIQUE — un graduando una vez por ceremonia
- `max_guests CHECK (0..20)` — sanity bound
- Trigger `enforce_guest_quota_trigger` — bloquea INSERT/UPDATE que exceda `max_guests`
- `guests.invitation_token` UNIQUE + DEFAULT `gen_random_uuid()` — 256 bits de entropía

---

## OWASP Top 10:2025 — cobertura punto por punto

| ID | Categoría | Cobertura |
|---|---|---|
| **A01** | Broken Access Control | ✅ RLS + proxy + endpoint role checks (3 capas) |
| **A02** | Cryptographic Failures | ✅ bcrypt OTP, `gen_random_bytes()`, HTTPS forzado, cookies httpOnly+secure+sameSite=strict |
| **A03** | Injection | ✅ Queries parametrizadas (Supabase client), zod validation, escapeHtml en emails |
| **A04** | Insecure Design | ✅ Sesión graduando custom (sin usar auth.users) — diseño intencional documentado |
| **A05** | Security Misconfiguration | ✅ Security headers, no `X-Powered-By`, `.env.local` gitignored |
| **A06** | Vulnerable Components | 🟡 npm audit: 2 moderate (postcss vía Next 16 — requiere downgrade a Next 9 para fix; no aplica) |
| **A07** | Identification & Auth | ✅ Rate limit IP + DB, OTP 6-dígitos con bcrypt + TTL 10min, 5 intentos máx |
| **A08** | Software/Data Integrity | ✅ Sin scripts externos sin SRI; service_role marcado `server-only` |
| **A09** | Security Logging | ✅ `audit_log` con triggers en ceremonies+users; `scan_events` por cada escaneo |
| **A10** | SSRF | ✅ No hay endpoints que tomen URLs del usuario para fetch |

---

## Variables de entorno requeridas

Ver [`.env.example`](../.env.example) para la lista completa.

**Secretos** (nunca commiteados, nunca en `NEXT_PUBLIC_*`):
- `SUPABASE_SERVICE_ROLE_KEY` — bypass total de RLS, server-only
- `RESEND_API_KEY` — envío de correos

**Públicos** (OK en bundle del navegador):
- `NEXT_PUBLIC_USE_SUPABASE` — flag mock⇄real
- `NEXT_PUBLIC_SUPABASE_URL` — público por diseño (CORS-protected)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — público por diseño (RLS-protected)
- `NEXT_PUBLIC_APP_URL` — solo para construir links absolutos en correos

---

## Pruebas manuales a hacer antes de producción

### 🔍 Autenticación

- [ ] Login admin con credenciales correctas → llega al dashboard
- [ ] Login admin con password incorrecta → mensaje genérico (no leak "user not found")
- [ ] Login admin con cuenta `active = false` → redirect al login
- [ ] OTP graduando: enviar 6 OTPs en 1 minuto al mismo doc → 6º responde 429
- [ ] OTP graduando: meter 5 códigos incorrectos → 6º invalida la sesión
- [ ] OTP graduando: esperar 11 minutos y verificar el código → 410 expired
- [ ] OTP graduando: usar el código 2 veces → 2ª vez falla

### 🛡 Autorización

- [ ] Como graduando logueado intentar `GET /admin` → redirect a `/admin/iniciar-sesion`
- [ ] Como scanner logueado intentar `GET /admin/usuarios` → redirect (no es admin)
- [ ] Sin login intentar `GET /portal` → redirect a `/registro`
- [ ] Como graduando A modificar invitado de graduando B vía API → 401/403
- [ ] Como scanner intentar `POST /api/guests/send-invitations` → 401

### 🔒 QR

- [ ] Escanear QR válido → resultado "allowed", se marca checked_in
- [ ] Escanear el mismo QR otra vez → "denied — already_used"
- [ ] Escanear QR revocado → "denied — revoked"
- [ ] Escanear QR aleatorio inventado → "denied — not_found"
- [ ] DOS scanners escaneando el mismo QR a la vez → solo uno gana (atomic lock)

### 🚦 Rate limits

- [ ] Hacer 11 POST a `/api/auth/graduate/send-otp` en 1 min → 11º responde 429
- [ ] Hacer 61 POST a `/api/qr/validate` en 1 min → 61º responde 429

### 🚫 CSRF

- [ ] Hacer POST desde otra origin (curl con `-H "Origin: https://evil.com"`) → 403
- [ ] Hacer POST con `Sec-Fetch-Site: cross-site` → 403

### 🧯 XSS / Injection

- [ ] Crear graduando con nombre `<script>alert(1)</script>` → se muestra escapado
- [ ] Buscar graduandos con `%' OR 1=1 --` → no devuelve todo (escapado por Supabase)
- [ ] Crear invitado con email `a"<script>` → no rompe el HTML del correo

### 📋 Headers

- [ ] `curl -I https://ceremonias.upb.edu.co` → todos los security headers presentes
- [ ] Probar en https://securityheaders.com → grado A+ esperado
- [ ] Probar en https://observatory.mozilla.org → 90+/100 esperado

### 🗃 RLS (con Supabase Studio)

Conectarse con SQL Editor como `anon`:
- [ ] `SELECT * FROM users` → 0 filas (REVOKE total)
- [ ] `SELECT * FROM audit_log` → permission denied
- [ ] `SELECT * FROM graduate_sessions` → 0 filas
- [ ] `SELECT * FROM ceremonies WHERE status = 'draft'` → 0 filas

Como `authenticated` con un usuario scanner:
- [ ] `UPDATE guests SET status='checked_in' WHERE id='gst_xxx'` → 0 filas
- [ ] `INSERT INTO ceremonies (...)` → permission denied

---

## Pendientes para producción (próxima iteración)

### 🟠 Importante (no bloquea lanzamiento, sí antes de escala)

- **Migrar rate limit a Upstash Redis / Vercel KV** — actual es per-process,
  no escala horizontalmente en serverless.
- **CSP con nonces** — actualmente `script-src 'unsafe-inline'` por Next.js
  hydration shims. Posible migrar a nonces con `next-safe-middleware`.
- **Logging estructurado** — agregar Sentry o Pino para tracking de errores
  con contexto. Hoy es `console.error` plano.
- **WAF** — si UPB usa Cloudflare/Vercel Pro, activar reglas básicas
  (bot fight, rate limit por endpoint, OWASP CRS).
- **Penetration test externo** — antes del primer evento grande.

### 🟢 Nice-to-have

- **2FA opcional para staff admin** — TOTP via authenticator app.
- **Auditoría inmutable** — copia a S3 / Glacier de `audit_log` con WORM.
- **Anomaly detection** — alerta si un scanner valida >100 QRs/min (posible compromiso).
- **Backup encriptado** — verificar que los backups Supabase Pro están cifrados at-rest (sí lo están).
- **GDPR/Ley 1581** — botón "borrar mis datos" para graduandos post-evento.

### ⚠ Decisiones que UPB debe tomar

- **SSO institucional** — si UPB usa Azure AD para staff, integrar
  `signInWithSSO` y deshabilitar password login.
- **Retención de datos** — ¿cuánto tiempo se guardan los datos del graduando
  después de la ceremonia? Política de borrado.
- **Política de cookies** — banner para `upb_graduate_session`
  (técnicamente necesaria, no requiere consentimiento, pero el banner ayuda).

---

## Reportar vulnerabilidades

Si encuentras un problema de seguridad, **NO** abras un issue público en GitHub.
Escribe a `seguridad@upb.edu.co` (o el contacto de TI institucional) con:
- Descripción del problema
- Pasos para reproducir
- Impacto estimado

Respuesta en 48h hábiles.
