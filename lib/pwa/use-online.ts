"use client";

import { useEffect, useState } from "react";

/**
 * `navigator.onLine` reactive — re-renders whenever connectivity changes.
 *
 * Returns `true` during SSR and the first client render (we assume
 * online), then updates after mount. This avoids the SSR vs client
 * flash for the common case (device is online).
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    function update() {
      setOnline(navigator.onLine);
    }
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return online;
}
