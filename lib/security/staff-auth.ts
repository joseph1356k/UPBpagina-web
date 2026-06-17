/**
 * Server helper — require the request to be an active staff member with
 * one of the given roles. Returns the user+profile or a NextResponse
 * error you can return directly.
 *
 * Usage in a route handler:
 *
 *     const auth = await requireStaff(["admin", "coordinator"]);
 *     if (!auth.ok) return auth.response;
 *     const { userId, role } = auth;
 */

import "server-only";

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { USE_SUPABASE } from "@/lib/supabase/env";
import type { UserRoleDb } from "@/lib/supabase/types";

export type StaffAuthOk = {
  ok: true;
  userId: string;
  role: UserRoleDb;
};

export type StaffAuthFail = {
  ok: false;
  response: NextResponse;
};

export async function requireStaff(
  allowedRoles: UserRoleDb[],
): Promise<StaffAuthOk | StaffAuthFail> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      ),
    };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.active || !allowedRoles.includes(profile.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      ),
    };
  }

  return { ok: true, userId: user.id, role: profile.role };
}

export interface CurrentStaff {
  userId: string;
  fullName: string;
  role: UserRoleDb;
}

/**
 * Resolve the current staff member for Server Components (sidebar, page-level
 * role gating). Unlike `requireStaff`, returns `null` instead of a response, so
 * it's safe to call from RSC. In mock mode returns a stand-in admin so the
 * demo shell renders without auth.
 */
export async function getCurrentStaff(): Promise<CurrentStaff | null> {
  if (!USE_SUPABASE) {
    return {
      userId: "usr_admin_mock",
      fullName: "Administrador (mock)",
      role: "admin",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role, active")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.active) return null;

  return { userId: user.id, fullName: profile.full_name, role: profile.role };
}
