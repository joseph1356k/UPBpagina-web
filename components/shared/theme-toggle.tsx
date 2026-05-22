"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Dark mode toggle — light / dark / system.
 *
 * Avoids hydration mismatch by waiting until mounted before rendering
 * the icon that reflects the actual theme.
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes hydration guard: avoid SSR/CSR mismatch on the icon.
  // We deliberately set mounted to true on first render — the lint
  // warning is a false positive for this one-shot pattern.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const current = mounted ? (resolvedTheme ?? "light") : "light";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Cambiar tema"
          />
        }
      >
        {/* Render both icons stacked, fade between them on mount */}
        <Sun
          className={`size-4 transition-all ${current === "dark" ? "rotate-90 scale-0" : "rotate-0 scale-100"}`}
        />
        <Moon
          className={`absolute size-4 transition-all ${current === "dark" ? "rotate-0 scale-100" : "-rotate-90 scale-0"}`}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-32">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={theme === "light" ? "bg-accent" : ""}
        >
          <Sun className="size-3.5" />
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={theme === "dark" ? "bg-accent" : ""}
        >
          <Moon className="size-3.5" />
          Oscuro
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={theme === "system" ? "bg-accent" : ""}
        >
          <Monitor className="size-3.5" />
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
