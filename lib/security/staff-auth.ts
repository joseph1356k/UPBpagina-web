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
