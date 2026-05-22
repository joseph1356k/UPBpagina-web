"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { cn } from "@/lib/utils";

/**
 * Real QR code as inline SVG.
 *
 * Uses the `qrcode` lib client-side (small, ~30KB) so the same
 * component works in client invitation views and the in-portal preview.
 *
 * Error correction level "H" (30% redundancy) survives screen
 * scratches, thumb covering part of the code, or print smudges.
 */

interface QrCodeProps {
  /** The string encoded into the QR (usually the invitation URL). */
  value: string;
  /** Pixel size of the rendered SVG. Defaults to 240. */
  size?: number;
  /** UPB brand color or null for monochrome. */
  color?: string;
  className?: string;
}

export function QrCode({
  value,
  size = 240,
  color = "#A6192E",
  className,
}: QrCodeProps) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(value, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 1,
      width: size,
      color: { dark: color, light: "#ffffff00" },
    })
      .then((s) => {
        if (!cancelled) setSvg(s);
      })
      .catch((err) => {
        console.error("[qr] generate failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size, color]);

  return (
    <div
      role="img"
      aria-label={`Código QR del invitado`}
      className={cn(
        "inline-block rounded-md bg-white p-3 ring-1 ring-border shadow-sm",
        className,
      )}
      style={{ width: size + 24, height: size + 24 }}
    >
      {svg ? (
        <div
          className="size-full"
          // Trusted SVG from qrcode lib (no user content in attributes)
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div
          aria-hidden
          className="size-full animate-pulse rounded bg-muted/50"
        />
      )}
    </div>
  );
}
