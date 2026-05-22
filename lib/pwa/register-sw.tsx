"use client";

/**
 * Mounts the service worker registration. Inert in development by
 * default (Next.js dev mode swaps assets fast, SW would interfere).
 *
 * Drop `<RegisterServiceWorker />` somewhere in a client tree (we put
 * it in the scanner layout because that's the route that needs offline).
 */

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Skip in dev (HMR + SW caching = confusion); set
    // NEXT_PUBLIC_ENABLE_SW=true to opt in locally for testing
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.NEXT_PUBLIC_ENABLE_SW !== "true"
    ) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => {
        console.warn("[sw] registration failed:", err);
      });
  }, []);

  return null;
}
