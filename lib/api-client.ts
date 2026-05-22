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

import * as data from "@/lib/data";
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
      if (!USE_SUPABASE) return data.createCeremony(input);
      const r = await call<{ ceremony: Ceremony }>("/api/admin/ceremonies", {
        method: "POST",
        body: input,
      });
      return r.ceremony;
    },
    async update(id: string, patch: data.UpdateCeremonyInput): Promise<Ceremony> {
      if (!USE_SUPABASE) return data.updateCeremony(id, patch);
      const r = await call<{ ceremony: Ceremony }>(
        `/api/admin/ceremonies/${encodeURIComponent(id)}`,
        { method: "PATCH", body: patch },
      );
      return r.ceremony;
    },
  },

  users: {
    async create(input: data.CreateUserInput): Promise<User> {
      if (!USE_SUPABASE) return data.createUser(input);
      const r = await call<{ user: User }>("/api/admin/users", {
        method: "POST",
        body: input,
      });
      return r.user;
    },
    async update(id: string, patch: data.UpdateUserInput): Promise<User> {
      if (!USE_SUPABASE) return data.updateUser(id, patch);
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
      if (!USE_SUPABASE) return data.updateGraduateAdmin(id, patch);
      const r = await call<{ graduate: Graduate }>(
        `/api/admin/graduates/${encodeURIComponent(id)}`,
        { method: "PATCH", body: patch },
      );
      return r.graduate;
    },
  },

  guests: {
    async revoke(id: string): Promise<Guest> {
      if (!USE_SUPABASE) return data.revokeGuestAdmin(id);
      const r = await call<{ guest: Guest }>(
        `/api/admin/guests/${encodeURIComponent(id)}/revoke`,
        { method: "POST" },
      );
      return r.guest;
    },
  },
};
