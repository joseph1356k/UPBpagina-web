"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, MoreHorizontal, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CeremonyStatusBadge } from "@/components/shared/status-badge";
import { CeremonyForm } from "./ceremony-form";
import { TablePagination } from "./table-pagination";
import { TableToolbar } from "./table-toolbar";
import { adminApi } from "@/lib/api-client";
import {
  CEREMONY_STATUS_LABEL,
  ROUTES,
} from "@/lib/constants";
import { formatDateShort, formatTime } from "@/lib/format";
import { getTerminology } from "@/lib/terminology";
import type { Ceremony, CeremonyStatus, EventTypeRecord } from "@/lib/types";

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS: { value: CeremonyStatus; label: string }[] = [
  { value: "open", label: CEREMONY_STATUS_LABEL.open },
  { value: "in_progress", label: CEREMONY_STATUS_LABEL.in_progress },
  { value: "closed", label: CEREMONY_STATUS_LABEL.closed },
  { value: "draft", label: CEREMONY_STATUS_LABEL.draft },
  { value: "completed", label: CEREMONY_STATUS_LABEL.completed },
];

interface Props {
  initialCeremonies: Ceremony[];
  eventTypes?: EventTypeRecord[];
}

export function CeremoniesTable({ initialCeremonies, eventTypes }: Props) {
  const [ceremonies, setCeremonies] = useState(initialCeremonies);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Ceremony | null>(null);

  // Label resolver: prefer DB types, fall back to built-in registry.
  const typeLabel = useMemo(() => {
    const map = new Map((eventTypes ?? []).map((t) => [t.value, t.label]));
    return (value: string) => map.get(value) ?? getTerminology(value).label;
  }, [eventTypes]);
  const typeFilterOptions = useMemo(
    () =>
      (eventTypes ?? []).length > 0
        ? eventTypes!.map((t) => ({ value: t.value, label: t.label }))
        : [],
    [eventTypes],
  );

  const filtered = useMemo(() => {
    let result = ceremonies;
    if (statusFilter) result = result.filter((c) => c.status === statusFilter);
    if (typeFilter) result = result.filter((c) => c.eventType === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.venue.toLowerCase().includes(q) ||
          c.campus.toLowerCase().includes(q) ||
          c.faculty.toLowerCase().includes(q),
      );
    }
    return result;
  }, [ceremonies, search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(c: Ceremony) {
    setEditing(c);
    setFormOpen(true);
  }

  function handleSave(saved: Ceremony) {
    setCeremonies((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id);
      if (idx === -1) return [...prev, saved];
      return prev.map((c) => (c.id === saved.id ? saved : c));
    });
    setPage(1);
  }

  async function handleArchive(c: Ceremony) {
    try {
      const updated = await adminApi.ceremonies.update(c.id, { status: "completed" });
      setCeremonies((prev) =>
        prev.map((x) => (x.id === updated.id ? updated : x)),
      );
      toast.success("Evento archivado");
    } catch {
      toast.error("No se pudo archivar el evento.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <TableToolbar
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Buscar por nombre, sede o lugar…"
          filters={[
            {
              id: "type",
              value: typeFilter,
              placeholder: "Todos los tipos",
              options: typeFilterOptions,
              onValueChange: (v) => { setTypeFilter(v); setPage(1); },
              className: "w-52",
            },
            {
              id: "status",
              value: statusFilter,
              placeholder: "Todos los estados",
              options: STATUS_FILTER_OPTIONS,
              onValueChange: (v) => { setStatusFilter(v); setPage(1); },
              className: "w-44",
            },
          ]}
          filteredCount={filtered.length}
          totalCount={ceremonies.length}
          entityLabel="eventos"
          className="flex-1"
        />
        <Button onClick={openCreate} size="sm" className="shrink-0">
          <Plus className="size-4" />
          Nueva
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Evento</TableHead>
              <TableHead className="hidden sm:table-cell">Tipo</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="hidden md:table-cell">Campus</TableHead>
              <TableHead className="hidden lg:table-cell">Estado</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <CalendarDays className="size-8 text-muted-foreground/40" />
                    <p>
                      {search || statusFilter || typeFilter
                        ? "No hay eventos con esos filtros."
                        : "No hay eventos registrados."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((c) => (
                <TableRow key={c.id} className="group">
                  <TableCell className="pl-4">
                    <Link
                      href={`${ROUTES.adminCeremonias}/${c.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline underline-offset-4"
                    >
                      {c.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5 sm:hidden">
                      {typeLabel(c.eventType)}
                    </p>
                    <p className="text-xs text-muted-foreground lg:hidden mt-0.5">
                      <CeremonyStatusBadge status={c.status} className="lg:hidden" />
                    </p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {typeLabel(c.eventType)}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <p className="text-sm">{formatDateShort(c.date)}</p>
                    <p className="text-xs">
                      {formatTime(c.startTime)} – {formatTime(c.endTime)}
                    </p>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {c.campus}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <CeremonyStatusBadge status={c.status} showDot />
                  </TableCell>
                  <TableCell className="pr-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="opacity-0 group-hover:opacity-100"
                          aria-label="Acciones"
                        />
                      }>
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          render={<Link href={`${ROUTES.adminCeremonias}/${c.id}`} />}
                        >
                          <ArrowUpRight className="size-3.5" />
                          Ver detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(c)}>
                          <Pencil className="size-3.5" />
                          Editar
                        </DropdownMenuItem>
                        {c.status !== "completed" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleArchive(c)}
                              className="text-muted-foreground"
                            >
                              Marcar como finalizada
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        page={safePage}
        totalPages={totalPages}
        totalCount={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      <CeremonyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        ceremony={editing}
        eventTypes={eventTypes}
        onSave={handleSave}
      />
    </div>
  );
}
