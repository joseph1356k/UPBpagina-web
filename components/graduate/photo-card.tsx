"use client";

/**
 * Optional participant photo card (graduate portal).
 *
 * The photo personalizes the invitation emails sent to this participant's
 * guests. Upload goes through POST /api/graduate/photo (magic-byte
 * validated, ≤2 MB); removal through DELETE.
 */

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useGraduatePortal } from "@/components/graduate/auth-provider";
import { formatInitials } from "@/lib/format";

const MAX_BYTES = 2 * 1024 * 1024;

export function PhotoCard() {
  const { graduate } = useGraduatePortal();
  const [photoUrl, setPhotoUrl] = useState<string | null>(graduate.photoUrl);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  function pickFile() {
    inputRef.current?.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    if (file.size > MAX_BYTES) {
      toast.error("La foto supera los 2 MB. Usa una imagen más liviana.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Formato no soportado. Usa JPG, PNG o WebP.");
      return;
    }

    startTransition(async () => {
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/graduate/photo", {
          method: "POST",
          credentials: "same-origin",
          body: form,
        });
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          photoUrl?: string;
          error?: string;
        };
        if (!res.ok || json.ok !== true || !json.photoUrl) {
          throw new Error(json.error ?? "upload_failed");
        }
        setPhotoUrl(json.photoUrl);
        toast.success("Foto actualizada. Aparecerá en tus invitaciones.");
      } catch {
        toast.error("No se pudo subir la foto. Intenta de nuevo.");
      }
    });
  }

  function removePhoto() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/graduate/photo", {
          method: "DELETE",
          credentials: "same-origin",
        });
        if (!res.ok) throw new Error();
        setPhotoUrl(null);
        toast.success("Foto eliminada.");
      } catch {
        toast.error("No se pudo eliminar la foto.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={`Foto de ${graduate.fullName}`}
              className="size-16 rounded-full border-2 border-brand-gold/60 object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="flex size-16 items-center justify-center rounded-full bg-primary/10 font-serif text-lg font-semibold text-primary ring-1 ring-primary/15"
            >
              {formatInitials(graduate.fullName)}
            </span>
          )}
          {isPending && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
              <Loader2 className="size-5 animate-spin text-primary" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground">Tu foto (opcional)</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Si la subes, aparecerá en el correo de invitación que reciben tus
            invitados — así te reconocen de inmediato. JPG, PNG o WebP, máx. 2 MB.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={pickFile}
              disabled={isPending}
            >
              <Camera className="size-3.5" />
              {photoUrl ? "Cambiar foto" : "Subir foto"}
            </Button>
            {photoUrl && (
              <Button
                size="sm"
                variant="ghost"
                onClick={removePhoto}
                disabled={isPending}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Quitar
              </Button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFile}
        aria-label="Seleccionar foto"
      />
    </div>
  );
}
