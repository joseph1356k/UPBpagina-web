"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Loader2, UserPlus2, UserRoundCog } from "lucide-react";
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
import { GUEST_RELATIONSHIPS } from "@/lib/constants";
import type { Guest } from "@/lib/types";
import { cn } from "@/lib/utils";

import { useGraduatePortal } from "./auth-provider";

/* ------------------------------------------------------------------ */
/*  Validation                                                        */
/* ------------------------------------------------------------------ */

type FieldKey = "fullName" | "documentNumber" | "email";
type FieldErrors = Partial<Record<FieldKey, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(input: {
  fullName: string;
  documentNumber: string;
  email: string;
}): FieldErrors {
  const errs: FieldErrors = {};
  const name = input.fullName.trim();
  if (!name) errs.fullName = "El nombre completo es obligatorio.";
  else if (name.length < 2) errs.fullName = "Ingresa el nombre completo.";
  else if (name.length > 80)
    errs.fullName = "El nombre no puede superar los 80 caracteres.";

  const doc = input.documentNumber.trim();
  if (doc && (doc.length < 6 || doc.length > 12)) {
    errs.documentNumber = "Debe tener entre 6 y 12 dígitos.";
  }

  const email = input.email.trim();
  if (email && !EMAIL_RE.test(email)) {
    errs.email = "Correo electrónico no válido.";
  }

  return errs;
}

/* ------------------------------------------------------------------ */
/*  Outer wrapper — handles Sheet open/close                          */
/* ------------------------------------------------------------------ */

export interface GuestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Guest to edit, or `null`/undefined for create mode. */
  guest?: Guest | null;
}

export function GuestForm({ open, onOpenChange, guest }: GuestFormProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md p-0">
        {/* Re-mount the inner form every time the sheet opens or the
            edit target changes, so all field state resets cleanly without
            needing an effect to sync props → state. */}
        {open && (
          <GuestFormContents
            key={guest?.id ?? "new"}
            guest={guest ?? null}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  Inner contents — state lives here, lifecycle gated by `open`      */
/* ------------------------------------------------------------------ */

interface InnerProps {
  guest: Guest | null;
  onClose: () => void;
}

function GuestFormContents({ guest, onClose }: InnerProps) {
  const { addGuest, updateGuest, isFull } = useGraduatePortal();
  const [isPending, startTransition] = useTransition();

  const isEdit = Boolean(guest);

  // Initial values derived from props — only run once thanks to the
  // outer `key` remount.
  const [fullName, setFullName] = useState(guest?.fullName ?? "");
  const [documentNumber, setDocumentNumber] = useState(
    guest?.documentNumber ?? "",
  );
  const [email, setEmail] = useState(guest?.email ?? "");
  const [relationship, setRelationship] = useState(guest?.relationship ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const blockedFull = !isEdit && isFull;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);

    const fieldErrors = validate({ fullName, documentNumber, email });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    startTransition(async () => {
      try {
        if (isEdit && guest) {
          await updateGuest(guest.id, {
            fullName,
            documentNumber: documentNumber || null,
            email: email || null,
            relationship: relationship || null,
          });
          toast.success("Invitado actualizado");
        } else {
          await addGuest({
            fullName,
            documentNumber: documentNumber || null,
            email: email || null,
            relationship: relationship || null,
          });
          toast.success("Invitado agregado");
        }
        onClose();
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Algo salió mal. Intenta de nuevo.";
        setServerError(msg);
      }
    });
  }

  return (
    <>
      <SheetHeader className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            {isEdit ? (
              <UserRoundCog className="size-4 text-primary" />
            ) : (
              <UserPlus2 className="size-4 text-primary" />
            )}
          </div>
          <div>
            <SheetTitle>
              {isEdit ? "Editar invitado" : "Agregar invitado"}
            </SheetTitle>
            <SheetDescription>
              {isEdit
                ? "Actualiza los datos antes de enviar la invitación."
                : "Quedará como borrador hasta que envíes las invitaciones."}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      {blockedFull ? (
        <div className="flex-1 px-5 py-6">
          <div className="flex gap-2.5 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
            <div>
              <p className="font-medium text-warning-foreground">Cupo lleno</p>
              <p className="mt-0.5 text-muted-foreground">
                Ya alcanzaste el máximo de invitados para este evento.
                Revoca uno existente si necesitas reemplazarlo.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">

            {/* Full name */}
            <div className="space-y-1.5">
              <Label htmlFor="g-fullname">
                Nombre completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="g-fullname"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName)
                    setErrors((p) => ({ ...p, fullName: undefined }));
                }}
                placeholder="Ej. Ana María Pérez Ruiz"
                aria-invalid={errors.fullName ? true : undefined}
                autoComplete="off"
                maxLength={80}
                className="h-10"
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName}</p>
              )}
            </div>

            {/* Document number */}
            <div className="space-y-1.5">
              <Label htmlFor="g-doc">Número de documento</Label>
              <Input
                id="g-doc"
                value={documentNumber}
                onChange={(e) => {
                  setDocumentNumber(e.target.value.replace(/\D/g, ""));
                  if (errors.documentNumber)
                    setErrors((p) => ({ ...p, documentNumber: undefined }));
                }}
                inputMode="numeric"
                placeholder="Opcional · ayuda en el ingreso"
                aria-invalid={errors.documentNumber ? true : undefined}
                autoComplete="off"
                maxLength={12}
                className="h-10"
              />
              {errors.documentNumber ? (
                <p className="text-xs text-destructive">
                  {errors.documentNumber}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Recomendado: agiliza el ingreso el día del evento.
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="g-email">Correo electrónico</Label>
              <Input
                id="g-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email)
                    setErrors((p) => ({ ...p, email: undefined }));
                }}
                placeholder="Opcional · para enviar la invitación digital"
                aria-invalid={errors.email ? true : undefined}
                autoComplete="off"
                className="h-10"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Relationship */}
            <div className="space-y-1.5">
              <Label htmlFor="g-rel-trigger">Relación contigo</Label>
              <Select
                value={relationship || undefined}
                onValueChange={(v) => setRelationship(String(v ?? ""))}
              >
                <SelectTrigger id="g-rel-trigger" className="w-full">
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {GUEST_RELATIONSHIPS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Server error */}
            {serverError && (
              <div
                role="alert"
                className={cn(
                  "flex gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5",
                )}
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
                  "Agregar invitado"
                )}
              </Button>
            </div>
          </SheetFooter>
        </form>
      )}
    </>
  );
}
