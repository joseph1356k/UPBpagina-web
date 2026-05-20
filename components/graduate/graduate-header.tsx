"use client";

import { LogOut } from "lucide-react";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { useGraduatePortal } from "./auth-provider";

/**
 * Header for the authenticated graduate workspace. Pulls the active
 * ceremony name from the portal context so it stays in sync with the
 * session regardless of which page the user is on.
 */
export function GraduateHeader() {
  const { ceremony, signOut } = useGraduatePortal();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 md:px-8">
        <BrandMark size="md" />

        <div className="hidden flex-1 items-center gap-2 md:flex">
          <span aria-hidden className="ml-2 inline-block h-5 w-px bg-border" />
          <p className="truncate text-sm text-muted-foreground">
            <span className="font-medium text-foreground/80">Ceremonia: </span>
            {ceremony.name}
          </p>
        </div>

        <div className="flex-1 md:hidden" />

        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-3.5" />
          Cerrar sesión
        </Button>
      </div>
    </header>
  );
}
