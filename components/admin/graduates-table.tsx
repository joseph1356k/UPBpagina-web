"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  GraduationCap,
  Loader2,
  Mail,
  MoreHorizontal,
} from "lucide-react";
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
import {
  GraduateStatusBadge,
} from "@/components/shared/status-badge";
import { TablePagination } from "./table-pagination";
import { TableToolbar } from "./table-toolbar";
import { adminApi } from "@/lib/api-client";
import {
  DOCUMENT_TYPE_LABEL,
  GRADUATE_STATUS_LABEL,
  ROUTES,
} from "@/lib/constants";
import { formatDocument, formatInitials } from "@/lib/format";
import type { Ceremony, Graduate, GraduateStatus } from "@/lib/types";

const PAGE_SIZE = 15;

const STATUS_OPTIONS: { value: GraduateStatus; label: string }[] = [
  { value: "eligible", label: GRADUATE_STATUS_LABEL.eligible },
  { value: "registered", label: GRADUATE_STATUS_LABEL.registered },
  { value: "not_eligible", label: GRADUATE_STATUS_LABEL.not_eligible },
  { value: "completed", label: GRADUATE_STATUS_LABEL.completed },
];

interface Props {
  initialGraduates: Graduate[];
  ceremonies: Ceremony[];
  initialCeremonyId?: string;
  initialSearch?: string;
}

export function GraduatesTable({
  initialGraduates,
  ceremonies,
  initialCeremonyId = "",
  initialSearch = "",
}: Props) {
  const [graduates, setGraduates] = useState(initialGraduates);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("");
  const [ceremonyFilter, setCeremonyFilter] = useState(initialCeremonyId);
  const [page, setPage] = useState(1);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [isNotifying, startNotify] = useTransition();

  const ceremonyMap = useMemo(
    () => new Map(ceremonies.map((c) => [c.id, c.name])),
    [ceremonies],
  );

  const notifyCeremony = ceremonies.find((c) => c.id === ceremonyFilter);
  const notifyCount = useMemo(
    () =>
      graduates.filter(
        (g) =>
          g.ceremonyId === ceremonyFilter &&
          g.status !== "not_eligible" &&
          g.email,
      ).length,
    [graduates, ceremonyFilter],
  );

  function handleNotify() {
    if (!ceremonyFilter) return;
    startNotify(async () => {
      try {
        const res = await fetch("/api/admin/graduates/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ ceremonyId: ceremonyFilter }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          sent?: number;
          failed?: number;
        };
        if (!res.ok || json.ok !== true) {
          throw new Error("notify_failed");
        }
        setNotifyOpen(false);
        if ((json.sent ?? 0) === 0) {
          toast.info(
            "Todos los graduandos de esta ceremonia ya habían sido notificados.",
          );
        } else {
          toast.success(
            `${json.sent} graduandos notificados${
              json.failed ? ` · ${json.failed} sin correo válido` : ""
            }`,
          );
        }
      } catch {
        toast.error("No se pudieron enviar las notificaciones.");
      }
    });
  }

  const filtered = useMemo(() => {
    let result = graduates;
    if (ceremonyFilter)
      result = result.filter((g) => g.ceremonyId === ceremonyFilter);
    if (statusFilter)
      result = result.filter((g) => g.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      const qDigits = q.replace(/\D/g, "");
      result = result.filter(
        (g) =>
          g.fullName.toLowerCase().includes(q) ||
          g.email.toLowerCase().includes(q) ||
          g.studentCode.includes(q) ||
          g.program.toLowerCase().includes(q) ||
          (qDigits && g.documentNumber.includes(qDigits)),
      );
    }
    return result;
  }, [graduates, search, statusFilter, ceremonyFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  async function handleStatusChange(g: Graduate, status: GraduateStatus) {
    try {
      const updated = await adminApi.graduates.update(g.id, { status });
      setGraduates((prev) =>
        prev.map((x) => (x.id === updated.id ? updated : x)),
      );
      toast.success("Estado actualizado");
    } catch {
      toast.error("No se pudo actualizar el estado.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <TableToolbar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Buscar por nombre, documento, correo o programa…"
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
        totalCount={graduates.length}
        entityLabel="graduandos"
      />

      {/* Bulk notify — appears when a specific ceremony is selected */}
      {ceremonyFilter && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm">
            <Mail className="size-4 shrink-0 text-primary" />
            <span className="text-foreground">
              Avisa a los graduandos de{" "}
              <strong>{notifyCeremony?.name}</strong> que ya pueden registrar
              invitados.
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => setNotifyOpen(true)}
            disabled={notifyCount === 0}
          >
            <Mail className="size-3.5" />
            Notificar graduandos
          </Button>
        </div>
      )}

      {/* Confirm dialog */}
      <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar correo de bienvenida</DialogTitle>
            <DialogDescription>
              Se enviará un correo a los graduandos de{" "}
              <strong className="text-foreground">{notifyCeremony?.name}</strong>{" "}
              invitándolos a registrar a sus acompañantes. Solo se notifica a
              quienes no han recibido el aviso antes.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              Destinatarios potenciales:{" "}
              <strong className="text-foreground">{notifyCount}</strong>{" "}
              graduandos con correo válido.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNotifyOpen(false)}
              disabled={isNotifying}
            >
              Cancelar
            </Button>
            <Button onClick={handleNotify} disabled={isNotifying}>
              {isNotifying ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Enviando…
                </>
              ) : (
                <>
                  <Mail className="size-4" />
                  Confirmar envío
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Graduando</TableHead>
              <TableHead className="hidden sm:table-cell">Documento</TableHead>
              <TableHead className="hidden md:table-cell">Ceremonia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden lg:table-cell text-right">
                Cupos
              </TableHead>
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
                    <GraduationCap className="size-8 text-muted-foreground/40" />
                    <p>
                      {search || statusFilter || ceremonyFilter
                        ? "No hay graduandos con esos filtros."
                        : "No hay graduandos registrados."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((g) => (
                <TableRow key={g.id} className="group">
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden
                        className="hidden sm:flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.68rem] font-semibold text-primary"
                      >
                        {formatInitials(g.fullName)}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`${ROUTES.adminGraduandos}/${g.id}`}
                          className="font-medium text-foreground hover:text-primary hover:underline underline-offset-4"
                        >
                          {g.fullName}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {g.program}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                    <p>{DOCUMENT_TYPE_LABEL[g.documentType]}</p>
                    <p className="text-xs tabular-nums">
                      {formatDocument(g.documentNumber)}
                    </p>
                  </TableCell>
                  <TableCell className="hidden max-w-44 md:table-cell">
                    <p className="truncate text-xs text-muted-foreground">
                      {ceremonyMap.get(g.ceremonyId) ?? g.ceremonyId}
                    </p>
                  </TableCell>
                  <TableCell>
                    <GraduateStatusBadge status={g.status} showDot />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right text-sm tabular-nums text-muted-foreground pr-4">
                    {g.maxGuests}
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
                          render={<Link href={`${ROUTES.adminGraduandos}/${g.id}`} />}
                        >
                          <ArrowUpRight className="size-3.5" />
                          Ver detalle
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {(
                          [
                            "eligible",
                            "registered",
                            "not_eligible",
                            "completed",
                          ] as GraduateStatus[]
                        )
                          .filter((s) => s !== g.status)
                          .map((s) => (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => handleStatusChange(g, s)}
                            >
                              Marcar como {GRADUATE_STATUS_LABEL[s].toLowerCase()}
                            </DropdownMenuItem>
                          ))}
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
