import { cn } from "@/lib/utils";

/**
 * Minimal area+line sparkline (SVG). Decorative shape with an `aria-label`
 * summary. No chart dependency.
 */

type Tone = "primary" | "success" | "info";

export function Sparkline({
  data,
  label,
  tone = "primary",
  className,
}: {
  data: number[];
  /** Screen-reader summary, e.g. "Escaneos por hora". */
  label: string;
  tone?: Tone;
  className?: string;
}) {
  const w = 240;
  const h = 48;
  const pad = 3;
  const max = Math.max(1, ...data);
  const n = data.length;

  const pts = data.map((v, i) => {
    const x = n <= 1 ? pad : pad + (i / (n - 1)) * (w - 2 * pad);
    const y = h - pad - (v / max) * (h - 2 * pad);
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const lastX = (pts[pts.length - 1]?.[0] ?? pad).toFixed(1);
  const area = `${line} L${lastX},${h - pad} L${pad.toFixed(1)},${h - pad} Z`;
  const total = data.reduce((a, b) => a + b, 0);

  const stroke =
    tone === "success"
      ? "stroke-success"
      : tone === "info"
        ? "stroke-info"
        : "stroke-primary";
  const fill =
    tone === "success"
      ? "fill-success/15"
      : tone === "info"
        ? "fill-info/15"
        : "fill-primary/15";

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={`${label}: ${total} en total`}
      className={cn("h-12 w-full", className)}
      preserveAspectRatio="none"
    >
      {n > 0 && <path d={area} className={cn("stroke-none", fill)} />}
      {n > 0 && (
        <path
          d={line}
          className={cn("fill-none", stroke)}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
