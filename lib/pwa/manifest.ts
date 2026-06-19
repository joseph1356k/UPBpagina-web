"use client";

/**
 * IndexedDB-backed offline scan manifest (B4).
 *
 * While online, the scanner downloads an event's full token list and stores it
 * here. Offline, it decides allow/deny/duplicate against this list (and a set
 * of locally-recorded check-ins, to catch duplicates without the server). On
 * reconnect, queued scans (see scan-queue.ts) reconcile against the server,
 * which remains the source of truth.
 *
 * Separate IndexedDB from the scan queue so the two concerns stay independent.
 */

const DB_NAME = "upb-scanner-manifest";
const DB_VERSION = 1;
const MANIFEST_STORE = "manifest";
const CHECKIN_STORE = "offline_checkins";

export interface ManifestEntry {
  token: string;
  name: string;
  status: string;
}

export interface StoredManifest {
  ceremonyId: string;
  generatedAt: string;
  entries: ManifestEntry[];
  /** ms epoch when this device cached it. */
  savedAt: number;
}

let _dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(MANIFEST_STORE)) {
        db.createObjectStore(MANIFEST_STORE, { keyPath: "ceremonyId" });
      }
      if (!db.objectStoreNames.contains(CHECKIN_STORE)) {
        db.createObjectStore(CHECKIN_STORE, { keyPath: "token" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function saveManifest(m: {
  ceremonyId: string;
  generatedAt: string;
  entries: ManifestEntry[];
}): Promise<void> {
  const stored: StoredManifest = { ...m, savedAt: Date.now() };
  await tx(MANIFEST_STORE, "readwrite", (s) => s.put(stored));
}

export async function loadManifest(
  ceremonyId: string,
): Promise<StoredManifest | null> {
  const r = await tx(
    MANIFEST_STORE,
    "readonly",
    (s) => s.get(ceremonyId) as IDBRequest<StoredManifest | undefined>,
  );
  return r ?? null;
}

export async function clearManifest(ceremonyId: string): Promise<void> {
  await tx(MANIFEST_STORE, "readwrite", (s) => s.delete(ceremonyId));
}

/** Record a locally-admitted token so re-scans offline are caught as dupes. */
export async function recordOfflineCheckIn(
  token: string,
  ceremonyId: string,
): Promise<void> {
  await tx(CHECKIN_STORE, "readwrite", (s) =>
    s.put({ token, ceremonyId, at: Date.now() }),
  );
}

export async function hasOfflineCheckIn(token: string): Promise<boolean> {
  const r = await tx(
    CHECKIN_STORE,
    "readonly",
    (s) => s.get(token) as IDBRequest<unknown>,
  );
  return r != null;
}
