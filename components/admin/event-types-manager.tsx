"use client";

/**
 * Admin manager for the event-type catalog (table: event_types).
 * Built-in types can be edited; admins can also create custom ones.
 * Each type carries its terminology, default template and custom fields.
 */

import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Tags } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EMAIL_TEMPLATES } from "@/lib/email-templates";
import { EVENT_TYPE_SLUG_RE } from "@/lib/terminology";
import type { EventTypeRecord, RegistrationMode } from "@/lib/types";

interface Props {
  initialTypes: EventTypeRecord[];
}

const EMPTY: EventTypeRecord = {
  value: "",
  label: "",
  eventNoun: "evento",
  participantSingular: "participante",
  participantPlural: "participantes",
  guestSingular: "invitado",
  guestPlural: "invitados",
  invitePhrase: "te ha invitado a este evento",
  photoRecommended: false,
  defaultTemplate: "clasica",
  defaultRegistrationMode: "self_service",
  customFields: [],
  isBuiltin: false,
  active: true,
  sortOrder: 200,
};

export function EventTypesManager({ initialTypes }: Props) {
  const [types, setTypes] = useState(initialTypes);
  const [editing, setEditing] = useState<EventTypeRecord | null>(null);
  const [creating, setCreating] = useState(false);

  function onSaved(saved: EventTypeRecord) {
    setTypes((prev) => {
      const idx = prev.findIndex((t) => t.value === saved.value);
      if (idx === -1) return [...prev, saved].sort((a, b) => a.sortOrder - b.sortOrder);
      return prev.map((t) => (t.value === saved.value ? saved : t));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Nuevo tipo
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Tipo</TableHead>
              <TableHead className="hidden sm:table-cell">Participante</TableHead>
              <TableHead className="hidden md:table-cell">Plantilla</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((t) => (
              <TableRow key={t.value} className="group">
                <TableCell className="pl-4">
                  <p className="font-medium text-foreground">{t.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.value}
                    {t.isBuiltin && " · base"}
                  </p>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                  {t.participantPlural}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground md:table-cell capitalize">
                  {t.defaultTemplate}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      t.active
                        ? "inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success"
                        : "inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {t.active ? "Activo" : "Inactivo"}
                  </span>
                </TableCell>
                <TableCell className="pr-3">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="opacity-0 group-hover:opacity-100"
                    aria-label="Editar"
                    onClick={() => setEditing(t)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TypeSheet
        open={creating}
        onOpenChange={setCreating}
        initial={EMPTY}
        isNew
        onSaved={onSaved}
      />
      <TypeSheet
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        initial={editing ?? EMPTY}
        isNew={false}
        onSaved={(s) => {
          onSaved(s);
          setEditing(null);
        }}
      />
    </div>
  );
}

function TypeSheet({
  open,
  onOpenChange,
  initial,
  isNew,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: EventTypeRecord;
  isNew: boolean;
  onSaved: (t: EventTypeRecord) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md p-0">
        {open && (
          <TypeForm
            key={initial.value || "new"}
            initial={initial}
            isNew={isNew}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function TypeForm({
  initial,
  isNew,
  onClose,
  onSaved,
}: {
  initial: EventTypeRecord;
  isNew: boolean;
  onClose: () => void;
  onSaved: (t: EventTypeRecord) => void;
}) {
  const [f, setF] = useState(initial);
  const [isPending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function set<K extends keyof EventTypeRecord>(k: K, v: EventTypeRecord[K]) {
    setF((p) => ({ ...p, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (isNew && !EVENT_TYPE_SLUG_RE.test(f.value)) {
      setErr("El identificador debe ser minúsculas, sin espacios (ej. gala-benefica).");
      return;
    }
    if (f.label.trim().length < 2) {
      setErr("El nombre es obligatorio.");
      return;
    }

    start(async () => {
      try {
        const payload = {
          label: f.label.trim(),
          eventNoun: f.eventNoun.trim(),
          participantSingular: f.participantSingular.trim(),
          participantPlural: f.participantPlural.trim(),
          guestSingular: f.guestSingular.trim(),
          guestPlural: f.guestPlural.trim(),
          invitePhrase: f.invitePhrase.trim(),
          photoRecommended: f.photoRecommended,
          defaultTemplate: f.defaultTemplate,
          defaultRegistrationMode: f.defaultRegistrationMode,
        };
        const res = await fetch(
          isNew
            ? "/api/admin/event-types"
            : `/api/admin/event-types/${encodeURIComponent(f.value)}`,
          {
            method: isNew ? "POST" : "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(isNew ? { value: f.value.trim(), ...payload } : payload),
          },
        );
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          type?: EventTypeRecord;
          error?: string;
        };
        if (!res.ok || json.ok !== true || !json.type) {
          throw new Error(json.error ?? "save_failed");
        }
        onSaved(json.type);
        toast.success(isNew ? "Tipo creado" : "Tipo actualizado");
        onClose();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "save_failed";
        setErr(msg === "slug_taken" ? "Ese identificador ya existe." : "No se pudo guardar.");
      }
    });
  }

  return (
    <>
      <SheetHeader className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <Tags className="size-4 text-primary" />
          </span>
          <div>
            <SheetTitle>{isNew ? "Nuevo tipo de evento" : `Editar · ${initial.label}`}</SheetTitle>
            <SheetDescription>
              Define cómo habla la plataforma para este tipo de evento.
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <form onSubmit={submit} className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {isNew && (
            <FieldRow label="Identificador (slug)" hint="Minúsculas, sin espacios. No se puede cambiar después.">
              <Input value={f.value} onChange={(e) => set("value", e.target.value)} placeholder="ej. gala-benefica" className="h-9" />
            </FieldRow>
          )}
          <FieldRow label="Nombre visible">
            <Input value={f.label} onChange={(e) => set("label", e.target.value)} placeholder="Ej. Gala benéfica" className="h-9" />
          </FieldRow>
          <FieldRow label="Sustantivo del evento" hint="Se usa en frases: «tu …».">
            <Input value={f.eventNoun} onChange={(e) => set("eventNoun", e.target.value)} placeholder="evento / ceremonia / gala" className="h-9" />
          </FieldRow>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Participante (singular)">
              <Input value={f.participantSingular} onChange={(e) => set("participantSingular", e.target.value)} className="h-9" />
            </FieldRow>
            <FieldRow label="Participante (plural)">
              <Input value={f.participantPlural} onChange={(e) => set("participantPlural", e.target.value)} className="h-9" />
            </FieldRow>
            <FieldRow label="Invitado (singular)">
              <Input value={f.guestSingular} onChange={(e) => set("guestSingular", e.target.value)} className="h-9" />
            </FieldRow>
            <FieldRow label="Invitado (plural)">
              <Input value={f.guestPlural} onChange={(e) => set("guestPlural", e.target.value)} className="h-9" />
            </FieldRow>
          </div>
          <FieldRow label="Frase de invitación" hint="«{participante} {frase}».">
            <Input value={f.invitePhrase} onChange={(e) => set("invitePhrase", e.target.value)} className="h-9" />
          </FieldRow>
          <FieldRow label="Plantilla de correo por defecto">
            <Select value={f.defaultTemplate} onValueChange={(v) => set("defaultTemplate", String(v ?? "clasica"))}>
              <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATES.map((t) => (
                  <SelectItem key={t.key} value={t.key}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow
            label="Modo de registro recomendado"
            hint="Predeterminado al crear eventos de este tipo. El admin puede cambiarlo por evento."
          >
            <Select
              value={f.defaultRegistrationMode}
              onValueChange={(v) =>
                set("defaultRegistrationMode", (v as RegistrationMode) || "invitation")
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
          </FieldRow>
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" checked={f.photoRecommended} onChange={(e) => set("photoRecommended", e.target.checked)} className="size-4 accent-[var(--color-primary)]" />
            Sugerir foto del participante en este tipo de evento
          </label>
          {!isNew && (
            <label className="flex items-center gap-2.5 text-sm">
              <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} className="size-4 accent-[var(--color-primary)]" />
              Activo (disponible al crear eventos)
            </label>
          )}

          {err && (
            <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {err}
            </p>
          )}
        </div>

        <SheetFooter className="border-t border-border bg-muted/40 px-5 py-3">
          <div className="flex w-full justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <><Loader2 className="size-4 animate-spin" /> Guardando…</> : "Guardar"}
            </Button>
          </div>
        </SheetFooter>
      </form>
    </>
  );
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
