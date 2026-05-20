"use client";

import { useState, useTransition } from "react";
import {
  AtSign,
  IdCard,
  Loader2,
  MoreVertical,
  PencilLine,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GuestStatusBadge } from "@/components/shared/status-badge";
import { formatDocument, formatInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Guest } from "@/lib/types";

import { useGraduatePortal } from "./auth-provider";

interface GuestRowProps {
  guest: Guest;
  onEdit: (guest: Guest) => void;
  className?: string;
}

export function GuestRow({ guest, onEdit, className }: GuestRowProps) {
  const { removeGuest } = useGraduatePortal();
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isEditable = guest.status === "pending";
  const isCheckedIn = guest.status === "checked_in";
  const isRevoked = guest.status === "revoked";

  function handleRemove() {
    startTransition(async () => {
      try {
        await removeGuest(guest.id);
        toast.success(
          guest.status === "invited"
            ? "Invitación revocada"
            : "Invitado eliminado",
        );
        setConfirmingRemove(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "No fue posible.";
        toast.error(msg);
      }
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors sm:flex-row sm:items-center",
        isRevoked && "opacity-60",
        className,
      )}
    >
      {/* Identity */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
        >
          {formatInitials(guest.fullName)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium text-foreground">
              {guest.fullName}
            </p>
            <GuestStatusBadge
              status={guest.status}
              audience="graduate"
              showDot
            />
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {guest.relationship && <span>{guest.relationship}</span>}
            {guest.documentNumber && (
              <span className="inline-flex items-center gap-1">
                <IdCard className="size-3" />
                {formatDocument(guest.documentNumber)}
              </span>
            )}
            {guest.email && (
              <span className="inline-flex items-center gap-1 truncate">
                <AtSign className="size-3" />
                <span className="truncate">{guest.email}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
        {confirmingRemove ? (
          <>
            <span className="text-xs text-muted-foreground">
              {guest.status === "invited" ? "¿Revocar?" : "¿Eliminar?"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingRemove(false)}
              disabled={isPending}
            >
              <X className="size-3.5" />
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              Confirmar
            </Button>
          </>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Acciones del invitado"
                  disabled={isCheckedIn}
                />
              }
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {isEditable && (
                <DropdownMenuItem onClick={() => onEdit(guest)}>
                  <PencilLine className="size-3.5" />
                  Editar
                </DropdownMenuItem>
              )}
              {!isCheckedIn && !isRevoked && (
                <DropdownMenuItem
                  onClick={() => setConfirmingRemove(true)}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  {guest.status === "invited" ? "Revocar" : "Eliminar"}
                </DropdownMenuItem>
              )}
              {isRevoked && (
                <DropdownMenuItem
                  onClick={() => setConfirmingRemove(true)}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
