# Setup — UPB Ceremonias

Esta guía te lleva del repo recién clonado a la app corriendo con backend real
de Supabase en ~15 minutos.

---

## Opción A — Solo el mock (sin Supabase) 🟢

Para presentaciones y demos. **No necesitas nada externo.**

```bash
npm install
npm run dev
```

→ Abrir http://localhost:3000

Los datos viven en memoria — se reinician al reiniciar el servidor. Todo el UI
funciona, los formularios validan, las tablas filtran. Es el modo por defecto.

---

## Opción B — Con Supabase real 🔵

Aquí cambiamos el mock por una base de datos real con auth, RLS, y correos.

### 1. Crear el proyecto en Supabase

1. Ir a https://supabase.com → **New project**
2. Datos:
   - **Name**: `upb-ceremonias` (o el que prefieras)
   - **Database password**: generar uno fuerte y guardar en gestor de
     contraseñas (1Password, Bitwarden). Lo necesitarás para conectarte
     vía CLI.
   - **Region**: `South America (São Paulo)` — el más cercano a Colombia.
3. Esperar ~2 minutos a que aprovisione.

### 2. Copiar las 3 keys al `.env.local`

En el dashboard de Supabase → **Settings** → **API**:

```bash
cp .env.example .env.local
```

Editar `.env.local` y pegar:

```env
NEXT_PUBLIC_USE_SUPABASE=true

NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co    # "Project URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...                # "anon public"
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...                    # "service_role" — ⚠ secreto

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Instalar Supabase CLI y aplicar el schema

**Windows (PowerShell):**

```powershell
# Una vez por máquina — instala la CLI
scoop install supabase
# o:  choco install supabase

# En la carpeta del proyecto:
npx supabase login           # te abre el navegador
npx supabase link --project-ref xxxxxx   # el "ref" sale de la URL del dashboard
npx supabase db push         # crea las 6 tablas + RLS + funciones
```

**macOS:**

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref xxxxxx
supabase db push
```

> ⚠ Si te pide la database password, es la que generaste en el paso 1.

### 4. Cargar datos de demostración (opcional, recomendado)

```bash
npx supabase db seed
```

Esto carga 3 ceremonias, 6 graduandos y 7 invitados de muestra (los mismos
del mock) para que veas la app con contenido apenas hagas login.

### 5. Crear tu primer usuario admin

Como no hay registro público (es un sistema institucional), el primer admin
se crea vía SQL Editor en el dashboard de Supabase:

1. **Dashboard** → **Authentication** → **Users** → **Add user**
2. Datos:
   - Email: `tu-correo@upb.edu.co`
   - Password: el que quieras
   - **Auto-confirm user**: ✅
3. **Create user**

Ahora dale rol de admin (SQL Editor):

```sql
INSERT INTO public.users (id, email, full_name, role, active)
SELECT id, email, 'Tu Nombre Completo', 'admin', true
FROM auth.users
WHERE email = 'tu-correo@upb.edu.co';
```

### 6. (Opcional) Resend para correos reales

Sin esto los OTPs y las invitaciones se loggean en la terminal — útil para dev.

1. https://resend.com → crear cuenta
2. **Domains** → agregar `upb.edu.co` (necesita acceso a DNS de UPB)
3. Copiar los registros DKIM + SPF + DMARC y pedirle a sistemas UPB que los
   agreguen al DNS
4. Esperar ~10 min a que verifique
5. **API Keys** → crear key y pegar en `.env.local`:

```env
RESEND_API_KEY=re_xxxxx
RESEND_FROM="UPB Ceremonias <ceremonias@upb.edu.co>"
```

### 7. Correr la app

```bash
npm run dev
```

→ http://localhost:3000

- **Landing**: pública, abierta
- **/registro**: ingresa el documento `1037612845` (Ana del seed)
  - Si Resend está configurado → revisa el correo
  - Si no → revisa la terminal donde corre `npm run dev` (verás el OTP)
- **/admin**: te redirige a `/admin/iniciar-sesion`, ingresa con tu cuenta admin
- **/scanner**: para hacer escaneos QR (autenticación pendiente)

---

## Verificar que todo funciona

```bash
npm run typecheck   # sin errores
npm run lint        # sin warnings
npm run build       # build limpio
```

---

## Solución de problemas

### "Missing env var NEXT_PUBLIC_SUPABASE_URL"
No copiaste las keys. Volver al paso 2.

### "supabase db push" falla con "permission denied"
La database password está mal. Ve a **Settings → Database** y resetéala.

### Los correos no llegan
- Verifica que el dominio está **verificado** en Resend (no solo agregado)
- Mira los logs de Resend para ver si los entregó
- Revisa spam

### "infinite recursion detected in policy"
Las políticas RLS llaman a `is_staff()` que consulta `public.users`. Si esa
tabla a su vez tiene RLS que llame `is_staff()`, se recursea. La función está
marcada `SECURITY DEFINER` precisamente para evitar esto — no la modifiques.

---

## Para producción (Vercel)

Ver [`DEPLOY.md`](./DEPLOY.md).
