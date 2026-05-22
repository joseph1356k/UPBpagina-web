import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";
import { ConnectionStatus } from "@/components/scanner/connection-status";
import { RegisterServiceWorker } from "@/lib/pwa/register-sw";

export default function ScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-foreground text-background">
      {/* PWA — registers /sw.js on mount */}
      <RegisterServiceWorker />

      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-6">
        <BrandMark size="sm" inverted />
        <div className="flex items-center gap-3">
          <ConnectionStatus />
          <Link
            href="/"
            className="text-xs font-medium uppercase tracking-[0.18em] text-background/70 transition-colors hover:text-background"
          >
            Salir
          </Link>
        </div>
      </header>
      <main id="main-content" className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
