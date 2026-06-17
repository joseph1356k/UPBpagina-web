/**
 * Client-side mutation helpers.
 *
 * Why this exists:
 *   - In mock mode, components can call `lib/data` mutations directly (they
 *     just mutate the in-memory arrays).
 *   - In real Supabase mode, those same calls would fail because they hit
 *     `lib/db` which imports `next/headers` (server-only).
 *
 * This module bridges both modes:
 *   - Mock mode  → delegates to `lib/data` (in-browser arrays)
 *   - Real mode  → fetches the matching `/api/admin/*` endpoint
 *
 * Components import from here for *all* mutations:
 *
 *     import { adminApi } from "@/lib/api-client";
 *     await adminApi.ceremonies.update(id, patch);
 */

"use client";

// Import TYPES only from lib/data — it's marked "server-only" since it
// statically pulls in lib/db (which uses next/headers). Type-only imports
// are erased at build, so this is safe in client code.
import type * as data from "@/lib/data";

// Runtime mutation implementations for mock mode come from lib/mock directly
// (client-safe — pure in-memory arrays). Real-mode mutations go through fetch.
import * as mock from "@/lib/mock";
import type {
  Ceremony,
  Graduate,
  Guest,
  User,
} from "@/lib/types";
import { USE_SUPABASE } from "@/lib/supabase/env";

type Patch<T> = Partial<T>;

/* ────────────────────────────────────────────────────────────────────
   fetch helper — narrows the surface that touches JSON parsing + errors
   ──────────────────────────────────────────────────────────────────── */

interface FetchOpts {
  method: "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

async function call<T>(path: string, opts: FetchOpts): Promise<T> {
  const res = await fetch(path, {
    method: opts.method,
    headers: { "Content-Type": "application/json" },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: "same-origin",
  });

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // empty body — ignore
  }

  if (!res.ok || (json && typeof json === "object" && "ok" in json && json.ok === false)) {
    const err =
      json && typeof json === "object" && "error" in json
        ? String((json as { error: unknown }).error)
        : `http_${res.status}`;
    throw new Error(err);
  }
  return json as T;
}

/* ────────────────────────────────────────────────────────────────────
   Public API — same signatures as lib/data, swappable
   ──────────────────────────────────────────────────────────────────── */

export const adminApi = {
  ceremonies: {
    async create(input: data.CreateCeremonyInput): Promise<Ceremony> {
      if (!USE_SUPABASE) return mock.createCeremony(input);
      const r = await call<{ ceremony: Ceremony }>("/api/admin/ceremonies", {
        method: "POST",
        body: input,
      });
      return r.ceremony;
    },
    async update(id: string, patch: data.UpdateCeremonyInput): Promise<Ceremony> {
      if (!USE_SUPABASE) return mock.updateCeremony(id, patch);
      const r = await call<{ ceremony: Ceremony }>(
        `/api/admin/ceremonies/${encodeURIComponent(id)}`,
        { method: "PATCH", body: patch },
      );
      return r.ceremony;
    },
  },

  organizers: {
    async set(ceremonyId: string, userIds: string[]): Promise<void> {
      if (!USE_SUPABASE) {
        await mock.setEventOrganizers(ceremonyId, userIds);
        return;
      }
      await call<{ ok: true }>(
        `/api/admin/ceremonies/${encodeURIComponent(ceremonyId)}/organizers`,
        { method: "POST", body: { userIds } },
      );
    },
  },

  users: {
    async create(input: data.CreateUserInput): Promise<User> {
      if (!USE_SUPABASE) return mock.createUser(input);
      const r = await call<{ user: User }>("/api/admin/users", {
        method: "POST",
        body: input,
      });
      return r.user;
    },
    async update(id: string, patch: data.UpdateUserInput): Promise<User> {
      if (!USE_SUPABASE) return mock.updateUser(id, patch);
      const r = await call<{ user: User }>(
        `/api/admin/users/${encodeURIComponent(id)}`,
        { method: "PATCH", body: patch },
      );
      return r.user;
    },
  },

  graduates: {
    async update(
      id: string,
      patch: Patch<Graduate>,
    ): Promise<Graduate> {
      if (!USE_SUPABASE) return mock.updateGraduateAdmin(id, patch);
      const r = await call<{ graduate: Graduate }>(
        `/api/admin/graduates/${encodeURIComponent(id)}`,
        { method: "PATCH", body: patch },
      );
      return r.graduate;
    },
    async bulkImport(
      ceremonyId: string,
      rows: data.BulkGraduateInput[],
    ): Promise<data.BulkImportResult> {
      if (!USE_SUPABASE) return mock.bulkCreateGraduates(ceremonyId, rows);
      return call<data.BulkImportResult & { ok: true }>(
        "/api/admin/graduates/import",
        { method: "POST", body: { ceremonyId, rows } },
      );
    },
  },

  guests: {
    async revoke(id: string): Promise<Guest> {
      if (!USE_SUPABASE) return mock.revokeGuestAdmin(id);
      const r = await call<{ guest: Guest }>(
        `/api/admin/guests/${encodeURIComponent(id)}/revoke`,
        { method: "POST" },
      );
      return r.guest;
    },
  },
};

/* ────────────────────────────────────────────────────────────────────
   Public (unauthenticated) API — self-registration / RSVP
   ──────────────────────────────────────────────────────────────────── */

export const publicApi = {
  async registerAttendee(
    ceremonyId: string,
    input: {
      fullName: string;
      email: string;
      document?: string | null;
      captchaToken?: string;
    },
  ): Promise<data.RegisterAttendeeResult> {
    if (!USE_SUPABASE) {
      return mock.registerAttendee(ceremonyId, {
        fullName: input.fullName,
        email: input.email,
        document: input.document ?? null,
      });
    }
    const res = await fetch(
      `/api/eventos/${encodeURIComponent(ceremonyId)}/registro`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(input),
      },
    );
    const json = await res
      .json()
      .catch(() => ({ ok: false, error: "network" }));
    return json as data.RegisterAttendeeResult;
  },
};
