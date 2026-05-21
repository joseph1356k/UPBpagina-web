# Deploy — Producción en Vercel + Supabase

## Pre-requisitos

- Proyecto Supabase creado y con migraciones aplicadas (ver [`SETUP.md`](./SETUP.md))
- Dominio de Resend verificado (DKIM/SPF/DMARC ✅)
- Cuenta en https://vercel.com
- Repo conectado en GitHub: `joseph1356k/UPBpagina-web`

---

## 1. Conectar Vercel ↔ GitHub

1. https://vercel.com/new → importar `joseph1356k/UPBpagina-web`
2. Framework: **Next.js** (auto-detectado)
3. Build command: `npm run build` (default)
4. Output dir: `.next` (default)
5. No hacer click en "Deploy" todavía — primero las env vars

## 2. Variables de entorno en Vercel

**Settings → Environment Variables** → pegar las mismas que tienes en
`.env.local` pero con valores de **producción**:

| Variable                          | Scope               | Valor                              |
|-----------------------------------|---------------------|------------------------------------|
| `NEXT_PUBLIC_USE_SUPABASE`        | Production, Preview | `true`                             |
| `NEXT_PUBLIC_SUPABASE_URL`        | Production, Preview | URL del proyecto Supabase prod     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Production, Preview | anon key                           |
| `SUPABASE_SERVICE_ROLE_KEY`       | Production          | service_role ⚠ NO en Preview      |
| `RESEND_API_KEY`                  | Production          | re_xxxx                            |
| `RESEND_FROM`                     | Production          | `"UPB Ceremonias <ceremonias@upb.edu.co>"` |
| `NEXT_PUBLIC_APP_URL`             | Production          | `https://ceremonias.upb.edu.co`    |

> **Importante**: el `service_role` da poderes de root sobre la BD. Solo
> activarlo en **Production**, nunca en **Preview** (esos son URLs públicas
> de PR previews).

## 3. Deploy

Click **Deploy**. Vercel:
1. Clona el repo
2. Corre `npm install`
3. Corre `npm run build` (con typecheck + lint)
4. Sube los assets
5. ~2-3 minutos → te da la URL `xxxxx.vercel.app`

## 4. Conectar dominio institucional

Si UPB te da subdominio (recomendado: `ceremonias.upb.edu.co`):

1. **Vercel → Settings → Domains** → agregar `ceremonias.upb.edu.co`
2. Vercel te muestra el CNAME a configurar
3. Pedirle a sistemas UPB que agregue:
   ```
   ceremonias.upb.edu.co  CNAME  cname.vercel-dns.com
   ```
4. Esperar ~10 min a que propague + Vercel emite cert TLS automáticamente

## 5. Actualizar Supabase con la URL de producción

**Dashboard Supabase → Authentication → URL Configuration:**

- **Site URL**: `https://ceremonias.upb.edu.co`
- **Redirect URLs**: agregar `https://ceremonias.upb.edu.co/**`

Esto es necesario para que los magic links / auth redirects funcionen
desde producción.

## 6. Smoke test

Probar el flujo crítico end-to-end:

1. Abrir `https://ceremonias.upb.edu.co`
2. **Landing** se ve bien ✅
3. `/registro` con un documento real → ¿llega el OTP al correo? ✅
4. Verificar OTP → ¿entra al portal? ✅
5. Login como admin → ¿ve el dashboard con datos? ✅
6. Crear ceremonia de prueba → ¿persiste? ✅
7. Borrarla → ¿desaparece? ✅

## 7. Monitoreo

### Sentry (recomendado)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Sigue el wizard, pegar el DSN en Vercel como `NEXT_PUBLIC_SENTRY_DSN`.

### Logs en Supabase

**Dashboard → Logs** te muestra:
- Database queries lentas
- Errores de auth
- Llamadas a edge functions

### Logs en Vercel

**Dashboard → Logs → Runtime Logs** para errores de route handlers y proxy.

---

## Backups

Supabase Pro plan incluye:
- **Point-in-time recovery** (PITR) últimos 7 días
- Daily backups automáticos retenidos 30 días

Para ceremonias importantes:
1. Antes del evento: **Dashboard → Database → Backups → Create backup**
2. Después del evento: dejar correr automáticos

---

## Escalado

| Componente   | Plan inicial recomendado | Cuándo subir                     |
|--------------|-------------------------|----------------------------------|
| Vercel       | Pro ($20/mes)           | Si pasamos 100GB bandwidth/mes  |
| Supabase     | Pro ($25/mes)           | Si BD pasa 8GB o necesitas PITR |
| Resend       | Pro ($20/mes)           | Si superas 3,000 correos/mes    |

Para ~1000 graduandos/mes × ~3 invitados c/u = 3000 correos/mes, estamos
exactamente en el límite del free de Resend. Plan Pro es lo prudente.

---

## Rollback

Si un deploy rompe producción:

1. **Vercel → Deployments**
2. Buscar el último deploy estable (✅ verde)
3. Click **... → Promote to Production**
4. Listo en ~10 segundos (no rebuild, solo cambio de alias)

Para rollback de schema Supabase:

```bash
npx supabase db reset    # ⚠ borra y recrea — solo en dev
```

En producción, los rollbacks de schema deben ser migraciones nuevas que
reviertan los cambios. Nunca usar `db reset` en prod.
