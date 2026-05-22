"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  createCeremony,
  updateCeremony,
  type CreateCeremonyInput,
} from "@/lib/data";
import type { Ceremony, CeremonyStatus } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Types & validation                                                 */
/* ------------------------------------------------------------------ */

type Fields = {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  campus: string;
  faculty: string;
  status: CeremonyStatus;
  maxGuestsDefault: string;
  registrationClosesAt: string;
};

type FieldErrors = Partial<Record<keyof Fields, string>>;

const FACULTIES = [
  "Facultad de Ingenierías",
  "Facultad de Ciencias Económicas, Administrativas y Contables",
  "Facultad de Ciencias de la Salud",
  "Facultad de Arquitectura y Diseño",
  "Facultad de Derecho y Ciencias Políticas",
  "Facultad de Teología",
  "Facultad de Ciencias Básicas",
  "Escuela de Ingeniería de Antioquia",
] as const;

const CAMPUSES = [
  "Medellín",
  "Bucaramanga",
  "Bogotá",
  "Montería",
  "Palmira",
] as const;

const STATUS_OPTIONS: { value: CeremonyStatus; label: string }[] = [
  { value: "draft", label: "Borrador" },
  { value: "open", label: "Registro abierto" },
  { value: "closed", label: "Registro cerrado" },
  { value: "in_progress", label: "En curso" },
  { value: "completed", label: "Finalizada" },
];

function validate(f: Fields): FieldErrors {
  const errs: FieldErrors = {};
  if (!f.name.trim()) errs.name = "El nombre es obligatorio.";
  if (!f.date) errs.date = "La fecha es obligatoria.";
  if (!f.startTime) errs.startTime = "La hora de inicio es obligatoria.";
  if (!f.endTime) errs.endTime = "La hora de fin es obligatoria.";
  if (f.startTime && f.endTime && f.startTime >= f.endTime)
    errs.endTime = "La hora de fin debe ser posterior a la de inicio.";
  if (!f.venue.trim()) errs.venue = "El lugar es obligatorio.";
  if (!f.campus.trim()) errs.campus = "El campus es obligatorio.";
  if (!f.faculty.trim()) errs.faculty = "La facultad es obligatoria.";
  const mg = parseInt(f.maxGuestsDefault, 10);
  if (isNaN(mg) || mg < 1 || mg > 20)
    errs.maxGuestsDefault = "Entre 1 y 20 cupos.";
  return errs;
}

/* ------------------------------------------------------------------ */
/*  Outer wrapper                                                      */
/* ------------------------------------------------------------------ */

export interface CeremonyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ceremony?: Ceremony | null;
  onSave: (c: Ceremony) => void;
}

export function CeremonyForm({
  open,
  onOpenChange,
  ceremony,
  onSave,
}: CeremonyFormProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg p-0">
        {open && (
          <CeremonyFormContents
            key={ceremony?.id ?? "new"}
            ceremony={ceremony ?? null}
            onClose={() => onOpenChange(false)}
            onSave={onSave}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  Inner form                                                         */
/* ------------------------------------------------------------------ */

interface InnerProps {
  ceremony: Ceremony | null;
  onClose: () => void;
  onSave: (c: Ceremony) => void;
}

function CeremonyFormContents({ ceremony, onClose, onSave }: InnerProps) {
  const isEdit = Boolean(ceremony);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const [fields, setFields] = useState<Fields>({
    name: ceremony?.name ?? "",
    date: ceremony?.date ?? "",
    startTime: ceremony?.startTime ?? "",
    endTime: ceremony?.endTime ?? "",
    venue: ceremony?.venue ?? "",
    campus: ceremony?.campus ?? "",
    faculty: ceremony?.faculty ?? "",
    status: ceremony?.status ?? "draft",
    maxGuestsDefault: String(ceremony?.maxGuestsDefault ?? "4"),
    registrationClosesAt: ceremony?.registrationClosesAt
      ? ceremony.registrationClosesAt.slice(0, 16)
      : "",
  });

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    const errs = validate(fields);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    startTransition(async () => {
      try {
        const input: CreateCeremonyInput = {
          name: fields.name.trim(),
          date: fields.date,
          startTime: fields.startTime,
          endTime: fields.endTime,
          venue: fields.venue.trim(),
          campus: fields.campus.trim(),
          faculty: fields.faculty.trim(),
          status: fields.status,
          maxGuestsDefault: parseInt(fields.maxGuestsDefault, 10),
          registrationClosesAt: fields.registrationClosesAt
            ? new Date(fields.registrationClosesAt).toISOString()
            : new Date(`${fields.date}T23:59:59`).toISOString(),
        };

        let saved: Ceremony;
        if (isEdit && ceremony) {
          saved = await updateCeremony(ceremony.id, input);
          toast.success("Ceremonia actualizada");
        } else {
          saved = await createCeremony(input);
          toast.success("Ceremonia creada");
        }
        onSave(saved);
        onClose();
      } catch (err) {
        setServerError(
          err instanceof Error ? err.message : "Algo salió mal.",
        );
      }
    });
  }

  return (
    <>
      <SheetHeader className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <CalendarDays className="size-4 text-primary" />
          </div>
          <div>
            <SheetTitle>
              {isEdit ? "Editar ceremonia" : "Nueva ceremonia"}
            </SheetTitle>
            <SheetDescription>
              {isEdit
                ? "Modifica los datos de la ceremonia."
                : "Completa los datos para crear una nueva ceremonia."}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {/* Name */}
          <Field label="Nombre de la ceremonia" required error={errors.name}>
            <Input
              value={fields.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ej. Grados Facultad de Ingenierías — Junio 2026"
              className="h-9"
              aria-invalid={!!errors.name}
              maxLength={120}
            />
          </Field>

          {/* Date / times row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <Field label="Fecha" required error={errors.date}>
                <Input
                  type="date"
                  value={fields.date}
                  onChange={(e) => set("date", e.target.value)}
                  className="h-9"
                  aria-invalid={!!errors.date}
                />
              </Field>
            </div>
            <Field label="Inicio" required error={errors.startTime}>
              <Input
                type="time"
                value={fields.startTime}
                onChange={(e) => set("startTime", e.target.value)}
                className="h-9"
                aria-invalid={!!errors.startTime}
              />
            </Field>
            <Field label="Fin" required error={errors.endTime}>
              <Input
                type="time"
                value={fields.endTime}
                onChange={(e) => set("endTime", e.target.value)}
                className="h-9"
                aria-invalid={!!errors.endTime}
              />
            </Field>
          </div>

          {/* Venue */}
          <Field label="Lugar / Auditorio" required error={errors.venue}>
            <Input
              value={fields.venue}
              onChange={(e) => set("venue", e.target.value)}
              placeholder="Ej. Auditorio Mons. Felipe Estrada Vélez"
              className="h-9"
              aria-invalid={!!errors.venue}
            />
          </Field>

          {/* Campus */}
          <Field label="Campus" required error={errors.campus}>
            <Select
              value={fields.campus || undefined}
              onValueChange={(v) => set("campus", String(v ?? ""))}
            >
              <SelectTrigger className="h-9 w-full" aria-invalid={!!errors.campus}>
                <SelectValue placeholder="Seleccionar campus" />
              </SelectTrigger>
              <SelectContent>
                {CAMPUSES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Faculty */}
          <Field label="Facultad" required error={errors.faculty}>
            <Select
              value={fields.faculty || undefined}
              onValueChange={(v) => set("faculty", String(v ?? ""))}
            >
              <SelectTrigger className="h-9 w-full" aria-invalid={!!errors.faculty}>
                <SelectValue placeholder="Seleccionar facultad" />
              </SelectTrigger>
              <SelectContent>
                {FACULTIES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Status + max guests row */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Estado" error={errors.status}>
              <Select
                value={fields.status}
                onValueChange={(v) => set("status", v as CeremonyStatus)}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Cupos por defecto"
              required
              error={errors.maxGuestsDefault}
            >
              <Input
                type="number"
                min={1}
                max={20}
                value={fields.maxGuestsDefault}
                onChange={(e) => set("maxGuestsDefault", e.target.value)}
                className="h-9"
                aria-invalid={!!errors.maxGuestsDefault}
              />
            </Field>
          </div>

          {/* Registration closes */}
          <Field
            label="Cierre de registro"
            hint="Fecha y hora límite para registrar invitados"
            error={errors.registrationClosesAt}
          >
            <Input
              type="datetime-local"
              value={fields.registrationClosesAt}
              onChange={(e) => set("registrationClosesAt", e.target.value)}
              className="h-9"
            />
          </Field>

          {/* Server error */}
          {serverError && (
            <div
              role="alert"
              className="flex gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}
        </div>

        <SheetFooter className="border-t border-border bg-muted/40 px-5 py-3">
          <div className="flex w-full justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Guardando…
                </>
              ) : isEdit ? (
                "Guardar cambios"
              ) : (
                "Crear ceremonia"
              )}
            </Button>
          </div>
        </SheetFooter>
      </form>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Field wrapper                                                      */
/* ------------------------------------------------------------------ */

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
