import Link from "next/link";

import { cn } from "@/lib/utils";
import { PRODUCT } from "@/lib/constants";

interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  variant?: "lockup" | "mark-only";
  href?: string | null;
  className?: string;
}

const SIZES = {
  sm: {
    mark: "size-7 text-[10px]",
    primary: "text-[0.92rem]",
    secondary: "text-[0.62rem]",
  },
  md: {
    mark: "size-8 text-[11px]",
    primary: "text-[1.02rem]",
    secondary: "text-[0.68rem]",
  },
  lg: {
    mark: "size-11 text-base",
    primary: "text-xl",
    secondary: "text-[0.78rem]",
  },
} as const;

export function BrandMark({
  size = "md",
  variant = "lockup",
  href = "/",
  className,
}: BrandMarkProps) {
  const s = SIZES[size];

  const content = (
    <span
      className={cn(
        "group/brand inline-flex items-center gap-2.5 select-none",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center rounded-[0.5rem] bg-primary text-primary-foreground ring-1 ring-primary/30 transition-shadow group-hover/brand:ring-primary/50",
          s.mark,
        )}
      >
        <span className="font-serif font-semibold tracking-wide">UPB</span>
        <span
          aria-hidden
          className="absolute -inset-px rounded-[0.5rem] bg-gradient-to-br from-white/10 to-transparent"
        />
      </span>
      {variant === "lockup" && (
        <span className="flex flex-col leading-none">
          <span className={cn("font-serif font-semibold tracking-tight text-foreground", s.primary)}>
            {PRODUCT.shortName}
          </span>
          <span
            className={cn(
              "mt-0.5 uppercase tracking-[0.22em] text-muted-foreground",
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
