import { notFound } from "next/navigation";

import { getInvitationByToken } from "@/lib/data";

import { InvitationView } from "./invitation-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const view = await getInvitationByToken(token);
  if (!view) return { title: "Invitación no encontrada" };
  return {
    title: `Invitación · ${view.guest.fullName}`,
    description: `Pase de ingreso para ${view.ceremony.name}.`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const view = await getInvitationByToken(token);
  if (!view) notFound();

  return <InvitationView view={view} token={token} />;
}
