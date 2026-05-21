import { ScannerUI } from "@/components/scanner/scanner-ui";
import { getCeremonies, getUsers } from "@/lib/mock";

export const metadata = {
  title: "Escáner de ingreso",
};

export default async function ScannerPage() {
  const [ceremonies, users] = await Promise.all([
    getCeremonies(),
    getUsers(),
  ]);

  // Pretend the logged-in user is the first active scanner user.
  const operator = users.find((u) => u.role === "scanner" && u.active) ?? null;

  return <ScannerUI operator={operator} ceremonies={ceremonies} />;
}
