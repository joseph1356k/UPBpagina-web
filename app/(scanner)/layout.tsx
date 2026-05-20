import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";

export default function ScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-foreground text-background">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:px-6">
        <BrandMark size="sm" />
        <Link
          href="/"
          className="text-xs font-medium uppercase tracking-[0.18em] text-background/70 transition-colors hover:text-background"
        >
          Salir
        </Link>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
