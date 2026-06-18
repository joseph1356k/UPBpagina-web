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
import { Switch } from "@/components/ui/switch";
import { adminApi } from "@/lib/api-client";
import type { CreateCeremonyInput } from "@/lib/data";
import { EMAIL_TEMPLATES } from "@/lib/email-templates";
import { EVENT_TYPES, effectiveRegistrationMode } from "@/lib/terminology";
import type {
  Ceremony,
  CeremonyStatus,
  EventTypeRecord,
  RegistrationMode,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Types & validation                                                 */
/* ------------------------------------------------------------------ */

type Fields = {
  name: string;
  eventType: string;
  emailTemplate: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  campus: string;
  faculty: string;
  status: CeremonyStatus;
  maxGuestsDefault: string;
  capacity: string;
  capacityEnforce: boolean;
  publicListed: boolean;
  registrationMode: RegistrationMode;
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
  if (f.capacity.trim()) {
    const cap = parseInt(f.capacity, 10);
    if (isNaN(cap) || cap < 1) errs.capacity = "Debe ser un número mayor a 0.";
  }
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
  /** Admin-managed event types (from DB). Falls back to built-ins. */
  eventTypes?: EventTypeRecord[];
}

export function CeremonyForm({
  open,
  onOpenChange,
  ceremony,
  onSave,
  eventTypes,
}: CeremonyFormProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg p-0">
        {open && (
          <CeremonyFormContents
            key={ceremony?.id ?? "new"}
            ceremony={ceremony ?? null}
            eventTypes={eventTypes}
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
  eventTypes?: EventTypeRecord[];
  onClose: () => void;
  onSave: (c: Ceremony) => void;
}

/** Built-in registry as a fallback when DB types weren't passed. */
const BUILTIN_AS_RECORDS: EventTypeRecord[] = EVENT_TYPES.map((t, i) => ({
  value: t.value,
  label: t.label,
  eventNoun: t.eventNoun,
  participantSingular: t.participantSingular,
  participantPlural: t.participantPlural,
  guestSingular: t.guestSingular,
  guestPlural: t.guestPlural,
  invitePhrase: t.invitePhrase,
  photoRecommended: t.photoRecommended,
  defaultTemplate: t.defaultTemplate,
  defaultRegistrationMode: t.defaultRegistrationMode,
  customFields: t.customFields ?? [],
  isBuiltin: true,
  active: true,
  sortOrder: (i + 1) * 10,
}));

function CeremonyFormContents({ ceremony, eventTypes, onClose, onSave }: InnerProps) {
  const isEdit = Boolean(ceremony);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const types =
    eventTypes && eventTypes.length > 0 ? eventTypes : BUILTIN_AS_RECORDS;
  const typeByValue = new Map(types.map((t) => [t.value, t]));
  const firstType = types[0]?.value ?? "graduation";

  const [fields, setFields] = useState<Fields>({
    name: ceremony?.name ?? "",
    eventType: ceremony?.eventType ?? firstType,
    emailTemplate:
      ceremony?.emailTemplate ??
      typeByValue.get(ceremony?.eventType ?? firstType)?.defaultTemplate ??
      "clasica",
    date: ceremony?.date ?? "",
    startTime: ceremony?.startTime ?? "",
    endTime: ceremony?.endTime ?? "",
    venue: ceremony?.venue ?? "",
    campus: ceremony?.campus ?? "",
    faculty: ceremony?.faculty ?? "",
    status: ceremony?.status ?? "draft",
    maxGuestsDefault: String(ceremony?.maxGuestsDefault ?? "4"),
    capacity: ceremony?.capacity != null ? String(ceremony.capacity) : "",
    capacityEnforce: ceremony?.capacityEnforce ?? false,
    publicListed: ceremony?.publicListed ?? false,
    // Existing events keep their current effective mode (no surprise flip);
    // new events start from the selected type's recommendation.
    registrationMode: ceremony
      ? effectiveRegistrationMode(ceremony)
      : typeByValue.get(firstType)?.defaultRegistrationMode ?? "invitation",
    registrationClosesAt: ceremony?.registrationClosesAt
      ? ceremony.registrationClosesAt.slice(0, 16)
      : "",
  });

  // Answers to the selected type's custom fields.
  const [customData, setCustomData] = useState<Record<string, string>>(
    ceremony?.customData ?? {},
  );
  const activeCustomFields = typeByValue.get(fields.eventType)?.customFields ?? [];

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  /** Changing the event type suggests its default template (only when the
   *  admin hasn't deliberately diverged — i.e. current value is still the
   *  previous type's default). */
  function setEventType(next: string) {
    setFields((prev) => {
      const prevDefault = typeByValue.get(prev.eventType)?.defaultTemplate;
      const nextDefault = typeByValue.get(next)?.defaultTemplate ?? "clasica";
      // Same diverge-detection for the registration mode: only follow the new
      // type's recommendation if the admin hadn't manually changed it.
      const prevModeDefault =
        typeByValue.get(prev.eventType)?.defaultRegistrationMode;
      const nextModeDefault =
        typeByValue.get(next)?.defaultRegistrationMode ?? "invitation";
      const registrationMode =
        prev.registrationMode === prevModeDefault
          ? nextModeDefault
          : prev.registrationMode;
      return {
        ...prev,
        eventType: next,
        emailTemplate:
          prev.emailTemplate === prevDefault ? nextDefault : prev.emailTemplate,
        registrationMode,
        publicListed:
          registrationMode === "self_service" ? true : prev.publicListed,
      };
    });
  }

  /** Switching the mode keeps the public-catalog flag in step: self-service
   *  events are listed by default; invitation events are not public. */
  function setRegistrationMode(next: RegistrationMode) {
    setFields((prev) => ({
      ...prev,
      registrationMode: next,
      publicListed: next === "self_service",
    }));
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
          eventType: fields.eventType,
          emailTemplate: fields.emailTemplate,
          date: fields.date,
          startTime: fields.startTime,
          endTime: fields.endTime,
          venue: fields.venue.trim(),
          campus: fields.campus.trim(),
          faculty: fields.faculty.trim(),
          status: fields.status,
          maxGuestsDefault: parseInt(fields.maxGuestsDefault, 10),
          capacity: fields.capacity.trim()
            ? parseInt(fields.capacity, 10)
            : null,
          capacityEnforce: fields.capacityEnforce,
          publicListed: fields.publicListed,
          registrationMode: fields.registrationMode,
          registrationClosesAt: fields.registrationClosesAt
            ? new Date(fields.registrationClosesAt).toISOString()
            : new Date(`${fields.date}T23:59:59`).toISOString(),
          customData: Object.fromEntries(
            activeCustomFields
              .map((cf) => [cf.key, (customData[cf.key] ?? "").trim()])
              .filter(([, v]) => v !== ""),
          ),
        };

        let saved: Ceremony;
        if (isEdit && ceremony) {
          saved = await adminApi.ceremonies.update(ceremony.id, input);
          toast.success("Ceremonia actualizada");
        } else {
          saved = await adminApi.ceremonies.create(input);
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
          {/* Event type */}
          <Field
            label="Tipo de evento"
            required
            hint="Define el lenguaje de la plataforma y la plantilla sugerida."
          >
            <Select
              value={fields.eventType}
              onValueChange={(v) => setEventType(String(v ?? firstType))}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Registration mode (recommended by the event type) */}
          <Field
            label="¿Cómo reciben el QR los asistentes?"
            hint={
              fields.registrationMode === "self_service"
                ? "Auto-registro: la persona se registra y su QR aparece al instante. No requiere invitar a nadie."
                : "Por invitación: un responsable registra a los invitados y a cada uno le llega su QR."
            }
          >
            <Select
              value={fields.registrationMode}
              onValueChange={(v) =>
                setRegistrationMode((v as RegistrationMode) || "invitation")
              }
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self_service">Auto-registro</SelectItem>
                <SelectItem value="invitation">Por invitación</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {/* Name */}
          <Field label="Nombre del evento" required error={errors.name}>
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

          {/* Venue capacity (aforo) */}
          <Field
            label="Aforo del recinto"
            hint="Capacidad total de invitados. Déjalo vacío si no hay límite."
            error={errors.capacity}
          >
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              value={fields.capacity}
              onChange={(e) => set("capacity", e.target.value)}
              placeholder="Sin límite"
              className="h-9"
              aria-invalid={!!errors.capacity}
            />
          </Field>

          {/* Door capacity policy */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3.5 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Bloquear ingreso al llenar el aforo
              </p>
              <p className="text-xs text-muted-foreground">
                Apagado: al superar el aforo se permite el ingreso con una
                advertencia. Solo aplica si definiste un aforo.
              </p>
            </div>
            <Switch
              checked={fields.capacityEnforce}
              onCheckedChange={(v) => set("capacityEnforce", v)}
            />
          </div>

          {/* Public catalog opt-in */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3.5 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Listar en el catálogo público
              </p>
              <p className="text-xs text-muted-foreground">
                Muestra el evento en el catálogo público /eventos. El registro
                lo define el modo de arriba.
              </p>
            </div>
            <Switch
              checked={fields.publicListed}
              onCheckedChange={(v) => set("publicListed", v)}
            />
          </div>

          {/* Email template */}
          <Field
            label="Plantilla del correo de invitación"
            hint={
              EMAIL_TEMPLATES.find((t) => t.key === fields.emailTemplate)
                ?.description
            }
          >
            <Select
              value={fields.emailTemplate}
              onValueChange={(v) => set("emailTemplate", String(v ?? "clasica"))}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATES.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Custom fields for this event type */}
          {activeCustomFields.length > 0 && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Campos de {typeByValue.get(fields.eventType)?.label}
              </p>
              {activeCustomFields.map((cf) => (
                <Field key={cf.key} label={cf.label} hint={cf.hint}>
                  {cf.type === "select" && cf.options ? (
                    <Select
                      value={customData[cf.key] || undefined}
                      onValueChange={(v) =>
                        setCustomData((p) => ({ ...p, [cf.key]: String(v ?? "") }))
                      }
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="Seleccionar…" />
                      </SelectTrigger>
                      <SelectContent>
                        {cf.options.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={
                        cf.type === "number"
                          ? "number"
                          : cf.type === "date"
                            ? "date"
                            : "text"
                      }
                      value={customData[cf.key] ?? ""}
                      onChange={(e) =>
                        setCustomData((p) => ({ ...p, [cf.key]: e.target.value }))
                      }
                      className="h-9"
                    />
                  )}
                </Field>
              ))}
            </div>
          )}

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
