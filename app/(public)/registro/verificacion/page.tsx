import { notFound } from "next/navigation";

import { USE_SUPABASE } from "@/lib/supabase/env";
import { OtpVerificationForm } from "./otp-form";

export const metadata = {
  title: "Verificar identidad",
};

/**
 * Fetch the minimal graduate + ceremony context for the OTP step.
 *
 * Uses the service role so we don't depend on RLS — the graduate has NOT
 * authenticated yet at this point. We only return display-safe fields
 * (name, email — already masked in the UI, plus ceremony name/date/venue).
 */
async function loadContext(gid: string) {
  if (!USE_SUPABASE) {
    // Mock mode: delegate to lib/data (server-only is fine in RSC)
    const { getGraduate, getCeremony } = await import("@/lib/data");
    const graduate = await getGraduate(gid);
    if (!graduate || graduate.status === "not_eligible") return null;
    const ceremony = await getCeremony(graduate.ceremonyId);
    if (!ceremony) return null;
    return { graduate, ceremony };
  }

  const { createServiceClient } = await import("@/lib/supabase/service");
  const { graduateFromRow, ceremonyFromRow } = await import("@/lib/db/mappers");

  const service = createServiceClient();
  const { data: gradRow } = await service
    .from("graduates")
    .select("*")
    .eq("id", gid)
    .maybeSingle();
  if (!gradRow || gradRow.status === "not_eligible") return null;

  const { data: cerRow } = await service
    .from("ceremonies")
    .select("*")
    .eq("id", gradRow.ceremony_id)
    .maybeSingle();
  if (!cerRow) return null;

  return {
    graduate: graduateFromRow(gradRow),
    ceremony: ceremonyFromRow(cerRow),
  };
}

export default async function VerificacionPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { gid } = await searchParams;

  if (!gid || typeof gid !== "string") notFound();

  const ctx = await loadContext(gid);
  if (!ctx) notFound();

  return <OtpVerificationForm graduate={ctx.graduate} ceremony={ctx.ceremony} />;
}
