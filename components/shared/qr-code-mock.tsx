import { cn } from "@/lib/utils";

interface QrCodeMockProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Visually realistic QR code mock — generates a deterministic pseudo-QR
 * pattern from a token (finder patterns, timing, alignment, random data).
 *
 * Looks like a real QR. Is NOT scannable.
 *
 * Replace with a real generator (qrcode / qrcode.react) once we have
 * signed payloads from the backend.
 */
export function QrCodeMock({ value, size = 240, className }: QrCodeMockProps) {
  const grid = generateGrid(value, 33);
  const cell = size / grid.length;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label={`Código QR para ${value}`}
      className={cn("block", className)}
    >
      <rect width={size} height={size} fill="white" />
      {grid.map((row, y) =>
        row.map((on, x) =>
          on ? (
            <rect
              key={`${x}-${y}`}
              x={x * cell}
              y={y * cell}
              width={cell}
              height={cell}
              fill="black"
              shapeRendering="crispEdges"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Deterministic pseudo-QR generator                                  */
/* ------------------------------------------------------------------ */

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function generateGrid(token: string, size: number): boolean[][] {
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false),
  );

  /* Finder patterns at three corners (7x7) */
  const drawFinder = (cx: number, cy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isOuter = x === 0 || x === 6 || y === 0 || y === 6;
        const isCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        grid[cy + y][cx + x] = isOuter || isCenter;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  /* Timing patterns */
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  /* Alignment pattern (5x5) near bottom-right */
  const ax = size - 9;
  const ay = size - 9;
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      const isOuter = x === 0 || x === 4 || y === 0 || y === 4;
      const isCenter = x === 2 && y === 2;
      if (isOuter || isCenter) grid[ay + y][ax + x] = true;
    }
  }

  /* Data area: deterministic pseudo-random from token */
  let seed = hash(token) || 1;
  const next = () => {
    seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
    return seed;
  };

  const isReserved = (x: number, y: number): boolean => {
    if (x < 9 && y < 9) return true;
    if (x >= size - 8 && y < 9) return true;
    if (x < 9 && y >= size - 8) return true;
    if (x === 6 || y === 6) return true;
    if (x >= ax && x < ax + 5 && y >= ay && y < ay + 5) return true;
    return false;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (isReserved(x, y)) continue;
      grid[y][x] = next() % 2 === 0;
    }
  }

  return grid;
}
