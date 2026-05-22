"use client";

/**
 * IndexedDB-backed offline scan queue.
 *
 * Scans collected while offline get enqueued here. When the device
 * regains connectivity, the queue auto-flushes to /api/qr/validate
 * with a best-effort strategy:
 *   - Each entry is sent serially (event-day server is one DB)
 *   - On 200, the entry is removed
 *   - On 4xx, the entry is removed (server rejected, log to dead-letter)
 *   - On 5xx / network error, the entry stays for next attempt
 */

const DB_NAME = "upb-scanner";
const DB_VERSION = 1;
const STORE = "queue";

export interface QueuedScan {
  id: string;             // local UUID
  token: string;          // QR token to validate
  capturedAt: number;     // ms epoch
  attempts: number;
}

export interface FlushResult {
  ok: number;
  failed: number;
  retried: number;
}

let _dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

function tx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const store = t.objectStore(STORE);
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function enqueueScan(token: string): Promise<QueuedScan> {
  const entry: QueuedScan = {
    id: crypto.randomUUID(),
    token,
    capturedAt: Date.now(),
    attempts: 0,
  };
  await tx("readwrite", (s) => s.put(entry));
  return entry;
}

export async function listQueue(): Promise<QueuedScan[]> {
  return tx("readonly", (s) => s.getAll() as IDBRequest<QueuedScan[]>);
}

export async function queueSize(): Promise<number> {
  return tx("readonly", (s) => s.count());
}

async function removeFromQueue(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
}

async function bumpAttempts(id: string): Promise<void> {
  const entry = await tx(
    "readonly",
    (s) => s.get(id) as IDBRequest<QueuedScan | undefined>,
  );
  if (!entry) return;
  entry.attempts += 1;
  await tx("readwrite", (s) => s.put(entry));
}

/**
 * Send every queued scan to /api/qr/validate.
 * Returns counts so the UI can show a toast / banner.
 */
export async function flushQueue(): Promise<FlushResult> {
  const entries = await listQueue();
  const result: FlushResult = { ok: 0, failed: 0, retried: 0 };

  for (const entry of entries) {
    try {
      const res = await fetch("/api/qr/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: entry.token }),
        credentials: "same-origin",
      });
      if (res.ok) {
        await removeFromQueue(entry.id);
        result.ok += 1;
      } else if (res.status >= 400 && res.status < 500) {
        // Permanent rejection (invalid token, revoked, etc.) — drop
        await removeFromQueue(entry.id);
        result.failed += 1;
      } else {
        // Transient — keep for next flush
        await bumpAttempts(entry.id);
        result.retried += 1;
      }
    } catch {
      // Network error — keep for next flush
      await bumpAttempts(entry.id);
      result.retried += 1;
    }
  }

  return result;
}

export async function clearQueue(): Promise<void> {
  await tx("readwrite", (s) => s.clear());
}
