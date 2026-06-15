"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Loader2, UserRoundCog, UserRoundPlus } from "lucide-react";
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
import type { CreateUserInput } from "@/lib/data";
import { USER_ROLE_LABEL } from "@/lib/constants";
import type { User, UserRole } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Types & validation                                                 */
/* ------------------------------------------------------------------ */

type Fields = {
  fullName: string;
  email: string;
  role: UserRole;
  active: boolean;
};

type FieldErrors = Partial<Record<keyof Omit<Fields, "active">, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(f: Fields): FieldErrors {
  const errs: FieldErrors = {};
  if (!f.fullName.trim()) errs.fullName = "El nombre es obligatorio.";
  if (!f.email.trim()) errs.email = "El correo es obligatorio.";
  else if (!EMAIL_RE.test(f.email.trim()))
    errs.email = "Correo electrónico no válido.";
  return errs;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: USER_ROLE_LABEL.admin },
  { value: "coordinator", label: USER_ROLE_LABEL.coordinator },
  { value: "organizer", label: USER_ROLE_LABEL.organizer },
  { value: "scanner", label: USER_ROLE_LABEL.scanner },
];

/* ------------------------------------------------------------------ */
/*  Outer wrapper                                                      */
/* ------------------------------------------------------------------ */

export interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSave: (u: User) => void;
}

export function UserForm({ open, onOpenChange, user, onSave }: UserFormProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md p-0">
        {open && (
          <UserFormContents
            key={user?.id ?? "new"}
            user={user ?? null}
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
  user: User | null;
  onClose: () => void;
  onSave: (u: User) => void;
}

function UserFormContents({ user, onClose, onSave }: InnerProps) {
  const isEdit = Boolean(user);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const [fields, setFields] = useState<Fields>({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "scanner",
    active: user?.active ?? true,
  });

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (key in errors)
      setErrors((prev) => ({
        ...prev,
        [key as keyof FieldErrors]: undefined,
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
        const input: CreateUserInput = {
          fullName: fields.fullName.trim(),
          email: fields.email.trim().toLowerCase(),
          role: fields.role,
          active: fields.active,
        };

        let saved: User;
        if (isEdit && user) {
          saved = await adminApi.users.update(user.id, input);
          toast.success("Usuario actualizado");
        } else {
          saved = await adminApi.users.create(input);
          toast.success("Usuario creado");
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
            {isEdit ? (
              <UserRoundCog className="size-4 text-primary" />
            ) : (
              <UserRoundPlus className="size-4 text-primary" />
            )}
          </div>
          <div>
            <SheetTitle>
              {isEdit ? "Editar usuario" : "Nuevo usuario"}
            </SheetTitle>
            <SheetDescription>
              {isEdit
                ? "Modifica los datos del usuario."
                : "Crea una cuenta de acceso al panel administrativo."}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-1 flex-col"
      >
        <div className="flex-1 space-y-4 px-5 py-5">
          {/* Full name */}
          <div className="space-y-1.5">
            <Label htmlFor="u-name">
              Nombre completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="u-name"
              value={fields.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="Ej. María González Álvarez"
              className="h-9"
              aria-invalid={!!errors.fullName}
              maxLength={80}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="u-email">
              Correo electrónico <span className="text-destructive">*</span>
            </Label>
            <Input
              id="u-email"
              type="email"
              value={fields.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="usuario@upb.edu.co"
              className="h-9"
              aria-invalid={!!errors.email}
              autoComplete="off"
              disabled={isEdit}
            />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email}</p>
            ) : isEdit ? (
              <p className="text-xs text-muted-foreground">
                El correo no puede modificarse.
              </p>
            ) : null}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="u-role-trigger">Rol</Label>
            <Select
              value={fields.role}
              onValueChange={(v) => set("role", v as UserRole)}
            >
              <SelectTrigger id="u-role-trigger" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                Cuenta activa
              </p>
              <p className="text-xs text-muted-foreground">
                Los usuarios inactivos no pueden iniciar sesión.
              </p>
            </div>
            <Switch
              checked={fields.active}
              onCheckedChange={(v) => set("active", v)}
            />
          </div>

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
                "Crear usuario"
              )}
            </Button>
          </div>
        </SheetFooter>
      </form>
    </>
  );
}
