"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleCheckBig,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Ceremony } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Step = "upload" | "preview" | "validate" | "confirm" | "done";

interface ParsedRow {
  rowNumber: number;
  documentType: string;
  documentNumber: string;
  studentCode: string;
  fullName: string;
  email: string;
  program: string;
  faculty: string;
  validation: "ok" | "warning" | "error";
  issue?: string;
}

/* ------------------------------------------------------------------ */
/*  Mock parser — generates a fake preview                             */
/* ------------------------------------------------------------------ */

const SAMPLE_FIRST_NAMES = [
  "María",
  "Andrés",
  "Camila",
  "Sebastián",
  "Valentina",
  "Daniel",
  "Sofía",
  "Tomás",
  "Isabella",
  "Mateo",
  "Laura",
  "Felipe",
];
const SAMPLE_LAST_NAMES = [
  "Pérez Ruiz",
  "Restrepo Mejía",
  "Gómez Arias",
  "Henao Salazar",
  "Vélez Cardona",
  "Ríos Mora",
  "Castaño Vargas",
  "Ospina Quintero",
];

function buildSampleRows(count: number): ParsedRow[] {
  const rows: ParsedRow[] = [];
  for (let i = 0; i < count; i++) {
    const first = SAMPLE_FIRST_NAMES[i % SAMPLE_FIRST_NAMES.length];
    const last = SAMPLE_LAST_NAMES[(i * 3) % SAMPLE_LAST_NAMES.length];
    const fullName = `${first} ${last}`;
    const docNum = String(1_000_000_000 + i * 47_113);
    const code = `00000${4000 + i}`.slice(-6);

    let validation: ParsedRow["validation"] = "ok";
    let issue: string | undefined;
    if (i === 3) {
      validation = "warning";
      issue = "Correo institucional con dominio inusual";
    } else if (i === 7) {
      validation = "error";
      issue = "Documento duplicado en la importación";
    } else if (i === 11) {
      validation = "warning";
      issue = "Falta el código estudiantil — se generará uno temporal";
    }

    rows.push({
      rowNumber: i + 2, // +2 because row 1 is the header
      documentType: i % 5 === 0 ? "CE" : "CC",
      documentNumber: docNum,
      studentCode: validation === "warning" && i === 11 ? "" : code,
      fullName,
      email: `${first.toLowerCase()}.${last.split(" ")[0].toLowerCase()}@upb.edu.co`,
      program:
        i % 3 === 0
          ? "Ingeniería de Sistemas"
          : i % 3 === 1
            ? "Administración de Empresas"
            : "Comunicación Social",
      faculty:
        i % 3 === 0
          ? "Facultad de Ingenierías"
          : i % 3 === 1
            ? "Facultad de Ciencias Económicas, Administrativas y Contables"
            : "Facultad de Comunicaciones",
      validation,
      issue,
    });
  }
  return rows;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  ceremonies: Ceremony[];
}

export function ImportStepper({ ceremonies }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [ceremonyId, setCeremonyId] = useState<string>(
    ceremonies.find((c) => c.status === "open")?.id ?? ceremonies[0]?.id ?? "",
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isPending, startTransition] = useTransition();

  const activeCeremony = ceremonies.find((c) => c.id === ceremonyId);
  const okCount = rows.filter((r) => r.validation === "ok").length;
  const warnCount = rows.filter((r) => r.validation === "warning").length;
  const errorCount = rows.filter((r) => r.validation === "error").length;
  const importable = okCount + warnCount;

  function handleFile(file: File) {
    const allowed = [".xlsx", ".xls", ".csv"];
    if (!allowed.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      toast.error("Formato no soportado. Usa .xlsx, .xls o .csv.");
      return;
    }
    setFileName(file.name);
    startTransition(async () => {
      // Simulate parse delay
      await new Promise((r) => setTimeout(r, 700));
      const parsed = buildSampleRows(12);
      setRows(parsed);
      setStep("preview");
    });
  }

  function handleConfirm() {
    startTransition(async () => {
      await new Promise((r) => setTimeout(r, 800));
      setStep("done");
      toast.success(`${importable} graduandos importados correctamente`);
    });
  }

  function reset() {
    setStep("upload");
    setFileName(null);
    setRows([]);
  }

  return (
    <div className="flex flex-col gap-6">
      <StepIndicator current={step} />

      {/* Upload */}
      {step === "upload" && (
        <UploadStep
          ceremonies={ceremonies}
          ceremonyId={ceremonyId}
          onCeremonyChange={setCeremonyId}
          onFile={handleFile}
          isPending={isPending}
        />
      )}

      {/* Preview */}
      {step === "preview" && (
        <PreviewStep
          fileName={fileName ?? ""}
          rows={rows}
          ceremony={activeCeremony ?? null}
          onBack={reset}
          onNext={() => setStep("validate")}
        />
      )}

      {/* Validate */}
      {step === "validate" && (
        <ValidateStep
          rows={rows}
          okCount={okCount}
          warnCount={warnCount}
          errorCount={errorCount}
          onBack={() => setStep("preview")}
          onNext={() => setStep("confirm")}
        />
      )}

      {/* Confirm */}
      {step === "confirm" && (
        <ConfirmStep
          ceremony={activeCeremony ?? null}
          importable={importable}
          rejected={errorCount}
          isPending={isPending}
          onBack={() => setStep("validate")}
          onConfirm={handleConfirm}
        />
      )}

      {/* Done */}
      {step === "done" && (
        <DoneStep
          importable={importable}
          ceremony={activeCeremony ?? null}
          onAnother={reset}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step indicator                                                     */
/* ------------------------------------------------------------------ */

const STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "Cargar archivo" },
  { key: "preview", label: "Previsualizar" },
  { key: "validate", label: "Validar" },
  { key: "confirm", label: "Confirmar" },
];

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = current === "done" ? STEPS.length : STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="flex items-center gap-2 overflow-x-auto">
      {STEPS.map((s, i) => {
        const isDone = i < currentIdx || current === "done";
        const isCurrent = i === currentIdx;
        return (
          <li key={s.key} className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-[0.72rem] font-semibold transition-colors",
                isDone
                  ? "bg-primary text-primary-foreground"
                  : isCurrent
                    ? "bg-primary/15 text-primary ring-2 ring-primary/30"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {isDone ? <CheckCircle2 className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                isCurrent
                  ? "text-foreground"
                  : isDone
                    ? "text-foreground/70"
                    : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <span aria-hidden className="h-px w-6 bg-border md:w-10" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/*  Upload step                                                        */
/* ------------------------------------------------------------------ */

function UploadStep({
  ceremonies,
  ceremonyId,
  onCeremonyChange,
  onFile,
  isPending,
}: {
  ceremonies: Ceremony[];
  ceremonyId: string;
  onCeremonyChange: (id: string) => void;
  onFile: (file: File) => void;
  isPending: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Paso 1
          </p>
          <h2 className="mt-1 font-serif text-lg font-semibold text-foreground">
            ¿Para qué ceremonia importas?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Los graduandos del archivo se asignarán automáticamente a esta
            ceremonia.
          </p>
          <Select
            value={ceremonyId}
            onValueChange={(v) => onCeremonyChange(String(v ?? ""))}
          >
            <SelectTrigger className="mt-3 h-9 w-full">
              <SelectValue placeholder="Seleccionar ceremonia" />
            </SelectTrigger>
            <SelectContent>
              {ceremonies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) onFile(f);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed bg-muted/30 px-5 py-12 text-center transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-muted/50",
            isPending && "pointer-events-none opacity-60",
          )}
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            disabled={isPending || !ceremonyId}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Upload className="size-5" />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">
              {isPending
                ? "Procesando archivo…"
                : "Arrastra el archivo aquí o haz click para seleccionar"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Excel (.xlsx, .xls) o CSV. Máximo 5 MB.
            </p>
          </div>
        </label>
      </div>

      <aside className="space-y-3 rounded-xl border border-border bg-muted/20 p-5 text-sm">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Columnas esperadas
        </p>
        <ul className="space-y-1.5 text-foreground">
          {[
            "Tipo de documento (CC / CE / TI / PP)",
            "Número de documento",
            "Código estudiantil",
            "Nombre completo",
            "Correo institucional",
            "Programa",
            "Facultad",
          ].map((c) => (
            <li key={c} className="flex gap-1.5">
              <span aria-hidden className="text-primary">·</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <Separator />
        <p className="text-xs leading-relaxed text-muted-foreground">
          El sistema detecta automáticamente los encabezados. Las columnas
          extra se ignoran. Las filas vacías se descartan.
        </p>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Preview step                                                       */
/* ------------------------------------------------------------------ */

function PreviewStep({
  fileName,
  rows,
  ceremony,
  onBack,
  onNext,
}: {
  fileName: string;
  rows: ParsedRow[];
  ceremony: Ceremony | null;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="size-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">{fileName}</p>
            <p className="text-xs text-muted-foreground">
              {rows.length} filas detectadas · destino:{" "}
              <span className="text-foreground">{ceremony?.name}</span>
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <X className="size-3.5" />
          Cambiar archivo
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 pl-4">#</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Documento</TableHead>
              <TableHead className="hidden md:table-cell">Código</TableHead>
              <TableHead className="hidden lg:table-cell">Programa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.rowNumber}>
                <TableCell className="pl-4 text-xs text-muted-foreground tabular-nums">
                  {r.rowNumber}
                </TableCell>
                <TableCell>
                  <p className="font-medium text-foreground">{r.fullName}</p>
                  <p className="text-xs text-muted-foreground">{r.email}</p>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground tabular-nums sm:table-cell">
                  {r.documentType} {r.documentNumber}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground tabular-nums md:table-cell">
                  {r.studentCode || "—"}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                  {r.program}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-3.5" />
          Anterior
        </Button>
        <Button onClick={onNext}>
          Validar datos
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Validate step                                                      */
/* ------------------------------------------------------------------ */

function ValidateStep({
  rows,
  okCount,
  warnCount,
  errorCount,
  onBack,
  onNext,
}: {
  rows: ParsedRow[];
  okCount: number;
  warnCount: number;
  errorCount: number;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          tone="success"
          icon={<CheckCircle2 className="size-4" />}
          label="Sin observaciones"
          value={okCount}
        />
        <SummaryCard
          tone="warning"
          icon={<AlertTriangle className="size-4" />}
          label="Advertencias"
          value={warnCount}
          hint="Se importan, revisa el detalle"
        />
        <SummaryCard
          tone="danger"
          icon={<X className="size-4" />}
          label="Errores"
          value={errorCount}
          hint="No se importarán"
        />
      </div>

      {/* Rows with issues */}
      {(warnCount > 0 || errorCount > 0) && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-medium text-foreground">
              Filas que requieren atención
            </h3>
          </div>
          <ul className="divide-y divide-border">
            {rows
              .filter((r) => r.validation !== "ok")
              .map((r) => (
                <li
                  key={r.rowNumber}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                      r.validation === "error"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/15 text-warning",
                    )}
                  >
                    {r.validation === "error" ? (
                      <X className="size-3.5" />
                    ) : (
                      <AlertTriangle className="size-3.5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      Fila {r.rowNumber} ·{" "}
                      <span className="text-muted-foreground">
                        {r.fullName}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">{r.issue}</p>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-3.5" />
          Anterior
        </Button>
        <Button onClick={onNext} disabled={okCount + warnCount === 0}>
          Continuar a confirmación
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({
  tone,
  icon,
  label,
  value,
  hint,
}: {
  tone: "success" | "warning" | "danger";
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
}) {
  const toneClasses = {
    success: "bg-success/10 text-success ring-success/20",
    warning: "bg-warning/15 text-warning ring-warning/25",
    danger: "bg-destructive/10 text-destructive ring-destructive/20",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-full ring-1 ring-inset",
            toneClasses[tone],
          )}
        >
          {icon}
        </span>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 font-serif text-2xl font-semibold text-foreground tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Confirm step                                                       */
/* ------------------------------------------------------------------ */

function ConfirmStep({
  ceremony,
  importable,
  rejected,
  isPending,
  onBack,
  onConfirm,
}: {
  ceremony: Ceremony | null;
  importable: number;
  rejected: number;
  isPending: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Resumen de la importación
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirma para crear los registros de graduandos. Esta acción se
          puede revertir desde el log de auditoría.
        </p>
        <Separator className="my-4" />
        <div className="space-y-2 text-sm">
          <Row label="Ceremonia" value={ceremony?.name ?? "—"} />
          <Row label="Campus" value={ceremony?.campus ?? "—"} />
          <Row
            label="Registros a importar"
            value={`${importable} graduandos`}
          />
          {rejected > 0 && (
            <Row
              label="Registros rechazados"
              value={`${rejected} (no se importarán)`}
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onBack} disabled={isPending}>
          <ArrowLeft className="size-3.5" />
          Anterior
        </Button>
        <Button onClick={onConfirm} disabled={isPending || importable === 0}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Importando…
            </>
          ) : (
            <>
              <CircleCheckBig className="size-4" />
              Confirmar e importar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <p className="text-muted-foreground">{label}</p>
      <p className="text-right font-medium text-foreground">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Done step                                                          */
/* ------------------------------------------------------------------ */

function DoneStep({
  importable,
  ceremony,
  onAnother,
}: {
  importable: number;
  ceremony: Ceremony | null;
  onAnother: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-success/30 bg-success/5 px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckCircle2 className="size-7" />
      </div>
      <div>
        <h2 className="font-serif text-xl font-semibold text-foreground">
          Importación completada
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Se crearon{" "}
          <strong className="text-foreground">{importable} graduandos</strong>{" "}
          en{" "}
          <span className="text-foreground">{ceremony?.name}</span>.
        </p>
      </div>
      <Button onClick={onAnother} variant="outline" className="mt-2">
        Importar otro archivo
      </Button>
    </div>
  );
}
