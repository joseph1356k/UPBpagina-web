"use client";

import { useState, useTransition } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DOCUMENT_TYPE_LABEL,
  GRADUATE_STATUS_LABEL,
  GUEST_STATUS_LABEL,
  SCAN_DENIED_REASON_LABEL,
  SCAN_RESULT_LABEL,
} from "@/lib/constants";
import { formatDateTime, formatDateShort } from "@/lib/format";
import type { Ceremony, Graduate } from "@/lib/types";
import type { GuestAdminRow, ScanEventRow } from "@/lib/data";

type ReportKey = "graduates" | "guests" | "scans" | "summary";

interface Props {
  ceremonies: Ceremony[];
  graduates: Graduate[];
  guests: GuestAdminRow[];
  scans: ScanEventRow[];
}

const REPORTS: { key: ReportKey; label: string; description: string }[] = [
  {
    key: "graduates",
    label: "Graduandos",
    description: "Listado completo con datos personales y estado.",
  },
  {
    key: "guests",
    label: "Invitados",
    description: "Listado con graduando asociado y estado de invitación.",
  },
  {
    key: "scans",
    label: "Escaneos",
    description: "Registros de ingreso (permitidos y rechazados).",
  },
  {
    key: "summary",
    label: "Resumen por ceremonia",
    description: "Métricas agregadas: graduandos, invitados, ingresos.",
  },
];

export function ReportsPanel({
  ceremonies,
  graduates,
  guests,
  scans,
}: Props) {
  const [ceremonyId, setCeremonyId] = useState("");
  const [isPending, startTransition] = useTransition();

  function ceremonyMatches(cId: string): boolean {
    return !ceremonyId || cId === ceremonyId;
  }

  function exportReport(key: ReportKey) {
    startTransition(async () => {
      await new Promise((r) => setTimeout(r, 400));
      let csv = "";
      let filename = "";

      const cerName = ceremonyId
        ? ceremonies.find((c) => c.id === ceremonyId)?.name ?? "todas"
        : "todas";
      const slug = (s: string) =>
        s
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

      if (key === "graduates") {
        const filtered = graduates.filter((g) => ceremonyMatches(g.ceremonyId));
        csv = toCSV(
          [
            "Documento",
            "Tipo doc",
            "Código",
            "Nombre completo",
            "Correo",
            "Programa",
            "Facultad",
            "Estado",
            "Cupos",
          ],
          filtered.map((g) => [
            g.documentNumber,
            DOCUMENT_TYPE_LABEL[g.documentType],
            g.studentCode,
            g.fullName,
            g.email,
            g.program,
            g.faculty,
            GRADUATE_STATUS_LABEL[g.status],
            String(g.maxGuests),
          ]),
        );
        filename = `graduandos-${slug(cerName)}.csv`;
      } else if (key === "guests") {
        const filtered = guests.filter((g) => ceremonyMatches(g.ceremonyId));
        csv = toCSV(
          [
            "Nombre invitado",
            "Documento",
            "Correo",
            "Relación",
            "Graduando",
            "Ceremonia",
            "Estado",
            "Enviado",
            "Ingreso",
          ],
          filtered.map((g) => [
            g.fullName,
            g.documentNumber ?? "",
            g.email ?? "",
            g.relationship ?? "",
            g.graduateName,
            g.ceremonyName,
            GUEST_STATUS_LABEL[g.status],
            g.invitedAt ? formatDateTime(g.invitedAt) : "",
            g.checkedInAt ? formatDateTime(g.checkedInAt) : "",
          ]),
        );
        filename = `invitados-${slug(cerName)}.csv`;
      } else if (key === "scans") {
        // ScanEvents don't carry ceremonyId directly, but we joined ceremonyName
        const filtered = ceremonyId
          ? scans.filter(
              (s) =>
                s.ceremonyName ===
                ceremonies.find((c) => c.id === ceremonyId)?.name,
            )
          : scans;
        csv = toCSV(
          [
            "Resultado",
            "Motivo",
            "Invitado",
            "Graduando",
            "Ceremonia",
            "Operador",
            "Fecha",
          ],
          filtered.map((s) => [
            SCAN_RESULT_LABEL[s.result],
            s.reason ? SCAN_DENIED_REASON_LABEL[s.reason] : "",
            s.guestName ?? "",
            s.graduateName ?? "",
            s.ceremonyName ?? "",
            s.scannedByName,
            formatDateTime(s.scannedAt),
          ]),
        );
        filename = `escaneos-${slug(cerName)}.csv`;
      } else {
        // summary
        const filteredCer = ceremonyId
          ? ceremonies.filter((c) => c.id === ceremonyId)
          : ceremonies;
        const rows = filteredCer.map((c) => {
          const cg = graduates.filter((g) => g.ceremonyId === c.id);
          const gids = new Set(cg.map((g) => g.id));
          const cgu = guests.filter(
            (g) =>
              (g.graduateId != null && gids.has(g.graduateId)) ||
              g.ceremonyId === c.id,
          );
          const checkedIn = cgu.filter((g) => g.status === "checked_in").length;
          const invited = cgu.filter(
            (g) => g.status === "invited" || g.status === "checked_in",
          ).length;
          return [
            c.name,
            formatDateShort(c.date),
            String(cg.length),
            String(
              cg.filter(
                (g) => g.status === "registered" || g.status === "completed",
              ).length,
            ),
            String(cgu.length),
            String(invited),
            String(checkedIn),
          ];
        });
        csv = toCSV(
          [
            "Ceremonia",
            "Fecha",
            "Graduandos",
            "Registrados",
            "Invitados totales",
            "Invitaciones enviadas",
            "Ingresos",
          ],
          rows,
        );
        filename = `resumen-${slug(cerName)}.csv`;
      }

      downloadCSV(csv, filename);
      toast.success("Reporte descargado");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Filter */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex-1 min-w-52">
          <label className="mb-1.5 block text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground">
            Filtrar por ceremonia
          </label>
          <Select
            value={ceremonyId || "all"}
            onValueChange={(v) =>
              setCeremonyId(v == null || v === "all" ? "" : v)
            }
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Todas las ceremonias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ceremonias</SelectItem>
              {ceremonies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          Los reportes se exportan como CSV (compatible con Excel y Google
          Sheets).
        </p>
      </div>

      {/* Report cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <Card key={r.key} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15"
                >
                  <FileSpreadsheet className="size-4" />
                </span>
                <CardTitle className="text-base">{r.label}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{r.description}</p>
              <Button
                onClick={() => exportReport(r.key)}
                disabled={isPending}
                size="sm"
                variant="outline"
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Generando…
                  </>
                ) : (
                  <>
                    <Download className="size-3.5" />
                    Descargar CSV
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CSV helpers                                                        */
/* ------------------------------------------------------------------ */

function escapeCSV(v: string): string {
  if (/[",\n\r]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function toCSV(headers: string[], rows: string[][]): string {
  const lines = [headers.map(escapeCSV).join(",")];
  for (const row of rows) {
    lines.push(row.map((v) => escapeCSV(v ?? "")).join(","));
  }
  return "﻿" + lines.join("\r\n"); // BOM for Excel UTF-8
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
