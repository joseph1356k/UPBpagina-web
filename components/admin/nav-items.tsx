import {
  CalendarDays,
  FileBarChart2,
  GraduationCap,
  History,
  LayoutDashboard,
  ScanLine,
  Settings,
  Tags,
  Upload,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/lib/constants";
import type { UserRole } from "@/lib/types";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  comingSoon?: boolean;
  /** Staff roles allowed to see this item. Omitted = all staff in /admin. */
  roles?: UserRole[];
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
        roles: ["admin", "coordinator"],
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
        label: "Tipos de evento",
        href: ROUTES.adminTipos,
        icon: Tags,
        roles: ["admin"],
      },
      {
        label: "Usuarios",
        href: ROUTES.adminUsuarios,
        icon: Users,
        roles: ["admin"],
      },
      {
        label: "Auditoría",
        href: ROUTES.adminAuditoria,
        icon: History,
        roles: ["admin"],
      },
      {
        label: "Configuración",
        href: ROUTES.adminConfiguracion,
        icon: Settings,
        roles: ["admin"],
      },
    ],
  },
];
