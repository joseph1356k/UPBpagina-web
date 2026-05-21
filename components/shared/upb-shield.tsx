import { cn } from "@/lib/utils";

interface UpbShieldProps {
  className?: string;
  /** Pixel size of the icon. Defaults to currentSize via className. */
  size?: number;
  /** Use solid white-on-dark variant (for dark backgrounds). */
  monochrome?: "color" | "white" | "dark";
}

/**
 * Stylized UPB heraldic shield — red trumpet cross + gold central shield
 * with "AΩ", oil lamp, and "UPB" lettering.
 *
 * Faithful in spirit to the official UPB crest but rendered as a clean
 * vector for digital use at small sizes. Replace with the official SVG
 * from UPB's brand kit once we have permission to ship it.
 */
export function UpbShield({
  className,
  size,
  monochrome = "color",
}: UpbShieldProps) {
  const red = monochrome === "white" ? "currentColor" : monochrome === "dark" ? "currentColor" : "#A6192E";
  const gold = monochrome === "white" ? "currentColor" : monochrome === "dark" ? "currentColor" : "#E8B931";
  const dark = monochrome === "white" ? "currentColor" : monochrome === "dark" ? "currentColor" : "#1a1a1a";

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden
      className={cn(className)}
    >
      {/* ─── Red trumpet-cross (4 arms) ───────────────────────────── */}
      {/* Top arm */}
      <path
        d="M 50 2 L 41 2 L 35 16 Q 44 20 50 20 Q 56 20 65 16 L 59 2 Z"
        fill={red}
      />
      {/* Bottom arm */}
      <path
        d="M 50 98 L 41 98 L 35 84 Q 44 80 50 80 Q 56 80 65 84 L 59 98 Z"
        fill={red}
      />
      {/* Left arm */}
      <path
        d="M 2 50 L 2 41 L 16 35 Q 20 44 20 50 Q 20 56 16 65 L 2 59 Z"
        fill={red}
      />
      {/* Right arm */}
      <path
        d="M 98 50 L 98 41 L 84 35 Q 80 44 80 50 Q 80 56 84 65 L 98 59 Z"
        fill={red}
      />

      {/* ─── Gold heraldic shield (central) ───────────────────────── */}
      <path
        d="M 26 22
           L 74 22
           L 74 60
           Q 74 78 50 86
           Q 26 78 26 60 Z"
        fill={gold}
        stroke={dark}
        strokeWidth="1"
      />

      {/* ─── Black inner field ────────────────────────────────────── */}
      <path
        d="M 31 27
           L 69 27
           L 69 58
           Q 69 73 50 80
           Q 31 73 31 58 Z"
        fill={dark}
      />

      {/* ─── Alpha (A) and Omega (Ω) at top ───────────────────────── */}
      <text
        x="38"
        y="42"
        fontFamily="'Source Serif 4', Georgia, serif"
        fontSize="11"
        fontWeight="700"
        fill={gold}
        textAnchor="middle"
      >
        A
      </text>
      <text
        x="62"
        y="42"
        fontFamily="'Source Serif 4', Georgia, serif"
        fontSize="11"
        fontWeight="700"
        fill={gold}
        textAnchor="middle"
      >
        Ω
      </text>

      {/* ─── Lamp/flame (center) ─────────────────────────────────── */}
      {/* Lamp body */}
      <ellipse cx="50" cy="56" rx="5" ry="3" fill={gold} />
      <rect x="48" y="55" width="4" height="2" fill={gold} />
      {/* Flame */}
      <path
        d="M 50 53 Q 52 51 51 48 Q 50 49.5 50 51 Q 50 49.5 49 48 Q 48 51 50 53 Z"
        fill={red}
      />

      {/* ─── UPB letters at bottom ───────────────────────────────── */}
      <text
        x="50"
        y="72"
        fontFamily="'Source Serif 4', Georgia, serif"
        fontSize="8"
        fontWeight="700"
        letterSpacing="0.5"
        fill={gold}
        textAnchor="middle"
      >
        UPB
      </text>
    </svg>
  );
}
