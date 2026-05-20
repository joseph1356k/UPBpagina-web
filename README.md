# UPB Ceremonias — Plataforma web

Plataforma institucional de la Universidad Pontificia Bolivariana para el registro y validación de invitados en ceremonias de grado.

Esta es la **Sección 1 — Fundaciones del producto** de la hoja de ruta. Aún no hay backend conectado: todos los datos vienen de un mock local que simula la futura llamada a Supabase, sin cambiar la firma de las funciones.

## Stack

- **Next.js 16** (App Router, Turbopack por defecto, route props helpers)
- **React 19**
- **TypeScript** estricto
- **Tailwind CSS 4** — configuración CSS-first via `@theme` en `app/globals.css`
- **shadcn/ui** preset `base-nova` (componentes instalados localmente, basados en `@base-ui/react`)
- **lucide-react** iconografía
- **sonner** toasts
- **next-themes** (modo claro forzado por ahora; dark preparado para V2)

## Cómo correr

```bash
npm install        # (ya hecho durante scaffold)
npm run dev        # http://localhost:3000
```

### Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con Turbopack |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint flat config |
| `npm run typecheck` | TypeScript sin emitir |

## Rutas disponibles

| URL | Contenido | Estado |
|---|---|---|
| `/` | Landing institucional | ✅ Terminada |
| `/registro` | Validación del graduando | 🚧 Placeholder (Sección 2) |
| `/portal` | Workspace del graduando | 🚧 Placeholder (Sección 3) |
| `/admin` | Dashboard con KPIs sobre mock | ✅ Terminada |
| `/admin/*` | Resto de admin | 🚧 Placeholder (Secciones 4-6) |
| `/scanner` | Escáner de ingreso | 🚧 Placeholder (Sección 6) |
| `/dev/components` | Showcase del design system | ✅ Solo desarrollo |
| `/404` | Página no encontrada | ✅ Terminada |

## Estructura

```
app/
  layout.tsx                  Root: fonts, theme, toaster, tooltip provider
  globals.css                 Tailwind 4 + tokens UPB (light + dark)
  not-found.tsx               404 institucional
  (public)/
    layout.tsx                Header público + footer
    page.tsx                  Landing
    registro/                 Placeholder
  (graduate)/
    layout.tsx                Header compacto del graduando
    portal/                   Placeholder
  (admin)/
    layout.tsx                Sidebar + topbar responsive
    admin/page.tsx            Dashboard real con mock
  (scanner)/
    layout.tsx                Layout fullscreen oscuro (kiosko)
    scanner/                  Placeholder
  dev/components/             Showcase del design system

components/
  ui/                         Primitivos shadcn (button, card, dialog, ...)
  shared/                     BrandMark, PageHeader, EmptyState, StatCard,
                              StatusBadge, ComingSoon
  admin/                      Sidebar, topbar, definición de navegación
  public/                     Header y footer del sitio público
  graduate/                   Header del workspace del graduando
  theme-provider.tsx          Wrapper de next-themes

lib/
  types.ts                    Entidades + status enums (espejo del schema futuro)
  constants.ts                Etiquetas, rutas, metadata producto
  format.ts                   Formatters es-CO (fechas, números, relativos)
  utils.ts                    cn() helper (shadcn)
  mock/
    index.ts                  API mock pública (async, simula latencia)
    _helpers.ts               Pools de nombres, generadores deterministas
    ceremonies.ts             3 ceremonias seed
    graduates.ts              50 graduandos seed
    guests.ts                 ~100 invitados generados
    users.ts                  Admins + scanners
    scan-events.ts            ~90 eventos generados
    audit-log.ts              20 entradas hardcoded
```

## Decisiones de diseño

- **Color**: verde institucional UPB como primario (`oklch(0.42 0.115 152)`), neutrales fríos para superficies, ámbar para acentos. Todo vía tokens semánticos en `globals.css` — cambiar la paleta es editar un archivo.
- **Tipografía**: **Inter** para UI, **Source Serif 4** para titulares (`.font-serif` / `.font-heading`).
- **Radios y sombras**: sutiles. Variable `--radius` controla la escala.
- **Layouts por área**: cada sección (`public`, `graduate`, `admin`, `scanner`) tiene su propio shell vía route groups (`(public)`, `(admin)`, ...). El admin tiene sidebar persistente en desktop y Sheet en mobile.
- **Mock data**: la API de `lib/mock/` devuelve Promises y tiene la **misma firma** que tendrá la futura API contra Supabase. El día que conectemos backend solo cambia `lib/mock/index.ts`; los componentes no se tocan.
- **Modo oscuro**: preparado en CSS (`.dark`) pero no expuesto en UI por ahora — UPB suele preferir luz para presentaciones institucionales.

## Hoja de ruta

Esta es la **Sección 1 de 6**:

1. **Fundaciones del producto** ✅ ← estás aquí
2. Experiencia pública del graduando (landing + OTP)
3. Workspace del graduando (gestión de invitados)
4. Panel Administrador — núcleo (ceremonias, graduandos, invitados)
5. Importación, invitaciones y QR
6. Escáner PWA, auditoría y reportes

Luego viene la fase B (backend real con Supabase + Resend + QR firmado) y la fase C (n8n para automatizaciones laterales).

## Conexión futura con Supabase

La intención de diseño:

- `lib/mock/index.ts` se reemplaza por queries a Supabase usando el cliente server-side.
- Los **shapes** de las funciones (`getCeremonies`, `getGraduateByDocument`, `getCeremonyStats`, etc.) **no cambian** — solo la implementación.
- Los `types.ts` ya reflejan el schema futuro (tablas `ceremonies`, `graduates`, `guests`, `users`, `scan_events`, `audit_log`).
- Row Level Security se configurará para que cada graduando solo vea sus propios invitados, scanners solo lo necesario para validar, admins todo.

## Notas

- Si se prefiere mover el proyecto al raíz del workspace, hay que renombrarlo en `package.json` (npm rechaza nombres con espacios y mayúsculas — por eso vive en `web/`).
- El logo es un monograma textual; cuando UPB entregue el SVG oficial, se reemplaza en `components/shared/brand-mark.tsx` sin tocar nada más.
