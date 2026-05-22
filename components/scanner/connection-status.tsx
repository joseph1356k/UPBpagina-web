"use client";

/**
 * Compact "online / offline + queue" badge for the scanner header.
 * Auto-flushes the IndexedDB queue when the device returns online.
 */

import { useCallback, useEffect, useState } from "react";
import { CloudOff, CloudUpload, Loader2, Wifi } from "lucide-react";
import { toast } from "sonner";

import { useOnline } from "@/lib/pwa/use-online";
import { flushQueue, queueSize } from "@/lib/pwa/scan-queue";

export function ConnectionStatus() {
  const online = useOnline();
  const [queued, setQueued] = useState(0);
  const [flushing, setFlushing] = useState(false);

  // Refresh queue count periodically + on online events
  const refresh = useCallback(async () => {
    try {
      setQueued(await queueSize());
    } catch {
      // IndexedDB not available — ignore
    }
  }, []);

  useEffect(() => {
    // First poll on mount + every 4s. setState is inside refresh() which
    // is a stable callback (useCallback with []), so this is the
    // canonical pattern; the lint rule is a false positive here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, 4000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Auto-flush when we come back online
  useEffect(() => {
    if (!online) return;
    let cancelled = false;
    (async () => {
      try {
        const initialSize = await queueSize();
        if (initialSize === 0) return;
        setFlushing(true);
        const result = await flushQueue();
        if (cancelled) return;
        if (result.ok > 0) {
          toast.success(
            `Sincronizados ${result.ok} escaneos pendientes`,
          );
        }
        if (result.failed > 0) {
          toast.warning(
            `${result.failed} escaneos rechazados por el servidor`,
          );
        }
        await refresh();
      } finally {
        if (!cancelled) setFlushing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [online, refresh]);

  if (online && queued === 0 && !flushing) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-wider text-success ring-1 ring-success/25">
        <Wifi className="size-3" />
        En línea
      </span>
    );
  }

  if (!online) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-wider text-warning ring-1 ring-warning/25">
        <CloudOff className="size-3" />
        Sin conexión
        {queued > 0 && (
          <span className="ml-1 rounded-full bg-warning/20 px-1.5 py-0.5 tabular-nums">
            {queued}
          </span>
        )}
      </span>
    );
  }

  // Online + flushing or queue >0
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-info/15 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-wider text-info ring-1 ring-info/25">
      {flushing ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <CloudUpload className="size-3" />
      )}
      Sincronizando
      {queued > 0 && (
        <span className="ml-1 rounded-full bg-info/20 px-1.5 py-0.5 tabular-nums">
          {queued}
        </span>
      )}
    </span>
  );
}
