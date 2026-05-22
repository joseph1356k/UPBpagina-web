import { notFound } from "next/navigation";

import { getCeremony, getGraduate } from "@/lib/data";
import { OtpVerificationForm } from "./otp-form";

export const metadata = {
  title: "Verificar identidad",
};

export default async function VerificacionPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { gid } = await searchParams;

  // gid must be a non-empty string
  if (!gid || typeof gid !== "string") notFound();

  const graduate = await getGraduate(gid);

  // Graduate must exist and be in a registrable state
  if (!graduate || graduate.status === "not_eligible") notFound();

  const ceremony = await getCeremony(graduate.ceremonyId);
  if (!ceremony) notFound();

  return <OtpVerificationForm graduate={graduate} ceremony={ceremony} />;
}
