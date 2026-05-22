"use client";

import { useState, useMemo } from "react";
import {
  FilePlus2,
  History,
  Mail,
  Pencil,
  ScanLine,
  ShieldOff,
  Trash2,
  Upload,
  UserCircle,
} from "lucide-react";

import { TablePagination } from "./table-pagination";
import { TableToolbar } from "./table-toolbar";
import { formatDateTime, formatRelativeFromNow } from "@/lib/format";
import type { AuditAction, EntityType } from "@/lib/types";
import type { AuditLogRow } from "@/lib/data";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const ACTION_OPTIONS: { value: AuditAction; label: string }[] = [
  { value: "create", label: "Creación" },
  { value: "update", label: "Edición" },
  { value: "delete", label: "Eliminación" },
  { value: "import", label: "Importación" },
  { value: "send_invitation", label: "Envío de invitación" },
  { value: "revoke", label: "Revocación" },
  { value: "check_in", label: "Ingreso" },
  { value: "login", label: "Inicio de sesión" },
];

const ENTITY_OPTIONS: { value: EntityType; label: string }[] = [
  { value: "ceremony", label: "Ceremonia" },
  { value: "graduate", label: "Graduando" },
  { value: "guest", label: "Invitado" },
  { value: "user", label: "Usuario" },
  { value: "scan_event", label: "Escaneo" },
];

const ACTION_ICONS: Record<AuditAction, React.ElementType> = {
  create: FilePlus2,
  update: Pencil,
  delete: Trash2,
  import: Upload,
  send_invitation: Mail,
  revoke: ShieldOff,
  check_in: ScanLine,
  login: UserCircle,
};

const ACTION_TONES: Record<AuditAction, string> = {
  create: "bg-success/10 text-success",
  update: "bg-info/10 text-info",
  delete: "bg-destructive/10 text-destructive",
  import: "bg-primary/10 text-primary",
  send_invitation: "bg-primary/10 text-primary",
  revoke: "bg-warning/15 text-warning",
  check_in: "bg-success/10 text-success",
  login: "bg-muted text-muted-foreground",
};

interface Props {
  entries: AuditLogRow[];
}

export function AuditLogTable({ entries }: Props) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = entries;
    if (actionFilter)
      result = result.filter((e) => e.action === actionFilter);
    if (entityFilter)
      result = result.filter((e) => e.entityType === entityFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.summary.toLowerCase().includes(q) ||
          e.actorName.toLowerCase().includes(q),
      );
    }
    return result;
  }, [entries, search, actionFilter, entityFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return (
    <div className="flex flex-col gap-4">
      <TableToolbar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Buscar por descripción u operador…"
        filters={[
          {
            id: "action",
            value: actionFilter,
            placeholder: "Todas las acciones",
            options: ACTION_OPTIONS,
            onValueChange: (v) => { setActionFilter(v); setPage(1); },
            className: "w-48",
          },
          {
            id: "entity",
            value: entityFilter,
            placeholder: "Todas las entidades",
            options: ENTITY_OPTIONS,
            onValueChange: (v) => { setEntityFilter(v); setPage(1); },
            className: "w-44",
          },
        ]}
        filteredCount={filtered.length}
        totalCount={entries.length}
        entityLabel="entradas"
      />

      {paginated.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card/40 py-12 text-center text-sm text-muted-foreground">
          <History className="size-8 text-muted-foreground/40" />
          <p>
            {search || actionFilter || entityFilter
              ? "Sin entradas para esos filtros."
              : "No hay actividad registrada."}
          </p>
        </div>
      ) : (
        <ol className="relative space-y-3 border-l border-border pl-6">
          {paginated.map((e) => {
            const Icon = ACTION_ICONS[e.action];
            return (
              <li key={e.id} className="relative">
                {/* Marker */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute -left-[34px] flex size-6 items-center justify-center rounded-full ring-4 ring-background",
                    ACTION_TONES[e.action],
                  )}
                >
                  <Icon className="size-3" />
                </span>

                <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
                  <p className="text-sm text-foreground">{e.summary}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {e.actorName}
                    </span>{" "}
                    · <span title={formatDateTime(e.at)}>{formatRelativeFromNow(e.at)}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <TablePagination
        page={safePage}
        totalPages={totalPages}
        totalCount={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}
