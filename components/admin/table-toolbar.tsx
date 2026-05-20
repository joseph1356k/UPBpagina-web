"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  id: string;
  value: string;
  placeholder: string;
  options: FilterOption[];
  onValueChange: (v: string) => void;
  className?: string;
}

interface TableToolbarProps {
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  filteredCount: number;
  totalCount: number;
  entityLabel?: string;
  className?: string;
}

export function TableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar…",
  filters,
  filteredCount,
  totalCount,
  entityLabel = "registros",
  className,
}: TableToolbarProps) {
  const hasActiveFilter =
    searchValue.length > 0 ||
    (filters ?? []).some((f) => f.value !== "" && f.value !== "all");

  function clearAll() {
    onSearchChange("");
    filters?.forEach((f) => f.onValueChange("all"));
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
        className,
      )}
    >
      {/* Left: search + filters */}
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-52 flex-1 sm:max-w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 pl-8 text-sm"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Borrar búsqueda"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        {filters?.map((filter) => (
          <Select
            key={filter.id}
            value={filter.value || "all"}
            onValueChange={(v) =>
              filter.onValueChange(v == null || v === "all" ? "" : v)
            }
          >
            <SelectTrigger
              className={cn("h-8 text-sm", filter.className ?? "w-44")}
              size="sm"
            >
              <SelectValue placeholder={filter.placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{filter.placeholder}</SelectItem>
              {filter.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-8 text-muted-foreground"
          >
            <X className="size-3.5" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Right: count */}
      <p className="shrink-0 text-xs text-muted-foreground">
        {filteredCount === totalCount ? (
          <>
            <span className="font-medium tabular-nums">{totalCount}</span>{" "}
            {entityLabel}
          </>
        ) : (
          <>
            <span className="font-medium tabular-nums">{filteredCount}</span> de{" "}
            <span className="tabular-nums">{totalCount}</span> {entityLabel}
          </>
        )}
      </p>
    </div>
  );
}
