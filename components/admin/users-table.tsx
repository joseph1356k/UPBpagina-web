"use client";

import { useState, useMemo } from "react";
import {
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Plus,
  Users,
  XCircle,
} from "lucide-react";
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
import { UserForm } from "./user-form";
import { TablePagination } from "./table-pagination";
import { TableToolbar } from "./table-toolbar";
import { adminApi } from "@/lib/api-client";
import { USER_ROLE_LABEL } from "@/lib/constants";
import { formatInitials, formatRelativeFromNow } from "@/lib/format";
import type { User, UserRole } from "@/lib/types";

const PAGE_SIZE = 10;

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: USER_ROLE_LABEL.admin },
  { value: "coordinator", label: USER_ROLE_LABEL.coordinator },
  { value: "scanner", label: USER_ROLE_LABEL.scanner },
];

interface Props {
  initialUsers: User[];
}

export function UsersTable({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const filtered = useMemo(() => {
    let result = users;
    if (roleFilter) result = result.filter((u) => u.role === roleFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      );
    }
    return result;
  }, [users, search, roleFilter]);

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

  function openEdit(u: User) {
    setEditing(u);
    setFormOpen(true);
  }

  function handleSave(saved: User) {
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === saved.id);
      if (idx === -1) return [...prev, saved];
      return prev.map((u) => (u.id === saved.id ? saved : u));
    });
    setPage(1);
  }

  async function handleToggleActive(u: User) {
    try {
      const updated = await adminApi.users.update(u.id, { active: !u.active });
      setUsers((prev) =>
        prev.map((x) => (x.id === updated.id ? updated : x)),
      );
      toast.success(
        updated.active ? "Usuario activado" : "Usuario desactivado",
      );
    } catch {
      toast.error("No se pudo actualizar el usuario.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <TableToolbar
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Buscar por nombre o correo…"
          filters={[
            {
              id: "role",
              value: roleFilter,
              placeholder: "Todos los roles",
              options: ROLE_OPTIONS,
              onValueChange: (v) => { setRoleFilter(v); setPage(1); },
              className: "w-44",
            },
          ]}
          filteredCount={filtered.length}
          totalCount={users.length}
          entityLabel="usuarios"
          className="flex-1"
        />
        <Button onClick={openCreate} size="sm" className="shrink-0">
          <Plus className="size-4" />
          Nuevo
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Usuario</TableHead>
              <TableHead className="hidden sm:table-cell">Rol</TableHead>
              <TableHead className="hidden md:table-cell">
                Último acceso
              </TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-10" />
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
                    <Users className="size-8 text-muted-foreground/40" />
                    <p>
                      {search || roleFilter
                        ? "No hay usuarios con esos filtros."
                        : "No hay usuarios registrados."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((u) => (
                <TableRow
                  key={u.id}
                  className={`group ${!u.active ? "opacity-60" : ""}`}
                >
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.68rem] font-semibold text-primary"
                      >
                        {formatInitials(u.fullName)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          {u.fullName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                    {USER_ROLE_LABEL[u.role]}
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {u.lastSignInAt
                      ? formatRelativeFromNow(u.lastSignInAt)
                      : "Nunca"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        u.active ? "text-success" : "text-muted-foreground"
                      }`}
                    >
                      {u.active ? (
                        <CheckCircle2 className="size-3.5" />
                      ) : (
                        <XCircle className="size-3.5" />
                      )}
                      {u.active ? "Activo" : "Inactivo"}
                    </span>
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
                        <DropdownMenuItem onClick={() => openEdit(u)}>
                          <Pencil className="size-3.5" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(u)}
                        >
                          {u.active ? (
                            <>
                              <XCircle className="size-3.5" />
                              Desactivar cuenta
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="size-3.5" />
                              Activar cuenta
                            </>
                          )}
                        </DropdownMenuItem>
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

      <UserForm
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        onSave={handleSave}
      />
    </div>
  );
}
