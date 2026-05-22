"use client";

import { useState, useMemo } from "react";
import { ScanLine } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScanResultBadge } from "@/components/shared/status-badge";
import { TablePagination } from "./table-pagination";
import { TableToolbar } from "./table-toolbar";
import {
  SCAN_DENIED_REASON_LABEL,
  SCAN_RESULT_LABEL,
} from "@/lib/constants";
import { formatDateTime, formatRelativeFromNow } from "@/lib/format";
import type { Ceremony, ScanResult } from "@/lib/types";
import type { ScanEventRow } from "@/lib/data";

const PAGE_SIZE = 20;

const RESULT_OPTIONS: { value: ScanResult; label: string }[] = [
  { value: "allowed", label: SCAN_RESULT_LABEL.allowed },
  { value: "denied", label: SCAN_RESULT_LABEL.denied },
];

interface Props {
  events: ScanEventRow[];
  ceremonies: Ceremony[];
}

export function ScanEventsTable({ events, ceremonies }: Props) {
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [ceremonyFilter, setCeremonyFilter] = useState("");
  const [page, setPage] = useState(1);

  const ceremonyByName = useMemo(
    () => new Map(ceremonies.map((c) => [c.id, c.name])),
    [ceremonies],
  );

  const filtered = useMemo(() => {
    let result = events;
    if (resultFilter)
      result = result.filter((e) => e.result === resultFilter);
    if (ceremonyFilter)
      result = result.filter(
        (e) => e.ceremonyName === ceremonyByName.get(ceremonyFilter),
      );
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          (e.guestName ?? "").toLowerCase().includes(q) ||
          (e.graduateName ?? "").toLowerCase().includes(q) ||
          e.scannedByName.toLowerCase().includes(q),
      );
    }
    return result;
  }, [events, search, resultFilter, ceremonyFilter, ceremonyByName]);

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
        searchPlaceholder="Buscar por invitado, graduando u operador…"
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
            id: "result",
            value: resultFilter,
            placeholder: "Todos los resultados",
            options: RESULT_OPTIONS,
            onValueChange: (v) => { setResultFilter(v); setPage(1); },
            className: "w-44",
          },
        ]}
        filteredCount={filtered.length}
        totalCount={events.length}
        entityLabel="escaneos"
      />

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Resultado</TableHead>
              <TableHead>Invitado</TableHead>
              <TableHead className="hidden md:table-cell">Operador</TableHead>
              <TableHead className="hidden lg:table-cell">Ceremonia</TableHead>
              <TableHead className="text-right pr-4">Cuándo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <ScanLine className="size-8 text-muted-foreground/40" />
                    <p>
                      {search || resultFilter || ceremonyFilter
                        ? "Sin escaneos para esos filtros."
                        : "No hay escaneos registrados."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="pl-4">
                    <ScanResultBadge result={e.result} showDot />
                    {e.reason && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {SCAN_DENIED_REASON_LABEL[e.reason]}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground">
                      {e.guestName ?? "QR sin coincidencia"}
                    </p>
                    {e.graduateName && (
                      <p className="text-xs text-muted-foreground">
                        Inv. por {e.graduateName}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {e.scannedByName}
                  </TableCell>
                  <TableCell className="hidden max-w-44 truncate text-xs text-muted-foreground lg:table-cell">
                    {e.ceremonyName ?? "—"}
                  </TableCell>
                  <TableCell
                    className="text-right text-xs text-muted-foreground pr-4"
                    title={formatDateTime(e.scannedAt)}
                  >
                    {formatRelativeFromNow(e.scannedAt)}
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
