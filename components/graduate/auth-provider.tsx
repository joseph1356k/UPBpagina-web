"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { BrandMark } from "@/components/shared/brand-mark";
import { ROUTES } from "@/lib/constants";
// Client-safe data sources:
//   - Mock mode: in-memory arrays from lib/mock
//   - Real mode: /api/graduate/* endpoints (validated by session cookie)
import { getCeremony, getGraduate, getGuests } from "@/lib/mock";
import { USE_SUPABASE } from "@/lib/supabase/env";
import {
  clearSession,
  getSession,
  type GraduateSession,
} from "@/lib/session";
import type { Ceremony, Graduate, Guest } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface NewGuestInput {
  fullName: string;
  documentNumber?: string | null;
  email?: string | null;
  relationship?: string | null;
}

export type GuestPatch = Partial<NewGuestInput>;

interface GraduatePortalContextValue {
  /** Authenticated graduate session (validated via sessionStorage). */
  session: GraduateSession;
  graduate: Graduate;
  ceremony: Ceremony;
  guests: Guest[];

  /* Quota helpers ─ already-computed for convenience */
  quotaUsed: number;
  quotaTotal: number;
  quotaAvailable: number;
  isFull: boolean;

  /* Mutations ─ all async to mirror the future backend signatures */
  addGuest(input: NewGuestInput): Promise<Guest>;
  updateGuest(id: string, patch: GuestPatch): Promise<Guest>;
  removeGuest(id: string): Promise<void>;
  sendInvitations(): Promise<{ sent: number }>;

  signOut(): void;
}

const GraduatePortalContext = createContext<
  GraduatePortalContextValue | null
>(null);

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */

export function useGraduatePortal(): GraduatePortalContextValue {
  const ctx = useContext(GraduatePortalContext);
  if (!ctx) {
    throw new Error(
      "useGraduatePortal must be used inside <GraduateAuthProvider>",
    );
  }
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function nowIso(): string {
  return new Date().toISOString();
}

function sortGuestsByCreatedAt(a: Guest, b: Guest): number {
  return a.createdAt.localeCompare(b.createdAt);
}

/** Simulated network latency for mock mutations. */
function delay(ms = 350): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */

type LoadState =
  | { status: "loading" }
  | {
      status: "ready";
      session: GraduateSession;
      graduate: Graduate;
      ceremony: Ceremony;
      guests: Guest[];
    };

interface ProviderProps {
  children: React.ReactNode;
}

export function GraduateAuthProvider({ children }: ProviderProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  /* ── Initial load ─────────────────────────────────────────────── */

  useEffect(() => {
    async function init() {
      const session = getSession();

      // No session → bounce to registration
      if (!session) {
        router.replace(ROUTES.registro);
        return;
      }

      let graduate: Graduate | null;
      let ceremony: Ceremony | null;
      let guests: Guest[];

      if (USE_SUPABASE) {
        // Real mode: one round trip to /api/graduate/me; the cookie is
        // attached automatically and the server filters by it.
        try {
          const res = await fetch("/api/graduate/me", {
            credentials: "same-origin",
            cache: "no-store",
          });
          if (!res.ok) {
            clearSession();
            router.replace(ROUTES.registro);
            return;
          }
          const json = (await res.json()) as {
            ok: boolean;
            graduate: Graduate;
            ceremony: Ceremony;
            guests: Guest[];
          };
          graduate = json.graduate;
          ceremony = json.ceremony;
          guests = json.guests ?? [];
        } catch {
          clearSession();
          router.replace(ROUTES.registro);
          return;
        }
      } else {
        // Mock mode: lookup in-memory arrays
        [graduate, ceremony, guests] = await Promise.all([
          getGraduate(session.graduateId),
          getCeremony(session.ceremonyId),
          getGuests({ graduateId: session.graduateId }),
        ]);
      }

      if (!graduate || !ceremony) {
        clearSession();
        router.replace(ROUTES.registro);
        return;
      }

      setState({
        status: "ready",
        session,
        graduate,
        ceremony,
        guests: [...guests].sort(sortGuestsByCreatedAt),
      });
    }

    void init();
  }, [router]);

  /* ── Mutations (no-ops until ready) ───────────────────────────── */

  const addGuest = useCallback<GraduatePortalContextValue["addGuest"]>(
    async (input) => {
      if (state.status !== "ready") {
        throw new Error("Portal no inicializado");
      }

      const active = state.guests.filter((g) => g.status !== "revoked").length;
      if (active >= state.graduate.maxGuests) {
        throw new Error("Has alcanzado el máximo de invitados permitidos.");
      }

      let newGuest: Guest;

      if (USE_SUPABASE) {
        const res = await fetch("/api/graduate/guests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            fullName: input.fullName.trim(),
            documentNumber: input.documentNumber?.trim() || null,
            email: input.email?.trim() || null,
            relationship: input.relationship?.trim() || null,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          guest?: Guest;
          error?: string;
        };
        if (!res.ok || json.ok !== true || !json.guest) {
          if (json.error === "quota_exceeded") {
            throw new Error("Has alcanzado el máximo de invitados permitidos.");
          }
          throw new Error("No se pudo crear el invitado.");
        }
        newGuest = json.guest;
      } else {
        await delay();
        newGuest = {
          id: `gst_new_${randomId()}`,
          graduateId: state.graduate.id,
          ceremonyId: null,
          fullName: input.fullName.trim(),
          documentNumber: input.documentNumber?.trim() || null,
          email: input.email?.trim() || null,
          relationship: input.relationship?.trim() || null,
          status: "pending",
          invitationToken: `tok_${randomId()}${randomId()}`,
          invitedAt: null,
          checkedInAt: null,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
      }

      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return { ...prev, guests: [...prev.guests, newGuest] };
      });

      return newGuest;
    },
    [state],
  );

  const updateGuest = useCallback<GraduatePortalContextValue["updateGuest"]>(
    async (id, patch) => {
      if (state.status !== "ready") {
        throw new Error("Portal no inicializado");
      }
      const target = state.guests.find((g) => g.id === id);
      if (!target) throw new Error("Invitado no encontrado");
      if (target.status !== "pending") {
        throw new Error(
          "Solo puedes editar invitados en borrador. Para los enviados, debes revocar y crear uno nuevo.",
        );
      }

      let updated: Guest;

      if (USE_SUPABASE) {
        const res = await fetch(`/api/graduate/guests/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            fullName: patch.fullName?.trim(),
            documentNumber:
              patch.documentNumber === undefined
                ? undefined
                : patch.documentNumber?.trim() || null,
            email:
              patch.email === undefined ? undefined : patch.email?.trim() || null,
            relationship:
              patch.relationship === undefined
                ? undefined
                : patch.relationship?.trim() || null,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          guest?: Guest;
        };
        if (!res.ok || json.ok !== true || !json.guest) {
          throw new Error("No se pudo actualizar el invitado.");
        }
        updated = json.guest;
      } else {
        await delay();
        updated = {
          ...target,
          fullName: patch.fullName?.trim() ?? target.fullName,
          documentNumber:
            patch.documentNumber === undefined
              ? target.documentNumber
              : patch.documentNumber?.trim() || null,
          email:
            patch.email === undefined
              ? target.email
              : patch.email?.trim() || null,
          relationship:
            patch.relationship === undefined
              ? target.relationship
              : patch.relationship?.trim() || null,
          updatedAt: nowIso(),
        };
      }

      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          guests: prev.guests.map((g) => (g.id === id ? updated : g)),
        };
      });

      return updated;
    },
    [state],
  );

  const removeGuest = useCallback<GraduatePortalContextValue["removeGuest"]>(
    async (id) => {
      if (state.status !== "ready") {
        throw new Error("Portal no inicializado");
      }
      const target = state.guests.find((g) => g.id === id);
      if (!target) throw new Error("Invitado no encontrado");
      if (target.status === "checked_in") {
        throw new Error(
          "No puedes eliminar a un invitado que ya ingresó a la ceremonia.",
        );
      }

      if (USE_SUPABASE) {
        const res = await fetch(`/api/graduate/guests/${encodeURIComponent(id)}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          mode?: "revoked" | "deleted";
          guest?: Guest;
        };
        if (!res.ok || json.ok !== true) {
          throw new Error("No se pudo eliminar el invitado.");
        }
        setState((prev) => {
          if (prev.status !== "ready") return prev;
          if (json.mode === "revoked" && json.guest) {
            return {
              ...prev,
              guests: prev.guests.map((g) => (g.id === id ? json.guest! : g)),
            };
          }
          return { ...prev, guests: prev.guests.filter((g) => g.id !== id) };
        });
        return;
      }

      await delay();

      setState((prev) => {
        if (prev.status !== "ready") return prev;
        if (target.status === "invited") {
          // Soft-revoke (keep audit trail)
          return {
            ...prev,
            guests: prev.guests.map((g) =>
              g.id === id
                ? { ...g, status: "revoked" as const, updatedAt: nowIso() }
                : g,
            ),
          };
        }
        // Pending or already-revoked → physical delete
        return {
          ...prev,
          guests: prev.guests.filter((g) => g.id !== id),
        };
      });
    },
    [state],
  );

  const sendInvitations = useCallback<
    GraduatePortalContextValue["sendInvitations"]
  >(async () => {
    if (state.status !== "ready") {
      throw new Error("Portal no inicializado");
    }
    const pending = state.guests.filter((g) => g.status === "pending");
    if (pending.length === 0) {
      throw new Error("No hay invitados pendientes por enviar.");
    }

    if (USE_SUPABASE) {
      const res = await fetch("/api/guests/send-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ graduateId: state.graduate.id }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        sent?: number;
        skipped?: number;
        error?: string;
      };
      if (!res.ok || json.ok !== true) {
        throw new Error("No se pudieron enviar las invitaciones.");
      }

      // Reflect the new statuses locally
      const ts = nowIso();
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          guests: prev.guests.map((g) =>
            g.status === "pending"
              ? { ...g, status: "invited" as const, invitedAt: ts, updatedAt: ts }
              : g,
          ),
        };
      });
      return { sent: json.sent ?? pending.length };
    }

    await delay(700);

    const ts = nowIso();
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      return {
        ...prev,
        guests: prev.guests.map((g) =>
          g.status === "pending"
            ? { ...g, status: "invited" as const, invitedAt: ts, updatedAt: ts }
            : g,
        ),
      };
    });

    return { sent: pending.length };
  }, [state]);

  const signOut = useCallback(() => {
    clearSession();
    if (USE_SUPABASE) {
      // Fire-and-forget — revokes the token server-side too
      void fetch("/api/auth/graduate/sign-out", {
        method: "POST",
        credentials: "same-origin",
      });
    }
    router.replace(ROUTES.registro);
  }, [router]);

  /* ── Context value (memoised) ─────────────────────────────────── */

  const value = useMemo<GraduatePortalContextValue | null>(() => {
    if (state.status !== "ready") return null;
    const active = state.guests.filter((g) => g.status !== "revoked").length;
    const total = state.graduate.maxGuests;
    return {
      session: state.session,
      graduate: state.graduate,
      ceremony: state.ceremony,
      guests: state.guests,
      quotaUsed: active,
      quotaTotal: total,
      quotaAvailable: Math.max(0, total - active),
      isFull: active >= total,
      addGuest,
      updateGuest,
      removeGuest,
      sendInvitations,
      signOut,
    };
  }, [state, addGuest, updateGuest, removeGuest, sendInvitations, signOut]);

  /* ── Loading / redirecting screen ─────────────────────────────── */

  if (state.status === "loading" || !value) {
    return (
      <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-4 px-4">
        <BrandMark size="md" variant="mark-only" />
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Cargando tu portal…
        </p>
      </div>
    );
  }

  return (
    <GraduatePortalContext.Provider value={value}>
      {children}
    </GraduatePortalContext.Provider>
  );
}
