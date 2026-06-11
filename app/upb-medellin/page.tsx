import { PRODUCT } from "@/lib/constants";
import { RedirectNotice } from "./redirect-notice";

export const metadata = {
  title: "Redirigiendo al portal oficial UPB",
  description:
    "Estás saliendo de UPB Ceremonias hacia el portal oficial de la Universidad Pontificia Bolivariana.",
  robots: { index: false, follow: false },
};

export default function UpbMedellinRedirectPage() {
  return <RedirectNotice destination={PRODUCT.officialPortalUrl} seconds={3} />;
}
