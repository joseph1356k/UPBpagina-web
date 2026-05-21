import Link from "next/link";

import { cn } from "@/lib/utils";
import { PRODUCT } from "@/lib/constants";

import { UpbShield } from "./upb-shield";

interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  variant?: "lockup" | "mark-only";
  /** Set to true when placed on a dark background (scanner, hero overlay). */
  inverted?: boolean;
  href?: string | null;
  className?: string;
}

const SIZES = {
  sm: {
    mark: "size-7",
    primary: "text-[0.92rem]",
    secondary: "text-[0.6rem]",
    gap: "gap-2",
  },
  md: {
    mark: "size-9",
    primary: "text-[1.02rem]",
    secondary: "text-[0.66rem]",
    gap: "gap-2.5",
  },
  lg: {
    mark: "size-12",
    primary: "text-xl",
    secondary: "text-[0.78rem]",
    gap: "gap-3",
  },
} as const;

export function BrandMark({
  size = "md",
  variant = "lockup",
  inverted = false,
  href = "/",
  className,
}: BrandMarkProps) {
  const s = SIZES[size];

  const content = (
    <span
      className={cn(
        "group/brand inline-flex items-center select-none",
        s.gap,
        className,
      )}
    >
      {/* Logo mark */}
      <span
        aria-hidden
        className={cn(
          "shrink-0 transition-transform group-hover/brand:scale-105",
          s.mark,
        )}
      >
        <UpbShield className="size-full" />
      </span>

      {/* Wordmark */}
      {variant === "lockup" && (
        <span className="flex flex-col leading-tight">
          <span
            className={cn(
              "font-serif font-semibold tracking-tight",
              inverted ? "text-background" : "text-foreground",
              s.primary,
            )}
          >
            {PRODUCT.shortName}
          </span>
          <span
            className={cn(
              "mt-0.5 uppercase tracking-[0.16em]",
              inverted ? "text-background/60" : "text-muted-foreground",
              s.secondary,
            )}
          >
            UPB · Grados
          </span>
        </span>
      )}

      <span className="sr-only">{PRODUCT.name}</span>
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-flex">
      {content}
    </Link>
  );
}
