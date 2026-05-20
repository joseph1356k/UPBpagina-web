"use client";

import { GraduateAuthProvider } from "./auth-provider";
import { GraduateHeader } from "./graduate-header";

/**
 * Client wrapper used by `app/(graduate)/layout.tsx` to bring the
 * authenticated-graduate context into scope for every page under
 * `/portal/*`. Kept separate from the server-side layout so we can
 * mount React context without forcing the layout itself to be a
 * client component.
 */
export function GraduatePortalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GraduateAuthProvider>
      <GraduateHeader />
      <main className="flex flex-1 flex-col bg-brand-surface/40">
        {children}
      </main>
    </GraduateAuthProvider>
  );
}
