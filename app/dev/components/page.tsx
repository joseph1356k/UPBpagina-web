import {
  CalendarCheck,
  CheckCircle2,
  GraduationCap,
  Inbox,
  QrCode,
  ScanLine,
  Search,
} from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";
import { ComingSoon } from "@/components/shared/coming-soon";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import {
  CeremonyStatusBadge,
  GraduateStatusBadge,
  GuestStatusBadge,
  ScanResultBadge,
} from "@/components/shared/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/lib/constants";

export const metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

export default function DevComponentsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <BrandMark size="md" />
          <Separator orientation="vertical" className="h-6" />
          <p className="text-sm font-medium">Design System</p>
          <span className="ml-auto rounded-full bg-warning/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-warning-foreground">
            Solo desarrollo
          </span>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-12">
        <PageHeader
          eyebrow="Referencia interna"
          title="Sistema de diseño UPB Ceremonias"
          description="Showcase de todos los primitivos y composites. Lo que ves aquí es exactamente lo que está disponible para construir las secciones siguientes."
        />

        <Section
          title="Tipografía"
          description="Inter para UI, Source Serif 4 para titulares. Variantes y pesos disponibles."
        >
          <div className="space-y-3">
            <p className="font-serif text-5xl font-semibold tracking-tight">
              Serif Display · 5xl
            </p>
            <p className="font-serif text-3xl font-semibold tracking-tight">
              Serif H1 · 3xl
            </p>
            <p className="font-serif text-2xl font-medium">
              Serif H2 · 2xl
            </p>
            <p className="text-base">
              Sans body · base — Esta es la tipografía de párrafo. Tiene 1.5 de
              line-height y un peso normal.
            </p>
            <p className="text-sm text-muted-foreground">
              Sans muted · sm — Texto secundario o metadata.
            </p>
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Eyebrow · 0.72rem
            </p>
            <p className="font-mono text-sm">Monospace · sm — para tokens, ids, código.</p>
          </div>
        </Section>

        <Section
          title="Paleta semántica"
          description="Tokens en CSS variables. Cambiar el verde UPB es un solo archivo."
        >
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {SWATCHES.map((s) => (
              <div
                key={s.name}
                className="overflow-hidden rounded-lg border border-border"
              >
                <div className={`h-14 ${s.bg}`} />
                <div className="bg-card px-3 py-2">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {s.token}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Botones"
          description="Variantes y tamaños del primitivo `Button`."
        >
          <div className="space-y-5">
            <Row label="Variantes">
              <Button>Primario</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secundario</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructivo</Button>
              <Button variant="link">Enlace</Button>
            </Row>
            <Row label="Tamaños">
              <Button size="xs">XS</Button>
              <Button size="sm">SM</Button>
              <Button>Default</Button>
              <Button size="lg">LG</Button>
            </Row>
            <Row label="Con iconos">
              <Button>
                <QrCode className="size-4" />
                Generar QR
              </Button>
              <Button variant="outline">
                <Search className="size-4" />
                Buscar
              </Button>
              <Button variant="ghost" size="icon">
                <Search className="size-4" />
              </Button>
            </Row>
            <Row label="Estados">
              <Button disabled>Deshabilitado</Button>
              <Button asChild>
                <Link href={ROUTES.home}>Como Link</Link>
              </Button>
            </Row>
          </div>
        </Section>

        <Section
          title="Inputs y formularios"
          description="Primitivos para los formularios de las secciones 2, 3 y 4."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc">Documento</Label>
              <Input
                id="doc"
                placeholder="Ej. 1.020.456.789"
                inputMode="numeric"
              />
              <p className="text-xs text-muted-foreground">
                Cédula de ciudadanía sin puntos ni espacios.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="program">Programa</Label>
              <Select>
                <SelectTrigger id="program">
                  <SelectValue placeholder="Selecciona un programa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ing-sistemas">
                    Ingeniería de Sistemas
                  </SelectItem>
                  <SelectItem value="ing-civil">Ingeniería Civil</SelectItem>
                  <SelectItem value="adm-empresas">
                    Administración de Empresas
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="notes">Notas adicionales</Label>
              <Textarea
                id="notes"
                placeholder="Información adicional para el coordinador..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-3">
              <Checkbox id="terms" defaultChecked />
              <Label htmlFor="terms" className="text-sm font-normal">
                Acepto el tratamiento de datos (Ley 1581/2012)
              </Label>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="notif" className="text-sm font-normal">
                Recibir recordatorio por correo
              </Label>
              <Switch id="notif" defaultChecked />
            </div>
          </div>
        </Section>

        <Section
          title="Estados (status badges)"
          description="Badges mapeados a cada enum de estado."
        >
          <div className="space-y-4">
            <Row label="Ceremonia">
              <CeremonyStatusBadge status="draft" showDot />
              <CeremonyStatusBadge status="open" showDot />
              <CeremonyStatusBadge status="closed" showDot />
              <CeremonyStatusBadge status="in_progress" showDot />
              <CeremonyStatusBadge status="completed" showDot />
            </Row>
            <Row label="Graduando">
              <GraduateStatusBadge status="eligible" showDot />
              <GraduateStatusBadge status="registered" showDot />
              <GraduateStatusBadge status="completed" showDot />
              <GraduateStatusBadge status="not_eligible" showDot />
            </Row>
            <Row label="Invitado">
              <GuestStatusBadge status="pending" showDot />
              <GuestStatusBadge status="invited" showDot />
              <GuestStatusBadge status="checked_in" showDot />
              <GuestStatusBadge status="revoked" showDot />
            </Row>
            <Row label="Escaneo">
              <ScanResultBadge result="allowed" showDot />
              <ScanResultBadge result="denied" showDot />
            </Row>
            <Row label="Badges base">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secundario</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructivo</Badge>
              <Badge variant="ghost">Ghost</Badge>
            </Row>
          </div>
        </Section>

        <Section
          title="KPI cards"
          description="StatCard con variantes de acento."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Graduandos"
              value="50"
              hint="3 ceremonias"
              icon={GraduationCap}
              accent="info"
              trend={{ label: "+9", direction: "up" }}
            />
            <StatCard
              label="QRs activos"
              value="108"
              hint="93% del cupo"
              icon={QrCode}
              accent="primary"
            />
            <StatCard
              label="Ingresos"
              value="76"
              hint="Última ceremonia"
              icon={CheckCircle2}
              accent="success"
            />
            <StatCard
              label="Próxima"
              value="19 jun"
              hint="Auditorio principal"
              icon={CalendarCheck}
              accent="neutral"
            />
          </div>
        </Section>

        <Section
          title="Cards y composición"
          description="Card primitivo con su patrón Header / Content."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Card básico</CardTitle>
                <CardDescription>
                  Un card simple con descripción.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Contenido del card. Usa `font-heading` el título
                  automáticamente y respeta los tokens del tema.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Card con acción</CardTitle>
                    <CardDescription>Estado: registrado</CardDescription>
                  </div>
                  <GraduateStatusBadge status="registered" showDot />
                </div>
              </CardHeader>
              <CardContent className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  Ver detalle
                </Button>
                <Button size="sm">Editar</Button>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section
          title="Alertas"
          description="Mensajes inline (forms, panels admin)."
        >
          <div className="space-y-3">
            <Alert>
              <AlertTitle>Importación validada</AlertTitle>
              <AlertDescription>
                Se procesaron 18 graduandos sin errores.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertTitle>Cupo excedido</AlertTitle>
              <AlertDescription>
                Este graduando ya tiene 4 invitados registrados.
              </AlertDescription>
            </Alert>
          </div>
        </Section>

        <Section
          title="Empty states"
          description="Estado vacío para tablas y secciones sin datos."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <EmptyState
              icon={Inbox}
              title="Sin invitaciones aún"
              description="Cuando registres a tus invitados, las verás aquí con su estado."
              action={<Button size="sm">Agregar invitado</Button>}
            />
            <EmptyState
              icon={ScanLine}
              title="Sin escaneos recientes"
              description="Los ingresos aparecerán aquí en tiempo real durante la ceremonia."
            />
          </div>
        </Section>

        <Section
          title="Tablas"
          description="Tabla simple para listas."
        >
          <Card className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Graduando</TableHead>
                  <TableHead>Programa</TableHead>
                  <TableHead>Cupo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SAMPLE_ROWS.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.program}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {row.used}/{row.max}
                    </TableCell>
                    <TableCell>
                      <GraduateStatusBadge status={row.status} showDot />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Section>

        <Section
          title="Coming soon"
          description="Placeholder para secciones aún no construidas."
        >
          <ComingSoon
            section="Sección 5"
            title="Importación y QR (ejemplo)"
            description="Así se ve el placeholder que usaremos mientras una sección no esté lista."
            bullets={[
              "Wizard de importación en pasos",
              "Plantilla de invitación con preview",
              "Vista pública de QR firmado",
            ]}
            primaryAction={{ label: "Volver", href: ROUTES.home }}
          />
        </Section>

        <Section
          title="Brand mark"
          description="Variantes del logotipo del producto."
        >
          <div className="flex flex-wrap items-center gap-8">
            <BrandMark size="sm" />
            <BrandMark size="md" />
            <BrandMark size="lg" />
            <BrandMark size="md" variant="mark-only" />
          </div>
        </Section>

        <footer className="border-t border-border pt-8 text-sm text-muted-foreground">
          <p>
            Esta página es solo para desarrollo. Si necesitas un componente que
            no está aquí, agrégalo a `components/shared/` y refleja la muestra
            en este archivo.
          </p>
        </footer>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const SWATCHES = [
  { name: "Background", token: "--background", bg: "bg-background ring-1 ring-inset ring-border" },
  { name: "Surface", token: "--brand-surface", bg: "bg-brand-surface ring-1 ring-inset ring-border" },
  { name: "Primary UPB", token: "--primary", bg: "bg-primary" },
  { name: "Foreground", token: "--foreground", bg: "bg-foreground" },
  { name: "Muted", token: "--muted", bg: "bg-muted" },
  { name: "Accent", token: "--accent", bg: "bg-accent" },
  { name: "Success", token: "--success", bg: "bg-success" },
  { name: "Warning", token: "--warning", bg: "bg-warning" },
  { name: "Info", token: "--info", bg: "bg-info" },
  { name: "Destructive", token: "--destructive", bg: "bg-destructive" },
  { name: "Gold accent", token: "--brand-gold", bg: "bg-brand-gold" },
  { name: "Border", token: "--border", bg: "bg-border" },
];

const SAMPLE_ROWS: Array<{
  name: string;
  program: string;
  used: number;
  max: number;
  status: "eligible" | "registered" | "completed" | "not_eligible";
}> = [
  {
    name: "Mariana López Restrepo",
    program: "Ingeniería de Sistemas",
    used: 4,
    max: 4,
    status: "registered",
  },
  {
    name: "Sergio Henao Vargas",
    program: "Ingeniería Civil",
    used: 0,
    max: 4,
    status: "eligible",
  },
  {
    name: "Catalina Mejía Ríos",
    program: "Medicina",
    used: 4,
    max: 4,
    status: "completed",
  },
  {
    name: "Diego Cárdenas Ospina",
    program: "Administración de Empresas",
    used: 0,
    max: 3,
    status: "not_eligible",
  },
];

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6">
      <p className="w-28 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
