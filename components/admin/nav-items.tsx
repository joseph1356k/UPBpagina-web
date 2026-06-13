import {
  CalendarDays,
  FileBarChart2,
  GraduationCap,
  History,
  LayoutDashboard,
  ScanLine,
  Settings,
  Upload,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/lib/constants";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  comingSoon?: boolean;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "Operación",
    items: [
      {
        label: "Dashboard",
        href: ROUTES.admin,
        icon: LayoutDashboard,
        exact: true,
      },
      {
        label: "Eventos",
        href: ROUTES.adminCeremonias,
        icon: CalendarDays,
      },
      {
        label: "Participantes",
        href: ROUTES.adminGraduandos,
        icon: GraduationCap,
      },
      {
        label: "Invitados",
        href: ROUTES.adminInvitados,
        icon: UsersRound,
      },
    ],
  },
  {
    label: "Datos",
    items: [
      {
        label: "Importar base",
        href: ROUTES.adminImportar,
        icon: Upload,
      },
      {
        label: "Escaneos",
        href: ROUTES.adminEscaneos,
        icon: ScanLine,
      },
      {
        label: "Reportes",
        href: ROUTES.adminReportes,
        icon: FileBarChart2,
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        label: "Usuarios",
        href: ROUTES.adminUsuarios,
        icon: Users,
      },
      {
        label: "Auditoría",
        href: ROUTES.adminAuditoria,
        icon: History,
      },
      {
        label: "Configuración",
        href: ROUTES.adminConfiguracion,
        icon: Settings,
      },
    ],
  },
];
