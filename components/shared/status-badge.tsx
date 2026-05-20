import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CEREMONY_STATUS_LABEL,
  CEREMONY_STATUS_VARIANT,
  GRADUATE_STATUS_LABEL,
  GRADUATE_STATUS_VARIANT,
  GUEST_STATUS_LABEL,
  GUEST_STATUS_LABEL_GRADUATE,
  GUEST_STATUS_VARIANT,
  SCAN_RESULT_LABEL,
  SCAN_RESULT_VARIANT,
  type StatusVariant,
} from "@/lib/constants";
import type {
  CeremonyStatus,
  GraduateStatus,
  GuestStatus,
  ScanResult,
} from "@/lib/types";

const VARIANT_CLASSES: Record<StatusVariant, string> = {
  neutral:
    "bg-muted text-muted-foreground ring-1 ring-inset ring-border/60",
  info: "bg-info/10 text-info ring-1 ring-inset ring-info/25 dark:bg-info/15",
  success:
    "bg-success/12 text-success ring-1 ring-inset ring-success/25 dark:bg-success/18",
  warning:
    "bg-warning/15 text-warning-foreground ring-1 ring-inset ring-warning/35 dark:text-warning",
  danger:
    "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/25",
};

const DOT_CLASSES: Record<StatusVariant, string> = {
  neutral: "bg-muted-foreground/60",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
};

interface BaseProps {
  showDot?: boolean;
  className?: string;
}

function Pill({
  variant,
  label,
  showDot,
  className,
}: BaseProps & { variant: StatusVariant; label: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 rounded-full border-transparent px-2 text-[0.72rem] font-medium",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {showDot ? (
        <span
          aria-hidden
          className={cn("size-1.5 rounded-full", DOT_CLASSES[variant])}
        />
      ) : null}
      {label}
    </Badge>
  );
}

export function CeremonyStatusBadge({
  status,
  ...props
}: BaseProps & { status: CeremonyStatus }) {
  return (
    <Pill
      variant={CEREMONY_STATUS_VARIANT[status]}
      label={CEREMONY_STATUS_LABEL[status]}
      {...props}
    />
  );
}

export function GraduateStatusBadge({
  status,
  ...props
}: BaseProps & { status: GraduateStatus }) {
  return (
    <Pill
      variant={GRADUATE_STATUS_VARIANT[status]}
      label={GRADUATE_STATUS_LABEL[status]}
      {...props}
    />
  );
}

export function GuestStatusBadge({
  status,
  audience = "admin",
  ...props
}: BaseProps & {
  status: GuestStatus;
  /** Selects between admin wording ("Pendiente") and graduate-facing wording ("Borrador"). */
  audience?: "admin" | "graduate";
}) {
  const label =
    audience === "graduate"
      ? GUEST_STATUS_LABEL_GRADUATE[status]
      : GUEST_STATUS_LABEL[status];
  return (
    <Pill
      variant={GUEST_STATUS_VARIANT[status]}
      label={label}
      {...props}
    />
  );
}

export function ScanResultBadge({
  result,
  ...props
}: BaseProps & { result: ScanResult }) {
  return (
    <Pill
      variant={SCAN_RESULT_VARIANT[result]}
      label={SCAN_RESULT_LABEL[result]}
      {...props}
    />
  );
}
