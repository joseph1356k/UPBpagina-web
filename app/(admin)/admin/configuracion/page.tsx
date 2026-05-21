import {
  Building2,
  Globe2,
  Mail,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PRODUCT } from "@/lib/constants";

export const metadata = {
  title: "Configuración — Panel administrador",
};

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Panel administrador"
        title="Configuración"
        description="Parámetros institucionales y comportamiento global de la plataforma. Estos valores aplican a todas las ceremonias salvo que indiques lo contrario."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <Building2 className="size-4" />
              </span>
              <CardTitle className="text-base">Institución</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Nombre" value={PRODUCT.institution} />
            <Row label="Producto" value={PRODUCT.name} />
            <Row label="Idioma por defecto" value="Español (es-CO)" />
            <Row label="Zona horaria" value="America/Bogota" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <Mail className="size-4" />
              </span>
              <CardTitle className="text-base">Correos transaccionales</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Proveedor" value="Resend (pendiente)" />
            <Row label="Dominio remitente" value="ceremonias@upb.edu.co" />
            <Row label="Plantilla por defecto" value="Invitación oficial UPB" />
            <Separator />
            <ToggleRow
              label="Reenvío automático tras 48 h"
              hint="Si un invitado no abre el correo, se le reenvía automáticamente."
              defaultChecked
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <ShieldCheck className="size-4" />
              </span>
              <CardTitle className="text-base">Seguridad de QR</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Firma" value="HMAC-SHA256 (pendiente backend)" />
            <Row label="Ventana de validez" value="±30 minutos de la ceremonia" />
            <Row label="Reintentos antes de bloqueo" value="3 intentos" />
            <ToggleRow
              label="Aceptar reingreso del mismo QR"
              hint="Útil para zonas con doble verificación en el evento."
              defaultChecked={false}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <Smartphone className="size-4" />
              </span>
              <CardTitle className="text-base">Escáner PWA</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Instalable en celulares" value="Sí (Android e iOS)" />
            <Row label="Modo sin conexión" value="V2 — pendiente" />
            <ToggleRow
              label="Sonido al validar"
              hint="Tono distinto para permitido / rechazado."
              defaultChecked
            />
            <ToggleRow
              label="Vibración"
              hint="Solo en dispositivos compatibles."
              defaultChecked
            />
          </CardContent>
        </Card>
      </div>

      {/* Roadmap teaser */}
      <Card className="border-primary/15 bg-primary/4">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"
          >
            <Sparkles className="size-4" />
          </span>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">Próximamente</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Integración real con Supabase, Resend para correos, automatizaciones
              con n8n y exportación nocturna a Google Sheets.
            </p>
          </div>
          <Globe2 className="hidden size-5 text-primary/40 sm:block" />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-muted-foreground">{label}</p>
      <p className="text-right font-medium text-foreground">{value}</p>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  defaultChecked,
}: {
  label: string;
  hint?: string;
  defaultChecked: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 pt-1">
      <div className="flex-1">
        <p className="font-medium text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch defaultChecked={defaultChecked} disabled />
    </div>
  );
}
