"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { dashboardNavItems } from "./navigation-items";

type BottomNavProps = {
  className?: string;
  canViewClientes?: boolean;
  canViewUsuarios?: boolean;
  canViewPermisos?: boolean;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav({
  className,
  canViewClientes = true,
  canViewUsuarios = true,
  canViewPermisos = true,
}: BottomNavProps) {
  const pathname = usePathname();
  const visibleItems = dashboardNavItems.filter((item) => {
    if (item.href === "/dashboard/clientes" && !canViewClientes) {
      return false;
    }

    if (item.href === "/dashboard/usuarios" && !canViewUsuarios) {
      return false;
    }

    if (item.href === "/dashboard/permisos" && !canViewPermisos) {
      return false;
    }

    return true;
  });

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex items-stretch border-t border-outline-variant bg-surface-container-lowest bottom-nav-safe",
        className,
      )}
    >
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-on-surface-variant",
            )}
          >
            <Icon
              className={cn(
                "size-[1.35rem]",
                active ? "stroke-[2.25]" : "stroke-[1.75]",
              )}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
