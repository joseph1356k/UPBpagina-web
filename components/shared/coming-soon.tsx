import Link from "next/link";
import { Construction } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ComingSoonProps {
  section: string;
  title: string;
  description: string;
  bullets?: string[];
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  className?: string;
}

export function ComingSoon({
  section,
  title,
  description,
  bullets,
  primaryAction,
  secondaryAction,
  className,
}: ComingSoonProps) {
  return (
    <div className={cn("mx-auto w-full max-w-2xl px-4 py-12 md:py-20", className)}>
      <Card className="ring-foreground/8">
        <div className="flex flex-col items-center gap-4 px-6 py-12 text-center md:px-10 md:py-16">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.15em] text-warning-foreground">
            <Construction className="size-3.5" />
            {section} · En construcción
          </span>
          <h1 className="text-balance font-serif text-3xl font-semibold tracking-tight md:text-[2.1rem]">
            {title}
          </h1>
          <p className="max-w-md text-pretty text-muted-foreground">
            {description}
          </p>
          {bullets && bullets.length > 0 ? (
            <div className="mt-4 w-full max-w-md rounded-lg border border-dashed border-border/80 bg-muted/30 p-5 text-left">
              <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Lo que incluirá
              </p>
              <ul className="space-y-1.5">
                {bullets.map((b) => (
                  <li key={b} className="flex gap-2 text-sm leading-relaxed">
                    <span aria-hidden className="mt-1 size-1 shrink-0 rounded-full bg-primary" />
                    <span className="text-foreground/85">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {(primaryAction || secondaryAction) ? (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              {primaryAction ? (
                <Button asChild>
                  <Link href={primaryAction.href}>{primaryAction.label}</Link>
                </Button>
              ) : null}
              {secondaryAction ? (
                <Button asChild variant="outline">
                  <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
