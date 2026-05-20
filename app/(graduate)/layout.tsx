import { GraduatePortalShell } from "@/components/graduate/portal-shell";

export default function GraduateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GraduatePortalShell>{children}</GraduatePortalShell>;
}
