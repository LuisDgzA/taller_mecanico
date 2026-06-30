import {
  CarFront,
  ClipboardList,
  LayoutGrid,
  ShieldCheck,
  type LucideIcon,
  Users,
} from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const dashboardNavItems: DashboardNavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: LayoutGrid },
  { href: "/dashboard/servicios", label: "Servicios", icon: ClipboardList },
  { href: "/dashboard/clientes", label: "Clientes", icon: CarFront },
  { href: "/dashboard/usuarios", label: "Usuarios", icon: Users },
  { href: "/dashboard/permisos", label: "Permisos", icon: ShieldCheck },
];
