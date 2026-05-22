"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, MoreHorizontal, UsersRound } from "lucide-react";
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
import { GuestStatusBadge } from "@/components/shared/status-badge";
import { TablePagination } from "./table-pagination";
import { TableToolbar } from "./table-toolbar";
import { adminApi } from "@/lib/api-client";
import { GUEST_STATUS_LABEL, ROUTES } from "@/lib/constants";
import { formatDocument, formatDateTime } from "@/lib/format";
import type { Ceremony, GuestStatus } from "@/lib/types";
import type { GuestAdminRow } from "@/lib/data";

const PAGE_SIZE = 15;

const STATUS_OPTIONS: { value: GuestStatus; label: string }[] = [
  { value: "pending", label: GUEST_STATUS_LABEL.pending },
  { value: "invited", label: GUEST_STATUS_LABEL.invited },
  { value: "checked_in", label: GUEST_STATUS_LABEL.checked_in },
  { value: "revoked", label: GUEST_STATUS_LABEL.revoked },
];

interface Props {
  initialGuests: GuestAdminRow[];
  ceremonies: Ceremony[];
  initialCeremonyId?: string;
}

export function GuestsAdminTable({
  initialGuests,
  ceremonies,
  initialCeremonyId = "",
}: Props) {
  const [guests, setGuests] = useState(initialGuests);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ceremonyFilter, setCeremonyFilter] = useState(initialCeremonyId);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = guests;
    if (ceremonyFilter)
      result = result.filter((g) => g.ceremonyId === ceremonyFilter);
    if (statusFilter)
      result = result.filter((g) => g.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.fullName.toLowerCase().includes(q) ||
          g.graduateName.toLowerCase().includes(q) ||
          (g.documentNumber ?? "").includes(q) ||
          (g.email ?? "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [guests, search, statusFilter, ceremonyFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  async function handleRevoke(id: string) {
    try {
      const updated = await adminApi.guests.revoke(id);
      setGuests((prev) =>
        prev.map((g) => (g.id === updated.id ? { ...g, status: "revoked" as const } : g)),
      );
      toast.success("Invitación revocada");
    } catch {
      toast.error("No se pudo revocar la invitación.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <TableToolbar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Buscar por nombre, graduando, documento o correo…"
        filters={[
          {
            id: "ceremony",
            value: ceremonyFilter,
            placeholder: "Todas las ceremonias",
            options: ceremonies.map((c) => ({ value: c.id, label: c.name })),
            onValueChange: (v) => { setCeremonyFilter(v); setPage(1); },
            className: "w-56",
          },
          {
            id: "status",
            value: statusFilter,
            placeholder: "Todos los estados",
            options: STATUS_OPTIONS,
            onValueChange: (v) => { setStatusFilter(v); setPage(1); },
            className: "w-44",
          },
        ]}
        filteredCount={filtered.length}
        totalCount={guests.length}
        entityLabel="invitados"
      />

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Invitado</TableHead>
              <TableHead className="hidden sm:table-cell">Documento</TableHead>
              <TableHead className="hidden md:table-cell">Graduando</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden lg:table-cell">Enviado</TableHead>
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
                    <UsersRound className="size-8 text-muted-foreground/40" />
                    <p>
                      {search || statusFilter || ceremonyFilter
                        ? "No hay invitados con esos filtros."
                        : "No hay invitados registrados."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((g) => (
                <TableRow
                  key={g.id}
                  className={`group ${g.status === "revoked" ? "opacity-60" : ""}`}
                >
                  <TableCell className="pl-4">
                    <p className="font-medium text-foreground">{g.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.email ?? "Sin correo"}
                    </p>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell tabular-nums">
                    {g.documentNumber
                      ? formatDocument(g.documentNumber)
                      : "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Link
                      href={`${ROUTES.adminGraduandos}/${g.graduateId}`}
                      className="text-sm text-foreground hover:text-primary hover:underline underline-offset-4"
                    >
                      {g.graduateName}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate max-w-36">
                      {g.ceremonyName}
                    </p>
                  </TableCell>
                  <TableCell>
                    <GuestStatusBadge status={g.status} showDot />
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                    {g.invitedAt ? formatDateTime(g.invitedAt) : "—"}
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
                          render={<Link href={`${ROUTES.adminGraduandos}/${g.graduateId}`} />}
                        >
                          <ArrowUpRight className="size-3.5" />
                          Ver graduando
                        </DropdownMenuItem>
                        {g.status !== "revoked" &&
                          g.status !== "checked_in" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleRevoke(g.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                Revocar invitación
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
    </div>
  );
}
