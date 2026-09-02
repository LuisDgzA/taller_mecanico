"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { dashboardNavItems, isActivePath } from "./navigation-items";

type DesktopSidebarProps = {
  canViewServicios?: boolean;
  canViewClientes?: boolean;
  canViewUsuarios?: boolean;
  canViewPermisos?: boolean;
  userNombre: string | null;
  userCorreo: string | null;
};

export function DesktopSidebar({
  canViewServicios = true,
  canViewClientes = true,
  canViewUsuarios = true,
  canViewPermisos = true,
  userNombre,
  userCorreo,
}: DesktopSidebarProps) {
  const pathname = usePathname();

  const visibleItems = dashboardNavItems.filter((item) => {
    if (item.href === "/dashboard/servicios" && !canViewServicios) return false;
    if (item.href === "/dashboard/clientes" && !canViewClientes) return false;
    if (item.href === "/dashboard/usuarios" && !canViewUsuarios) return false;
    if (item.href === "/dashboard/permisos" && !canViewPermisos) return false;
    return true;
  });

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-60 border-r border-outline-variant bg-surface-container-lowest z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-outline-variant">
        <p className="text-sm font-bold text-primary">WorkshopPro</p>
        <p className="text-[11px] text-on-surface-variant mt-0.5">Management Suite</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
              )}
            >
              <Icon
                className={cn(
                  "size-5 shrink-0",
                  active ? "stroke-[2]" : "stroke-[1.75]",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-outline-variant px-4 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
            {userNombre?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-on-surface">
              {userNombre ?? "—"}
            </p>
            <p className="truncate text-[11px] text-on-surface-variant">
              {userCorreo ?? "—"}
            </p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 text-xs font-medium text-red-700 transition hover:bg-red-100"
          >
            <LogOut className="size-3.5" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
