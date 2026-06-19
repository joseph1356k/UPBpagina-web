"use client";

import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadIcs, type CalendarEvent } from "@/lib/calendar";
import { cn } from "@/lib/utils";

/**
 * "Agregar al calendario" — downloads an .ics for the event. Works with any
 * Ceremony-shaped object (id/name/date/times/venue/campus).
 */
export function AddToCalendar({
  event,
  variant = "outline",
  className,
  label = "Agregar al calendario",
}: {
  event: CalendarEvent;
  variant?: "outline" | "ghost" | "secondary";
  className?: string;
  label?: string;
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={() => downloadIcs(event)}
      className={cn(className)}
    >
      <CalendarPlus className="size-4" />
      {label}
    </Button>
  );
}
