import { ScannerUI } from "@/components/scanner/scanner-ui";
import { getCeremonies, getUsers } from "@/lib/data";
import { USE_SUPABASE } from "@/lib/supabase/env";
import type { User } from "@/lib/types";

export const metadata = {
  title: "Escáner de ingreso",
};

/** Resolve the operator shown in the scanner header. */
async function getOperator(): Promise<User | null> {
  if (!USE_SUPABASE) {
    // Mock mode: first active scanner from the seed
    const users = await getUsers();
    return users.find((u) => u.role === "scanner" && u.active) ?? null;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    active: profile.active,
    lastSignInAt: profile.last_sign_in_at,
    createdAt: profile.created_at,
  };
}

export default async function ScannerPage() {
  const [ceremonies, operator] = await Promise.all([
    getCeremonies(),
    getOperator(),
  ]);

  return <ScannerUI operator={operator} ceremonies={ceremonies} />;
}
