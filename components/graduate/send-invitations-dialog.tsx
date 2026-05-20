"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useGraduatePortal } from "./auth-provider";

interface SendInvitationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendInvitationsDialog({
  open,
  onOpenChange,
}: SendInvitationsDialogProps) {
  const { guests, sendInvitations } = useGraduatePortal();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ sent: number } | null>(null);

  const pending = guests.filter((g) => g.status === "pending");
  const withEmail = pending.filter((g) => Boolean(g.email));
  const withoutEmail = pending.filter((g) => !g.email);

  function handleSend() {
    startTransition(async () => {
      try {
        const r = await sendInvitations();
        setResult(r);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "No se pudieron enviar las invitaciones.";
        toast.error(msg);
      }
    });
  }

  function handleClose(open: boolean) {
    onOpenChange(open);
    if (!open) {
      // Reset on close so the dialog is fresh on next open
      setTimeout(() => setResult(null), 200);
    }
  }

  /* ── Success screen ───────────────────────────────────────────── */

  if (result) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="size-7 text-primary" />
            </div>
            <DialogHeader className="text-center">
              <DialogTitle className="text-center">
                Invitaciones enviadas
              </DialogTitle>
              <DialogDescription className="text-center">
                Notificamos a{" "}
                <strong className="text-foreground">
                  {pluralize(result.sent, "invitado", "invitados")}
                </strong>
                . Recibirán su pase de ingreso en su correo.
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter showCloseButton={false}>
            <Button onClick={() => handleClose(false)} className="w-full">
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  /* ── Confirm screen ───────────────────────────────────────────── */

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Send className="size-4 text-primary" />
            </div>
            <DialogTitle>Enviar invitaciones</DialogTitle>
          </div>
          <DialogDescription>
            Una vez enviadas, los invitados ya no podrán editarse — solo
            revocarse. Asegúrate de que los datos son correctos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pendientes por enviar</span>
              <span className="font-medium text-foreground tabular-nums">
                {pending.length}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Con correo registrado</span>
              <span className="font-medium text-foreground tabular-nums">
                {withEmail.length}
              </span>
            </div>
            {withoutEmail.length > 0 && (
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-warning">Sin correo</span>
                <span className="font-medium text-warning tabular-nums">
                  {withoutEmail.length}
                </span>
              </div>
            )}
          </div>

          {withoutEmail.length > 0 && (
            <div
              className={cn(
                "flex gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs",
              )}
            >
              <Mail className="mt-0.5 size-3.5 shrink-0 text-warning" />
              <p className="text-muted-foreground">
                A los invitados sin correo se les genera el pase, pero deberás
                compartirles el enlace manualmente.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={isPending || pending.length === 0}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <Send className="size-4" />
                Confirmar y enviar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
