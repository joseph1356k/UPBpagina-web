"use client";

/**
 * Assign organizers to an event (admin action). Organizers only see and manage
 * the events they're assigned to — enforced by RLS; this is just the picker.
 */

import { useState } from "react";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { adminApi } from "@/lib/api-client";
import { formatInitials } from "@/lib/format";

export interface AssignableUser {
  id: string;
  fullName: string;
  email: string;
}

interface Props {
  ceremonyId: string;
  initialOrganizerIds: string[];
  users: AssignableUser[];
}

export function EventOrganizers({ ceremonyId, initialOrganizerIds, users }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialOrganizerIds),
  );
  const [saved, setSaved] = useState<Set<string>>(new Set(initialOrganizerIds));
  const [saving, setSaving] = useState(false);

  const dirty =
    selected.size !== saved.size ||
    [...selected].some((id) => !saved.has(id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      await adminApi.organizers.set(ceremonyId, [...selected]);
      setSaved(new Set(selected));
      toast.success("Organizadores actualizados");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <Users className="size-4" />
          </span>
          <CardTitle className="text-base">Organizadores del evento</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Los organizadores solo ven y gestionan los eventos que les asignes.
        </p>

        {users.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No hay usuarios con rol Organizador. Créalos en Usuarios.
          </div>
        ) : (
          <>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {users.map((u) => {
                const checked = selected.has(u.id);
                return (
                  <li key={u.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(u.id)}
                      />
                      <span
                        aria-hidden
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[0.68rem] font-semibold text-muted-foreground"
                      >
                        {formatInitials(u.fullName)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {u.fullName}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {u.email}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="flex justify-end">
              <Button size="sm" onClick={save} disabled={!dirty || saving}>
                {saving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  "Guardar"
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
