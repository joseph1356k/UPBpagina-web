# Arquitectura — UPB Ceremonias

## Modelo de capas

```
┌─────────────────────────────────────────────────────────────────┐
│  components/  (UI puros, no saben de dónde viene la data)       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  lib/data.ts  (router — toggles según NEXT_PUBLIC_USE_SUPABASE) │
└─────────────┬───────────────────────────────────┬───────────────┘
              │                                   │
              ▼                                   ▼
        ┌───────────┐                       ┌───────────┐
        │ lib/mock/ │                       │  lib/db/  │
        │ in-memory │                       │  Supabase │
        └───────────┘                       └─────┬─────┘
                                                  │
                                                  ▼
                                      ┌──────────────────────┐
                                      │  lib/supabase/       │
                                      │  · client.ts  (RSC)  │
                                      │  · server.ts  (API)  │
                                      │  · service.ts (admin)│
                                      └──────────┬───────────┘
                                                 │
                                                 ▼
                                      ┌──────────────────────┐
                                      │ Supabase PostgreSQL  │
                                      │ + Auth + Functions   │
                                      │ + RLS policies       │
                                      └──────────────────────┘
```

### Regla de oro

**Los componentes solo importan de `@/lib/data`**, nunca de `@/lib/mock` ni
`@/lib/db` directamente. Eso garantiza que el toggle mock⇄real funcione sin
tocar UI.

---

## Modelo de datos

### Entidades core

| Tabla              | Quién la usa            | Notas                                 |
|--------------------|-------------------------|---------------------------------------|
| `ceremonies`       | Todos                   | Eventos de grado por facultad/campus  |
| `graduates`        | Admin + graduando-self  | Listado oficial importado por UPB     |
| `guests`           | Admin + graduando       | Hasta `max_guests` por graduando      |
| `users`            | Admin                   | Profile espejo de `auth.users` (staff)|
| `scan_events`      | Admin (read), DB (write)| Append-only, escrito vía función      |
| `audit_log`        | Admin (read)            | Append-only, escrito vía triggers     |
| `graduate_sessions`| Solo DB (vía funciones) | OTP + token de sesión del graduando   |

### Decisión de autenticación

Hay **dos clases** de usuarios autenticados, con caminos distintos:

#### Staff (admin, coordinator, scanner)

- Cuentas en `auth.users` (Supabase Auth estándar)
- Login con email + password
- Profile en `public.users` con role y active
- Sesión vía cookies Supabase (`@supabase/ssr`)
- RLS los identifica con `auth.uid()` + función `is_staff(roles[])`

#### Graduandos

- **No** son cuentas `auth.users` (institución no quiere gestionarles password)
- Autenticación por OTP 6-dígitos al correo institucional
- Tabla custom `graduate_sessions` guarda hash del OTP + token de sesión
- Cookie `upb_graduate_session` con el token
- Las API routes y queries para datos del graduando validan ese token vía
  `graduate_from_session()`

### Por qué RLS no cubre a los graduandos

RLS necesita `auth.uid()` para identificar al usuario. Como los graduandos no
están en `auth.users`, sus accesos pasan por:
- API routes que validan la cookie de sesión vía `graduate_from_session()`
- Esos route handlers usan el `service_role` para hacer las queries

Esto es seguro porque el endpoint **siempre** filtra por el `graduate_id`
derivado del token de sesión — el graduando no puede pedir datos de otro.

---

## Operaciones críticas — patrón funcional

Cualquier cosa que tenga consecuencias atómicas (escanear QR, generar OTP)
está implementada como **función PostgreSQL `SECURITY DEFINER`**:

| Función                          | Quién la llama        | Por qué SECURITY DEFINER       |
|----------------------------------|-----------------------|--------------------------------|
| `validate_qr_token(token, uid)`  | API scanner           | Lock + update + insert atómicos|
| `graduate_generate_otp(doc, ip)` | API send-otp          | Rate-limit + hash bcrypt       |
| `graduate_verify_otp(gid, code)` | API verify-otp        | Verifica hash + crea sesión    |
| `get_invitation_by_token(token)` | /invitacion/[token]   | Lee sin exponer tabla pública  |
| `get_ceremony_stats(cid)`        | Dashboard admin       | Cuenta agregada eficiente      |
| `is_staff(roles[])`              | Todas las políticas RLS| Evita recursión en políticas  |

Ventaja: las race conditions están eliminadas en la BD, no en la app.

---

## Flujo de invitaciones (end-to-end)

```
Graduando                  App (Next.js)                Supabase             Resend
   │                            │                          │                   │
   │ ingresa documento          │                          │                   │
   ├───────────────────────────▶│                          │                   │
   │                            │  POST send-otp           │                   │
   │                            ├─────────────────────────▶│                   │
   │                            │                          │ generate_otp()    │
   │                            │                          ├──────┐            │
   │                            │                          │      │ hash       │
   │                            │                          │◀─────┘            │
   │                            │  graduateId + email + code                   │
   │                            │◀─────────────────────────│                   │
   │                            │                          │                   │
   │                            │  sendEmail(otp)          │                   │
   │                            ├─────────────────────────────────────────────▶│
   │                            │                          │                   │
   │ recibe correo con OTP      │                          │                   │
   │◀───────────────────────────────────────────────────────────────────────────┤
   │                            │                          │                   │
   │ ingresa OTP                │                          │                   │
   ├───────────────────────────▶│                          │                   │
   │                            │  POST verify-otp         │                   │
   │                            ├─────────────────────────▶│                   │
   │                            │                          │ verify_otp()      │
   │                            │                          ├──────┐            │
   │                            │                          │      │ check hash │
   │                            │                          │      │ mint token │
   │                            │                          │◀─────┘            │
   │                            │  sessionToken            │                   │
   │  Set-Cookie: upb_...       │◀─────────────────────────│                   │
   │◀───────────────────────────│                          │                   │
   │                            │                          │                   │
   │ registra invitados,        │                          │                   │
   │ envía invitaciones         │  POST send-invitations   │                   │
   ├───────────────────────────▶├─────────────────────────▶│                   │
   │                            │                          │ fetch guests      │
   │                            │                          │ + ceremony info   │
   │                            │  por cada invitado:      │                   │
   │                            ├─────────────────────────────────────────────▶│
   │                            │                          │                   │
   │                            │  UPDATE guests SET       │                   │
   │                            │  status='invited'        │                   │
   │                            ├─────────────────────────▶│                   │
   │                            │                          │                   │
   │ Invitados reciben          │                          │                   │
   │ correo con link al QR      │                          │                   │
   │◀───────────────────────────────────────────────────────────────────────────┤
```

---

## Flujo del día de la ceremonia (scanner)

```
Scanner (operador)         Scanner app (PWA)          Supabase
   │                            │                         │
   │ abre la cámara             │                         │
   │ escanea QR de invitado     │                         │
   ├───────────────────────────▶│                         │
   │                            │  POST /api/qr/validate  │
   │                            │  { token: "..."  }      │
   │                            ├────────────────────────▶│
   │                            │                         │ validate_qr_token()
   │                            │                         ├──────┐
   │                            │                         │      │ LOCK row
   │                            │                         │      │ check status
   │                            │                         │      │ UPDATE → checked_in
   │                            │                         │      │ INSERT scan_event
   │                            │                         │◀─────┘
   │                            │  { result: "allowed",   │
   │                            │    guestName: "Ana..." }│
   │  ✓ "Bienvenida, Ana"       │◀────────────────────────│
   │◀───────────────────────────│                         │
```

---

## Seguridad

| Vector                              | Defensa                                              |
|-------------------------------------|------------------------------------------------------|
| Robo de QR (token sale en la URL)   | `LOCK ROW` + `status='checked_in'` atómico — solo entra una vez |
| Acceso cruzado entre graduandos     | API valida `graduate_id == session.graduateId` antes de cualquier query |
| Privilege escalation staff          | RLS basado en `is_staff(roles[])` — no se puede saltar |
| Bot inundando OTPs                  | Rate limit: 5 OTPs / 15 min por documento (en función) |
| Brute force del OTP                 | 5 intentos por sesión, después invalida              |
| Filtración de service-role key      | `"server-only"` import — Next.js falla el build si la usas en client |
| XSS en correos                      | `escapeHtml()` en todos los valores dinámicos        |
| Manipulación del audit              | Tabla append-only, sin políticas de UPDATE/DELETE    |

---

## Lo que está fuera de scope (por ahora)

- **PWA offline scanner**: el scanner abre la cámara, pero si pierde red no
  encola los escaneos. Service worker básico está en `manifest.webmanifest`
  pero no hay sync queue. Para eventos en sitios sin wifi, sería el siguiente
  trabajo.
- **QR firmado con HMAC-SHA256**: actualmente el token es un UUID aleatorio
  (256 bits de entropía, suficiente para producción). Si se quisiera evitar
  llamadas a BD para invitaciones inválidas, se podría firmar offline y
  validar firma antes de tocar BD.
- **SSO institucional**: si UPB usa Azure AD para staff, se reemplaza
  `signInWithPassword` por `signInWithSSO`. Schema + RLS no cambian.
